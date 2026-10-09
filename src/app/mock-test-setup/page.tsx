'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, UploadCloud, ChevronRight, Briefcase, BarChart } from 'lucide-react';
import { extractTextFromPDF, extractTextFromImage, analyzeResumeWithAI } from '../../lib/resumeParser';

export default function MockTestSetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  const [parsedData, setParsedData] = useState<any>(null);
  
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setParsedData(null); // Clear previous analysis state
    setIsParsing(true);
    setStep(2);

    try {
      let text = '';
      if (uploadedFile.type === 'application/pdf') {
        text = await extractTextFromPDF(uploadedFile);
      } else if (uploadedFile.type.startsWith('image/')) {
        text = await extractTextFromImage(uploadedFile);
      } else {
        text = await uploadedFile.text();
      }

      const analysis = await analyzeResumeWithAI(text);
      setParsedData(analysis);
      if (analysis?.recommendedRoles?.length > 0) {
        setSelectedRole(analysis.recommendedRoles[0]);
      } else {
        setSelectedRole('Software Engineer'); // Default
      }
    } catch (err) {
      console.error(err);
      alert('Failed to parse resume.');
      setStep(1);
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartInterview = () => {
    // Route to the new Security Wizard with the selected params
    const query = new URLSearchParams({
      role: selectedRole,
      difficulty: selectedDifficulty,
      company: 'SmartHire AI' // Default for mock test
    });
    router.push(`/interview-permissions?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#060E1E] flex flex-col p-6 text-white font-sans">
      <div className="max-w-4xl mx-auto w-full pt-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
            AI Mock Test Setup
          </h1>
          <p className="text-slate-400 text-lg">Upload your resume and let our AI tailor the perfect mock interview for you.</p>
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 rounded-3xl p-16 text-center cursor-pointer hover:border-cyan-500 hover:bg-slate-800/50 transition-all bg-slate-900/50"
          >
            <UploadCloud size={64} className="mx-auto text-cyan-400 mb-6" />
            <h3 className="text-2xl font-bold mb-2">Upload Resume</h3>
            <p className="text-slate-400 mb-6">PDF, PNG, or JPG files up to 5MB</p>
            <button className="bg-cyan-600 hover:bg-cyan-500 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-cyan-900/20">
              Browse Files
            </button>
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg,.txt" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* STEP 2: Parsing & Review */}
        {step === 2 && (
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-700/50">
            {isParsing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 size={48} className="text-cyan-400 animate-spin mb-6" />
                <h3 className="text-xl font-bold mb-2">AI Analyzing Resume...</h3>
                <p className="text-slate-400 text-sm">Extracting skills, education, and experience</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-4 text-emerald-400 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Analysis Complete</h3>
                    <p className="text-sm text-emerald-500/70">{file?.name}</p>
                  </div>
                </div>

                {parsedData?.isValidResume === false ? (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 text-center">
                    <h4 className="text-red-400 font-bold text-lg mb-2">Invalid Document</h4>
                    <p className="text-red-300 text-sm">
                      This document doesn't look like a resume. Please upload a resume (PDF, DOCX, or TXT) to get your ATS score.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
                      <h4 className="text-slate-400 text-sm font-bold mb-3 uppercase tracking-wider">Detected Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {parsedData?.skills?.map((s: string) => (
                          <span key={s} className="bg-cyan-900/40 text-cyan-300 border border-cyan-700/50 px-3 py-1 rounded-full text-sm">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* ATS Score Section */}
                    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-slate-400 text-sm font-bold uppercase tracking-wider">ATS Score</h4>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
                          parsedData?.atsScore >= 80 ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/50' :
                          parsedData?.atsScore >= 60 ? 'bg-amber-900/40 text-amber-400 border-amber-500/50' :
                          'bg-red-900/40 text-red-400 border-red-500/50'
                        }`}>
                          {parsedData?.atsScore}/100
                        </div>
                      </div>
                      <ul className="text-slate-300 text-xs space-y-2 mt-4 list-disc pl-4">
                        {parsedData?.atsFeedback?.map((feedback: string, i: number) => (
                          <li key={i}>{feedback}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-700/50 flex justify-end">
                  <button 
                    onClick={() => setStep(3)}
                    className="bg-cyan-600 hover:bg-cyan-500 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20"
                  >
                    Continue to Configuration <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Role & Difficulty */}
        {step === 3 && parsedData && (
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-700/50 animate-in slide-in-from-right duration-300">
            <h3 className="text-2xl font-bold mb-8">Test Configuration</h3>
            
            <div className="space-y-8">
              {/* Role Selection */}
              <div>
                <h4 className="text-slate-400 text-sm font-bold mb-4 flex items-center gap-2">
                  <Briefcase size={16} /> RECOMMENDED ROLES
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(parsedData.recommendedRoles || []).map((role: string) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`p-4 rounded-2xl border text-left font-bold transition-all ${
                        selectedRole === role 
                        ? 'bg-cyan-900/30 border-cyan-400 text-cyan-300' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <h4 className="text-slate-400 text-sm font-bold mb-4 flex items-center gap-2">
                  <BarChart size={16} /> SELECT DIFFICULTY
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {['Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff as any)}
                      className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                        selectedDifficulty === diff 
                        ? 'bg-indigo-900/30 border-indigo-400 text-indigo-300' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-10 flex justify-between">
              <button 
                onClick={() => setStep(2)}
                className="text-slate-400 hover:text-white px-6 py-4 font-bold transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleStartInterview}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 px-10 py-4 rounded-2xl text-white font-extrabold text-lg flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20"
              >
                Start Security Wizard <ChevronRight size={24} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
