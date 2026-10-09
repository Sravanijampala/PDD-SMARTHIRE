'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, CheckCircle2, ChevronRight, Loader2, Sparkles, Brain, FileText, Target, Check, Code } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { extractTextFromPDF, extractTextFromImage, analyzeResumeWithAI } from '../../lib/resumeParser';
import { upsertUserSkillProfile, seedCompanyTracks, getAllCompanyTracks, CompanyPrepTrack } from '../../lib/careerprepDb';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [parsedData, setParsedData] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('easy');
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [tracks, setTracks] = useState<CompanyPrepTrack[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParsedData(null); // Clear previous state
    setLoading(true);
    
    try {
      // 1. Extract text
      let text = '';
      if (f.type === 'application/pdf') {
        text = await extractTextFromPDF(f);
      } else if (f.type.startsWith('image/')) {
        text = await extractTextFromImage(f);
      } else {
        text = await f.text();
      }
      
      // 2. Parse text
      const data = await analyzeResumeWithAI(text);
      setParsedData(data);
      setDifficulty(data.suggestedDifficulty);
      
      // Load tracks for the final step
      let existingTracks = await getAllCompanyTracks();
      if (existingTracks.length === 0) {
        await seedCompanyTracks();
        existingTracks = await getAllCompanyTracks();
      }
      setTracks(existingTracks.slice(0, 8)); // Just show top 8 for onboarding
      
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Failed to parse resume');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user?.id || !parsedData) return;
    setLoading(true);
    try {
      await upsertUserSkillProfile(user.id, {
        languages: parsedData.languages,
        domainTags: parsedData.domainTags,
        experienceLevel: parsedData.experienceLevel,
        currentDifficultyTier: difficulty,
      });
      // (Optional) save selectedTracks to user favorites in careerprepDb
      
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060E1E] flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-2xl bg-slate-900/60 border border-white/5 rounded-3xl p-8 backdrop-blur-md relative z-10">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' :
                step > s ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
              }`}>
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              {s < 4 && <div className={`w-12 h-1 rounded-full ${step > s ? 'bg-emerald-500/20' : 'bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-white mb-3">Personalize Your Journey</h1>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">Upload your resume and our AI will instantly configure your practice difficulty, languages, and study tracks.</p>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/30 rounded-2xl p-12 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[300px]"
            >
              {loading ? (
                <div className="flex flex-col items-center">
                  <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                  <p className="text-cyan-400 font-medium">Analyzing resume with AI...</p>
                  <p className="text-slate-500 text-xs mt-2">Extracting skills and experience</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <UploadCloud size={32} className="text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Upload Resume</h3>
                  <p className="text-slate-400 text-sm mb-6">PDF, PNG, JPG, DOCX up to 5MB</p>
                  <button className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                    Browse Files
                  </button>
                </>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" onChange={handleFileUpload} />
            <button 
              onClick={() => {
                setParsedData({
                  languages: ['JavaScript', 'Python'],
                  experienceLevel: 'intermediate',
                  domainTags: ['Frontend', 'Backend'],
                  suggestedDifficulty: 'medium',
                  experienceSummary: 'Skipped resume parsing. Default profile loaded.'
                });
                setDifficulty('medium');
                setStep(2);
              }} 
              className="mt-6 text-slate-500 text-sm hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* STEP 2: Review Skills */}
        {step === 2 && parsedData && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={24} className="text-amber-400" />
              <h2 className="text-2xl font-bold text-white">
                {parsedData.isValidResume === false ? "Invalid Document" : "We built your profile"}
              </h2>
            </div>
            
            {parsedData.isValidResume === false ? (
              <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 mb-8 text-center">
                <h4 className="text-red-400 font-bold text-lg mb-2">This is not a resume</h4>
                <p className="text-red-300 text-sm">
                  Please upload a valid resume (PDF, DOCX, or TXT) to get your ATS score and extract your skills.
                </p>
              </div>
            ) : (
              <>
                <p className="text-slate-400 mb-8">Here is what we extracted from your resume. You can edit this later.</p>
                <div className="space-y-6">
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Code size={16} className="text-cyan-400"/> Programming Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.languages?.map((lang: string) => (
                        <span key={lang} className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm">{lang}</span>
                      ))}
                    </div>
                  </div>
              
              <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Target size={16} className="text-purple-400"/> Technical Domains</h3>
                <div className="flex flex-wrap gap-2">
                  {parsedData.domainTags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-sm">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2"><Brain size={16} className="text-amber-400"/> Experience Level</h3>
                  <p className="text-xs text-slate-500">{parsedData.experienceSummary}</p>
                </div>
                <span className="px-4 py-1.5 bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 rounded-lg capitalize">
                  {parsedData.experienceLevel}
                </span>
              </div>

              {/* ATS Score Section */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><FileText size={16} className="text-emerald-400"/> ATS Match Score</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
                    parsedData.atsScore >= 80 ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/50' :
                    parsedData.atsScore >= 60 ? 'bg-amber-900/40 text-amber-400 border-amber-500/50' :
                    'bg-red-900/40 text-red-400 border-red-500/50'
                  }`}>
                    {parsedData.atsScore}/100
                  </div>
                </div>
                <ul className="text-slate-400 text-xs space-y-2 list-disc pl-4 mt-2">
                  {parsedData.atsFeedback?.map((feedback: string, i: number) => (
                    <li key={i}>{feedback}</li>
                  ))}
                </ul>
              </div>
            </div>
            </>
            )}

            <div className="mt-10 flex justify-between items-center">
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white px-4 py-2">Back</button>
              <button onClick={() => setStep(3)} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2.5 px-8 rounded-xl flex items-center gap-2 transition-all">
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Difficulty */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold text-white mb-2">Set Your Challenge Tier</h2>
            <p className="text-slate-400 mb-8">Based on your {parsedData?.experienceLevel || 'intermediate'} level, we recommend starting here.</p>
            
            <div className="space-y-4">
              {[
                { id: 'easy', label: 'Easy', desc: 'Core fundamentals and basic algorithms.', color: 'emerald' },
                { id: 'medium', label: 'Medium', desc: 'Standard interview questions, optimization.', color: 'amber' },
                { id: 'hard', label: 'Hard', desc: 'Complex systems, advanced graphs, DP.', color: 'rose' }
              ].map(tier => (
                <div 
                  key={tier.id}
                  onClick={() => setDifficulty(tier.id as any)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                    difficulty === tier.id 
                      ? `border-${tier.color}-500 bg-${tier.color}-500/10` 
                      : 'border-white/5 bg-slate-800/30 hover:border-white/20'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    difficulty === tier.id ? `border-${tier.color}-500` : 'border-slate-500'
                  }`}>
                    {difficulty === tier.id && <div className={`w-3 h-3 rounded-full bg-${tier.color}-500`} />}
                  </div>
                  <div>
                    <h3 className={`font-bold capitalize text-${tier.color}-400`}>{tier.label}</h3>
                    <p className="text-sm text-slate-400">{tier.desc}</p>
                  </div>
                  {parsedData?.suggestedDifficulty === tier.id && (
                    <span className={`ml-auto px-2.5 py-1 text-xs font-semibold rounded-md bg-${tier.color}-500/20 text-${tier.color}-400`}>Recommended</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white px-4 py-2">Back</button>
              <button onClick={() => setStep(4)} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2.5 px-8 rounded-xl flex items-center gap-2 transition-all">
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Target Companies */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold text-white mb-2">Select Target Companies</h2>
            <p className="text-slate-400 mb-8">We'll prioritize practice questions from these tracks.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-8">
              {tracks.map(track => {
                const isSelected = selectedTracks.has(track.id!);
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      const newSet = new Set(selectedTracks);
                      isSelected ? newSet.delete(track.id!) : newSet.add(track.id!);
                      setSelectedTracks(newSet);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 bg-slate-800/30 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="w-10 h-10 rounded bg-white flex items-center justify-center p-1">
                      {track.logoUrl ? <img src={track.logoUrl} alt="" className="max-w-full max-h-full" /> : <FileText size={20} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{track.companyName}</h3>
                      <p className="text-xs text-slate-500 truncate">{track.industry}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-slate-500'}`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex justify-between items-center">
              <button onClick={() => setStep(3)} className="text-slate-400 hover:text-white px-4 py-2">Back</button>
              <button onClick={handleComplete} disabled={loading} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2.5 px-8 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Finish Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
