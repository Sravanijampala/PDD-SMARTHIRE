'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Upload, Plus, X, Edit2, Save, Eye, Trash2, Lock, User, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { subscribeToUserProfile, updateUserProfile, uploadFileToStorage } from '../../lib/firestore';
import { extractTextFromPDF, extractTextFromImage, extractTextFromDocx, analyzeResumeWithAI } from '../../lib/resumeParser';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [resumeName, setResumeName] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [saved, setSaved] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string>(user?.photoUrl || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Track editing state inside a ref so the Firestore callback (a closure
  // captured once) always sees the current value without needing to re-subscribe.
  const editingRef = useRef(false);
  useEffect(() => { editingRef.current = editing; }, [editing]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to real-time Firestore updates so any change made on
    // another device (web or Android) is reflected here instantly.
    const unsubscribe = subscribeToUserProfile(user.id, (data) => {
      if (data) {
        // Always sync auth context so the header/avatar updates everywhere.
        updateUser({
          name: data.fullName || user.name,
          photoUrl: data.profileImage || user.photoUrl || undefined,
        });

        // Only overwrite local form fields when NOT actively editing.
        // This prevents the listener from stomping on the user's in-progress changes.
        if (!editingRef.current) {
          setName(data.fullName || user.name);
          setEmail(data.email || user.email);
          setPhone(data.phone || '');
          setBio(data.bio || '');
          setSkills(data.skills || []);
          setPhotoUrl(data.profileImage || user.photoUrl || '');
          setResumeUrl(data.resumeURL || '');
          if (data.resumeURL) {
            setResumeName(data.resumeName || '');
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const [uploadError, setUploadError] = useState('');

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Photo must be under 5MB.');
      setTimeout(() => setUploadError(''), 4000);
      return;
    }

    // Instant local preview so the user sees the photo immediately
    const localPreview = URL.createObjectURL(file);
    setPhotoUrl(localPreview);
    setUploadError('');
    setUploadingPhoto(true);

    try {
      let url = '';

      // Try Firebase Storage first (with 10s timeout)
      try {
        const uploadPromise = uploadFileToStorage(user.id, 'profile', file);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase timeout')), 10000)
        );
        url = await Promise.race([uploadPromise, timeoutPromise]);
      } catch {
        // Firebase failed — fallback to local upload
        console.log('Firebase Storage unavailable, using local upload...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.id);
        formData.append('type', 'profile');

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Local upload failed');
        url = data.url;
      }

      // Upload succeeded — replace local preview with real URL
      URL.revokeObjectURL(localPreview);
      setPhotoUrl(url);

      // Try to save to Firestore (may fail if offline — that's ok)
      try {
        await updateUserProfile(user.id, { profileImage: url });
      } catch {
        console.log('Firestore offline — photo saved locally only');
      }
      updateUser({ photoUrl: url });
    } catch (error: any) {
      console.error("Photo upload failed", error);
      setUploadError(error?.message || 'Upload failed.');
      setTimeout(() => setUploadError(''), 5000);
    } finally {
      setUploadingPhoto(false);
    }
    e.target.value = '';
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate if the uploaded resume belongs to the user
    const cleanFileName = file.name
      .toLowerCase()
      .replace(/\.(pdf|docx?)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(resume|cv|document|profile)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanFileName.length > 2) {
      const nameParts = cleanFileName.split(' ').filter(p => p.length > 2);
      const userString = `${name?.toLowerCase() || ''} ${email?.toLowerCase() || ''}`;
      
      const isMatch = nameParts.some(part => userString.includes(part));
      
      if (!isMatch && nameParts.length > 0) {
        alert("Please upload your own resume / upload correct resume. The name on the file does not match your profile details.");
        e.target.value = '';
        return;
      }
    }
    
    setUploadingResume(true);
    try {
      let url = '';

      // 1. Try Firebase Storage first (with 3s timeout to fail fast locally)
      try {
        const uploadPromise = uploadFileToStorage(user.id, 'resumes', file);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase timeout')), 3000)
        );
        url = await Promise.race([uploadPromise, timeoutPromise]);
      } catch {
        // Firebase failed — fallback to local upload
        console.log('Firebase Storage unavailable for resume, using local upload...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.id);
        formData.append('type', 'resumes');

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Local resume upload failed');
        url = data.url;
      }

      setResumeName(file.name);
      setResumeUrl(url);

      let newSkills = skills;
      let newPhone = phone;
      let newBio = bio;

      // 2. Extract text and parse with AI (wrap in its own try-catch so upload still succeeds if parsing fails)
      try {
        let text = '';
        if (file.type === 'application/pdf') {
          // Add timeout to PDF extraction in case worker hangs
          const extractPromise = extractTextFromPDF(file);
          const pdfTimeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('PDF Parse timeout')), 10000));
          text = await Promise.race([extractPromise, pdfTimeout]) as string;
        } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          text = await extractTextFromDocx(file);
        } else if (file.type.startsWith('image/')) {
          text = await extractTextFromImage(file);
        } else {
          text = await file.text();
        }

        const parsedData = await analyzeResumeWithAI(text);
        if (parsedData.isValidResume) {
          if (parsedData.skills) {
            const uniqueSkills = new Set([...skills, ...parsedData.skills]);
            newSkills = Array.from(uniqueSkills);
            setSkills(newSkills);
          }
          if (parsedData.phone) {
            newPhone = parsedData.phone;
            setPhone(newPhone);
          }
          if (parsedData.experienceSummary) {
            newBio = parsedData.experienceSummary;
            setBio(newBio);
          }
        } else {
          alert(`Could not extract enough text from the resume to update profile details. Make sure it's a text-based PDF.`);
        }
      } catch (parseError) {
        console.error("AI parsing failed, but resume was uploaded:", parseError);
        alert(`Failed to parse resume text. The file was uploaded, but profile details were not updated.`);
      }

      // Extract a clean name from the resume filename (e.g. "Jampala_Sravani_Resume.pdf" -> "Jampala Sravani")
      let extractedName = name;
      try {
        const cleanName = file.name
          .replace(/\.(pdf|docx?)$/i, '') // Remove extension
          .replace(/[-_]/g, ' ')          // Replace dashes/underscores with space
          .replace(/\b(resume|cv|document|profile)\b/gi, '') // Remove common words
          .replace(/\s+/g, ' ')           // Remove extra spaces
          .trim();
        
        if (cleanName.length > 2) {
          extractedName = cleanName;
          setName(extractedName);
          updateUser({ name: extractedName }); // Update auth context
        }
      } catch (e) {
        console.error("Failed to extract name from filename", e);
      }

      // 3. Save to Firestore
      try {
        await updateUserProfile(user.id, { 
          resumeURL: url,
          resumeName: file.name, // Save filename so other devices can restore it
          skills: newSkills,
          phone: newPhone,
          bio: newBio,
          fullName: extractedName // Save new name
        });
      } catch {
        console.log('Firestore offline — resume data saved locally to UI only');
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Resume upload failed completely", error);
      alert("Failed to upload resume. Please try again.");
    } finally {
      setUploadingResume(false);
    }
    e.target.value = '';
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s));

  const handleSave = async () => {
    if (user?.id) {
      await updateUserProfile(user.id, {
        fullName: name,
        phone,
        bio,
        skills
      });
      updateUser({ name });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0B1220] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen w-full bg-[#0B1220] text-slate-100">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0B1220]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-extrabold text-white">My Profile</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Saved!</span>}
          {editing ? (
            <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-all">
              <Save size={16} /> Save Changes
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all">
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
        </div>
      </header>

      <div className="w-full px-6 lg:px-16 py-8 max-w-5xl mx-auto space-y-8">
        {/* Profile Header Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
          {/* Avatar + Upload */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-purple-500/60 overflow-hidden bg-purple-600/30 flex items-center justify-center relative">
                {photoUrl ? (
                  <>
                    <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                        <Loader2 className="animate-spin text-white" size={24} />
                      </div>
                    )}
                  </>
                ) : uploadingPhoto ? (
                   <Loader2 className="animate-spin text-purple-300" />
                ) : (
                  <User size={48} className="text-purple-300" />
                )}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full shadow-lg transition-all"
              >
                <Camera size={14} />
              </button>
            </div>
            {uploadError && (
              <p className="text-xs text-red-400 font-semibold mt-1 text-center max-w-[160px]">{uploadError}</p>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Info */}
          <div className="flex-1 w-full">
            {editing ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="text-2xl font-extrabold text-white bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 w-full focus:outline-none focus:border-cyan-500 mb-2"
              />
            ) : (
              <h2 className="text-2xl font-extrabold text-white mb-1">{name}</h2>
            )}
            <p className="text-cyan-400 text-sm font-semibold">{email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-purple-950/60 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-semibold">Candidate</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Details */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h3 className="text-base font-extrabold text-white">Personal Details</h3>
            <div className="space-y-4">
              {[
                { label: 'Phone Number', val: phone, set: setPhone, placeholder: '+91 98765 43210' },
                { label: 'Bio', val: bio, set: setBio, placeholder: 'Short professional bio...' },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">{field.label}</label>
                  {editing ? (
                    <input value={field.val} onChange={e => field.set(e.target.value)} placeholder={field.placeholder}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
                  ) : (
                    <p className="text-sm text-slate-300">{field.val || <span className="text-slate-600 italic">Not set</span>}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <div key={skill} className="flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-full">
                  {skill}
                  {editing && (
                    <button onClick={() => removeSkill(skill)} className="text-cyan-500 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()}
                  placeholder="Add skill and press Enter"
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
                <button onClick={addSkill} className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all"><Plus size={18} /></button>
              </div>
            )}
          </div>

          {/* Resume */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Resume</h3>
            {resumeUrl ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-600/20 rounded-xl"><Upload size={18} className="text-red-400" /></div>
                    <div>
                      <p className="text-sm font-bold text-white">{resumeName || 'Resume.pdf'}</p>
                      <p className="text-xs text-slate-400">PDF Document</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><Eye size={16} /></a>
                    <button onClick={async () => { setResumeUrl(''); await updateUserProfile(user!.id, { resumeURL: '' }); }} className="p-2 bg-slate-800 hover:bg-red-950/60 rounded-xl text-slate-400 hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => resumeInputRef.current?.click()}
                className="w-full py-10 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl flex flex-col items-center gap-3 text-slate-500 hover:text-cyan-400 transition-all group">
                {uploadingResume ? <Loader2 className="animate-spin" /> : <Upload size={32} className="group-hover:scale-110 transition-transform" />}
                <p className="text-sm font-semibold">{uploadingResume ? 'Uploading...' : 'Upload Resume (PDF)'}</p>
              </button>
            )}
            <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} className="hidden" />
          </div>

          {/* Account Actions */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Account</h3>
            <div className="space-y-3">
              <Link href="/forgot-password" className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-2xl hover:border-cyan-500/40 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/20 rounded-xl"><Lock size={18} className="text-blue-400" /></div>
                  <div>
                    <p className="text-sm font-bold text-white">Change Password</p>
                    <p className="text-xs text-slate-400">Update your account password</p>
                  </div>
                </div>
                <ArrowLeft size={16} className="rotate-180 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
