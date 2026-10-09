'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Star, BookOpen, Code, MessageSquare, FileText, Play,
  ChevronRight, Lock, Download, CheckCircle2, Zap, Eye, EyeOff,
  Loader2, BarChart3, Clock, Building
} from 'lucide-react';
import {
  getInterviewKit, getQuestionsForKit, getResourcesForKit,
  InterviewKit, QuestionBankItem, KitResource, QuestionCategory
} from '../../../lib/interviewKitDb';

type Tab = 'overview' | 'questions' | 'coding' | 'experiences' | 'resources';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Building size={16} /> },
  { id: 'questions', label: 'Question Bank', icon: <BookOpen size={16} /> },
  { id: 'coding', label: 'Coding Rounds', icon: <Code size={16} /> },
  { id: 'experiences', label: 'Experiences', icon: <MessageSquare size={16} /> },
  { id: 'resources', label: 'Resources', icon: <FileText size={16} /> },
];

const CATEGORY_COLORS: Record<QuestionCategory, { bg: string; text: string; label: string }> = {
  technical: { bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-400', label: 'Technical' },
  hr: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', label: 'HR' },
  behavioral: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', label: 'Behavioral' },
  system_design: { bg: 'bg-violet-500/10 border-violet-500/20', text: 'text-violet-400', label: 'System Design' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-emerald-400 bg-emerald-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  hard: 'text-rose-400 bg-rose-500/10',
};

export default function InterviewKitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [kit, setKit] = useState<InterviewKit | null>(null);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [resources, setResources] = useState<KitResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | 'all'>('all');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kitData, questionsData, resourcesData] = await Promise.all([
        getInterviewKit(id as string),
        getQuestionsForKit(id as string),
        getResourcesForKit(id as string),
      ]);
      setKit(kitData);
      setQuestions(questionsData);
      setResources(resourcesData);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <Loader2 size={32} className="text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex flex-col items-center justify-center text-white">
        <p className="text-xl font-bold mb-4">Kit Not Found</p>
        {errorMsg && <p className="text-rose-400 mb-4">{errorMsg}</p>}
        <Link href="/interview-kits" className="text-violet-400 hover:underline">← Back to Kits</Link>
      </div>
    );
  }

  const filteredQuestions = categoryFilter === 'all' 
    ? questions 
    : questions.filter(q => q.category === categoryFilter);

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Kit Header */}
      <div
        className="relative overflow-hidden border-b border-white/5 pt-6 pb-8 px-4"
        style={{ background: `linear-gradient(135deg, ${kit.gradientFrom}22, ${kit.gradientTo}22)` }}
      >
        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/interview-kits" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={16} /> All Interview Kits
          </Link>

          <div className="flex items-center gap-5 mb-4">
            {kit.logoUrl ? (
              <img src={kit.logoUrl} alt="" className="w-14 h-14 rounded-xl bg-white/90 p-1.5" />
            ) : (
              <div className="w-14 h-14 rounded-xl flex items-center justify-center font-extrabold text-2xl text-white"
                   style={{ background: `linear-gradient(135deg, ${kit.gradientFrom}, ${kit.gradientTo})` }}>
                {kit.companyName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">{kit.companyName}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" /> {kit.difficultyRating}/5 difficulty
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 size={14} /> {kit.sourceCount} sources
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={14} /> {questions.length} questions
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto pb-1 -mb-8">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#060E1E] text-white border-t border-x border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-4">Company Overview</h2>
              <p className="text-slate-300 leading-relaxed text-lg">{kit.overview}</p>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Hiring Process Timeline</h2>
              <div className="relative">
                <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-white/10" />
                <div className="space-y-6">
                  {kit.hiringStages.map((stage, i) => (
                    <div key={i} className="flex gap-6 items-start pl-2">
                      <div className="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-violet-500 bg-[#060E1E] mt-1" />
                      <div className="flex-1 bg-slate-800/50 rounded-xl p-5 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-white">{stage.name}</h3>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={12} /> ~{stage.typicalDurationDays} days
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{stage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kit.tags.map(tag => (
                <div key={tag} className="bg-slate-900 border border-white/5 rounded-xl p-5 text-center">
                  <span className="text-lg font-bold text-white">{tag}</span>
                  <p className="text-xs text-slate-400 mt-1">Core Interview Area</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── QUESTION BANK TAB ── */}
        {activeTab === 'questions' && (
          <div>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  categoryFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({questions.length})
              </button>
              {(Object.keys(CATEGORY_COLORS) as QuestionCategory[]).map(cat => {
                const count = questions.filter(q => q.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      categoryFilter === cat
                        ? `${CATEGORY_COLORS[cat].bg} ${CATEGORY_COLORS[cat].text} border-current`
                        : 'text-slate-400 hover:text-white border-transparent'
                    }`}
                  >
                    {CATEGORY_COLORS[cat].label} ({count})
                  </button>
                );
              })}
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 border border-white/5 rounded-2xl">
                <BookOpen size={32} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No questions in this category</h3>
                <p className="text-slate-400 text-sm">Questions will be added as more interview experiences are submitted.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((q, idx) => {
                  const isExpanded = expandedQ === q.id;
                  const catInfo = CATEGORY_COLORS[q.category];
                  
                  return (
                    <div
                      key={q.id}
                      className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                        className="w-full text-left p-5 flex items-start gap-4 hover:bg-white/2 transition-colors"
                      >
                        <span className="text-sm font-mono text-slate-500 mt-0.5 flex-shrink-0 w-6">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded border ${catInfo.bg} ${catInfo.text}`}>
                              {catInfo.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded capitalize ${DIFFICULTY_COLORS[q.difficulty]}`}>
                              {q.difficulty}
                            </span>
                          </div>
                          <h4 className="text-white font-semibold">{q.question}</h4>
                        </div>
                        <div className="flex-shrink-0 text-slate-500 mt-1">
                          {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 pt-0 border-t border-white/5 mt-0">
                          <div className="bg-slate-800/50 rounded-xl p-5 mt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Model Answer / Approach</p>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{q.modelAnswer}</p>
                          </div>
                          <div className="flex gap-3 mt-4">
                            <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                              <Zap size={14} /> Practice in AI Mock
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CODING ROUNDS TAB ── */}
        {activeTab === 'coding' && (
          <div>
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Company-Tagged Coding Problems</h2>
              <p className="text-slate-400 mb-6">
                Practice the exact types of coding problems that {kit.companyName} asks in their interviews. These use the same editor and execution engine as the Daily Challenge.
              </p>
              <Link href="/challenge">
                <button className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
                  <Code size={18} /> Go to Coding Challenges
                </button>
              </Link>
            </div>

            <div className="text-center py-12 bg-slate-900/50 border border-white/5 rounded-2xl text-slate-400">
              <Code size={32} className="text-slate-600 mx-auto mb-4" />
              <p className="font-medium">Company-specific problems will be linked here as they are tagged by the community and admin team.</p>
            </div>
          </div>
        )}

        {/* ── EXPERIENCES TAB ── */}
        {activeTab === 'experiences' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Interview Experiences</h2>
              <Link href="/articles/new">
                <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
                  <MessageSquare size={16} /> Share Your Experience
                </button>
              </Link>
            </div>

            <div className="text-center py-16 bg-slate-900/50 border border-white/5 rounded-2xl text-slate-400">
              <MessageSquare size={32} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No experiences shared yet</h3>
              <p className="text-sm max-w-md mx-auto mb-6">
                Help the community by sharing your interview experience at {kit.companyName}. Your write-up will appear here after moderation review.
              </p>
              <Link href="/articles/new">
                <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-sm transition-all">
                  Write an Experience Report
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ── RESOURCES TAB ── */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            {resources.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 border border-white/5 rounded-2xl text-slate-400">
                <FileText size={32} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No resources available</h3>
                <p className="text-sm">PDF guides and video walkthroughs will be added by the admin team.</p>
              </div>
            ) : (
              resources.map(res => (
                <div
                  key={res.id}
                  className="bg-slate-900 border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-5"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    res.type === 'pdf' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {res.type === 'pdf' ? <FileText size={24} /> : <Play size={24} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white truncate">{res.title}</h3>
                      {res.isPremium && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                          <Lock size={10} /> {res.creditsCost} cr
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{res.description}</p>
                  </div>

                  <div className="flex-shrink-0 w-full md:w-auto">
                    {res.isPremium ? (
                      <button className="w-full md:w-auto px-5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-lg text-sm transition-colors border border-amber-500/20 flex items-center justify-center gap-2">
                        <Lock size={14} /> Unlock ({res.creditsCost} credits)
                      </button>
                    ) : (
                      <button className="w-full md:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                        <Download size={14} /> Download
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
