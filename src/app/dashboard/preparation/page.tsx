"use client";
import React from 'react';
import {
  ClipboardList, BookOpen, Library, CalendarDays,
  Hammer, GraduationCap, ArrowLeft, ChevronRight,
  Target, Info, Star, Zap
} from 'lucide-react';
import Link from 'next/link';

export default function PreparationPath() {
  const modules = [
    {
      title: "Syllabus & Pattern Analysis",
      subtitle: "Understand what to study and how",
      description: "Deep dive into exam structures, marking schemes, and question patterns.",
      icon: <ClipboardList size={24} />,
      color: "amber",
      progress: 100
    },
    {
      title: "Foundation & Basics",
      subtitle: "Strengthen your core concepts",
      description: "Master the fundamental principles of DSA, System Design, and OOPs.",
      icon: <BookOpen size={24} />,
      color: "purple",
      progress: 60
    },
    {
      title: "Study Material & Resources",
      subtitle: "Curated content for deep learning",
      description: "Access top-tier books, documentation, and hand-picked articles.",
      icon: <Library size={24} />,
      color: "emerald",
      progress: 20
    },
    {
      title: "Daily Practice & Assignments",
      subtitle: "Consistent coding and theory practice",
      description: "Daily coding challenges and conceptual quizzes to keep you sharp.",
      icon: <CalendarDays size={24} />,
      color: "blue",
      progress: 0
    },
    {
      title: "Projects & Mock Tests",
      subtitle: "Apply knowledge in real scenarios",
      description: "Build portfolio-ready projects and take realistic mock interviews.",
      icon: <Hammer size={24} />,
      color: "pink",
      progress: 0
    },
    {
      title: "Revision & Consistency",
      subtitle: "Track progress and stay focused",
      description: "Spaced repetition techniques and weekly consistency analytics.",
      icon: <GraduationCap size={24} />,
      color: "orange",
      progress: 0
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-20 overflow-x-hidden">
      {/* Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-indigo-600 to-indigo-800 pt-20 pb-32 px-10 relative overflow-hidden">
        {/* Abstract Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/dashboard" className="inline-flex items-center gap-3 text-indigo-100/80 hover:text-white transition-all mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
               <ArrowLeft size={18} />
            </div>
            <span className="font-bold text-sm tracking-wide uppercase">Back to Overview</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-white uppercase tracking-widest">
                  Level 2: Intermediate
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-6">
                Preparation Path
              </h1>
              <p className="text-indigo-100/70 text-lg md:text-xl leading-relaxed font-medium">
                Our AI engine has mapped out a structured journey to help you master
                your dream engineering role with <span className="text-white font-bold underline decoration-indigo-400">data-driven</span> focus.
              </p>
            </div>

            {/* Progress Card */}
            <div className="bg-[#020617]/40 backdrop-blur-2xl rounded-[32px] p-8 border border-white/10 shadow-2xl min-w-[320px]">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Target size={20} className="text-white" />
                     </div>
                     <div>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Overall Progress</p>
                        <p className="text-white font-bold text-lg">35.4%</p>
                     </div>
                  </div>
                  <div className="text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-lg text-xs font-bold">
                    +2.1% Today
                  </div>
               </div>
               <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: '35.4%' }} />
               </div>
               <p className="text-slate-400 text-[11px] flex items-center gap-2">
                 <Info size={14} /> Keep it up! You're ahead of 68% of users.
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-6xl mx-auto px-10 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, index) => (
            <ModuleCard key={index} {...module} />
          ))}
        </div>
      </div>

      {/* Weekly Motivation */}
      <div className="max-w-6xl mx-auto px-10 mt-20">
         <div className="p-10 rounded-[40px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-white/5 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 rounded-3xl bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                  <Zap size={36} className="text-white" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Ready for a challenge?</h3>
                  <p className="text-slate-400 max-w-sm">Take a surprise 5-minute conceptual quiz to boost your "Foundation" score by +15 points.</p>
               </div>
            </div>
            <button className="whitespace-nowrap px-10 py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:scale-[1.05] transition-all shadow-xl">
               Take Quiz Now
            </button>
         </div>
      </div>
    </div>
  );
}

function ModuleCard({ title, subtitle, description, icon, color, progress }: any) {
  const colors: Record<string, string> = {
    amber: 'text-amber-400 bg-amber-400/10 group-hover:bg-amber-400/20',
    purple: 'text-purple-400 bg-purple-400/10 group-hover:bg-purple-400/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20',
    pink: 'text-pink-400 bg-pink-500/10 group-hover:bg-pink-500/20',
    orange: 'text-orange-400 bg-orange-500/10 group-hover:bg-orange-500/20'
  };

  const progressColors: Record<string, string> = {
    amber: 'bg-amber-400',
    purple: 'bg-purple-400',
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    pink: 'bg-pink-400',
    orange: 'bg-orange-400'
  };

  return (
    <div className="group p-8 rounded-[36px] bg-[#020617]/60 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all cursor-pointer flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-start mb-8">
        <div className={`p-4 rounded-2xl ${colors[color]} transition-all duration-300`}>
          {icon}
        </div>
        <ChevronRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{title}</h3>
        <p className="text-[13px] text-slate-500 font-bold mb-4">{subtitle}</p>
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{description}</p>
      </div>

      <div className="mt-8 pt-8 border-t border-white/5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
          <span className="text-xs font-bold text-white">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColors[color]} transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
