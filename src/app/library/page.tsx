'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Play, Code, Network, Users, Lightbulb, BarChart3,
  Star, Clock, ChevronRight, Search, Filter, Brain, Shield,
  Cloud, Smartphone, Database, Layers, TrendingUp, Settings
} from 'lucide-react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Round {
  id: string;
  name: string;
  icon: React.ReactNode;
  desc: string;
  duration: { Easy: number; Medium: number; Hard: number };
  color: string;
  border: string;
  iconBg: string;
}

// ─────────────────────────────────────────────
//  Company config — 17 companies
// ─────────────────────────────────────────────
interface CompanyConfig {
  name: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  accent: string;
}

const COMPANIES: CompanyConfig[] = [
  { name: 'Google', emoji: 'G', color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-500/30', accent: '#3B82F6' },
  { name: 'Meta', emoji: 'M', color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500/30', accent: '#A855F7' },
  { name: 'Amazon', emoji: 'A', color: 'text-orange-400', bg: 'bg-orange-950/40', border: 'border-orange-500/30', accent: '#F97316' },
  { name: 'Microsoft', emoji: '⊞', color: 'text-sky-400', bg: 'bg-sky-950/40', border: 'border-sky-500/30', accent: '#38BDF8' },
  { name: 'Apple', emoji: '⌘', color: 'text-slate-300', bg: 'bg-slate-800/60', border: 'border-slate-500/30', accent: '#CBD5E1' },
  { name: 'Netflix', emoji: 'N', color: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-500/30', accent: '#F87171' },
  { name: 'Uber', emoji: 'U', color: 'text-white', bg: 'bg-slate-800/60', border: 'border-slate-600/40', accent: '#E2E8F0' },
  { name: 'Oracle', emoji: 'O', color: 'text-red-300', bg: 'bg-red-950/30', border: 'border-red-400/30', accent: '#FCA5A5' },
  { name: 'Adobe', emoji: 'Ps', color: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/30', accent: '#FB7185' },
  { name: 'Salesforce', emoji: 'SF', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-500/30', accent: '#22D3EE' },
  { name: 'TCS', emoji: 'T', color: 'text-blue-300', bg: 'bg-blue-950/30', border: 'border-blue-400/30', accent: '#93C5FD' },
  { name: 'Infosys', emoji: 'In', color: 'text-indigo-400', bg: 'bg-indigo-950/40', border: 'border-indigo-500/30', accent: '#818CF8' },
  { name: 'Accenture', emoji: 'Ac', color: 'text-violet-400', bg: 'bg-violet-950/40', border: 'border-violet-500/30', accent: '#A78BFA' },
  { name: 'Capgemini', emoji: 'Cg', color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/20', accent: '#60A5FA' },
  { name: 'Wipro', emoji: 'W', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', accent: '#34D399' },
  { name: 'Cognizant', emoji: 'Cn', color: 'text-teal-400', bg: 'bg-teal-950/40', border: 'border-teal-500/30', accent: '#2DD4BF' },
  { name: 'Deloitte', emoji: 'D', color: 'text-green-400', bg: 'bg-green-950/40', border: 'border-green-500/30', accent: '#4ADE80' },
];

// ─────────────────────────────────────────────
//  All 19 roles with icons
// ─────────────────────────────────────────────
const ALL_ROLES: Array<{ id: string; name: string; icon: React.ReactNode; desc: string; color: string; border: string; iconBg: string }> = [
  { id: 'software_engineer', name: 'Software Engineer', icon: <Code size={22} />, desc: 'Full-cycle engineering: DSA, system design, code quality, and problem solving', color: 'text-cyan-300', border: 'border-cyan-500/30', iconBg: 'bg-cyan-600/20' },
  { id: 'frontend', name: 'Frontend Developer', icon: <Layers size={22} />, desc: 'React, CSS, performance, accessibility, browser APIs, state management', color: 'text-pink-300', border: 'border-pink-500/30', iconBg: 'bg-pink-600/20' },
  { id: 'backend', name: 'Backend Developer', icon: <Database size={22} />, desc: 'APIs, databases, microservices, caching, auth, scalability, queues', color: 'text-emerald-300', border: 'border-emerald-500/30', iconBg: 'bg-emerald-600/20' },
  { id: 'fullstack', name: 'Full Stack Developer', icon: <Code size={22} />, desc: 'End-to-end development, architectural decisions, both frontend and backend', color: 'text-blue-300', border: 'border-blue-500/30', iconBg: 'bg-blue-600/20' },
  { id: 'android', name: 'Android Developer', icon: <Smartphone size={22} />, desc: 'Kotlin, Jetpack Compose, MVVM, Coroutines, Room, Retrofit, Google Play', color: 'text-green-300', border: 'border-green-500/30', iconBg: 'bg-green-600/20' },
  { id: 'ios', name: 'iOS Developer', icon: <Smartphone size={22} />, desc: 'Swift, SwiftUI, UIKit, Core Data, Combine, memory management, App Store', color: 'text-slate-300', border: 'border-slate-500/30', iconBg: 'bg-slate-600/20' },
  { id: 'data_scientist', name: 'Data Scientist', icon: <BarChart3 size={22} />, desc: 'ML algorithms, Python, pandas, model evaluation, A/B testing, statistics', color: 'text-purple-300', border: 'border-purple-500/30', iconBg: 'bg-purple-600/20' },
  { id: 'ml_engineer', name: 'ML Engineer', icon: <Brain size={22} />, desc: 'Model training, MLOps, deployment, feature engineering, distributed training', color: 'text-violet-300', border: 'border-violet-500/30', iconBg: 'bg-violet-600/20' },
  { id: 'ai_engineer', name: 'AI Engineer', icon: <Brain size={22} />, desc: 'LLMs, prompt engineering, RAG, fine-tuning, AI safety, production AI systems', color: 'text-rose-300', border: 'border-rose-500/30', iconBg: 'bg-rose-600/20' },
  { id: 'devops', name: 'DevOps Engineer', icon: <Settings size={22} />, desc: 'CI/CD, Docker, Kubernetes, monitoring, IaC, SRE principles, cloud platforms', color: 'text-orange-300', border: 'border-orange-500/30', iconBg: 'bg-orange-600/20' },
  { id: 'cloud', name: 'Cloud Engineer', icon: <Cloud size={22} />, desc: 'AWS/GCP/Azure services, cloud architecture, cost optimization, security', color: 'text-sky-300', border: 'border-sky-500/30', iconBg: 'bg-sky-600/20' },
  { id: 'security', name: 'Cyber Security Engineer', icon: <Shield size={22} />, desc: 'Threat modeling, OWASP, pen testing, incident response, security architecture', color: 'text-red-300', border: 'border-red-500/30', iconBg: 'bg-red-600/20' },
  { id: 'qa', name: 'QA Engineer', icon: <CheckCircleIcon size={22} />, desc: 'Test automation, Selenium/Cypress, CI integration, API testing, bug lifecycle', color: 'text-amber-300', border: 'border-amber-500/30', iconBg: 'bg-amber-600/20' },
  { id: 'hr', name: 'HR Interview', icon: <Users size={22} />, desc: 'Cultural fit, motivation, values alignment, work ethic, career goals', color: 'text-teal-300', border: 'border-teal-500/30', iconBg: 'bg-teal-600/20' },
  { id: 'behavioral', name: 'Behavioral Interview', icon: <Lightbulb size={22} />, desc: 'STAR-method behavioral questions about real leadership and teamwork experiences', color: 'text-indigo-300', border: 'border-indigo-500/30', iconBg: 'bg-indigo-600/20' },
  { id: 'leadership', name: 'Leadership Principles', icon: <Star size={22} />, desc: "Amazon's 16 Leadership Principles, leadership style, ownership, decision making", color: 'text-yellow-300', border: 'border-yellow-500/30', iconBg: 'bg-yellow-600/20' },
  { id: 'system_design', name: 'System Design', icon: <Network size={22} />, desc: 'Scalable architecture, reliability, consistency, trade-offs, real-world systems', color: 'text-cyan-300', border: 'border-cyan-500/30', iconBg: 'bg-cyan-600/20' },
  { id: 'product_manager', name: 'Product Manager', icon: <TrendingUp size={22} />, desc: 'Product thinking, metrics, prioritization, stakeholder management, roadmaps', color: 'text-lime-300', border: 'border-lime-500/30', iconBg: 'bg-lime-600/20' },
  { id: 'data_analyst', name: 'Data Analyst', icon: <BarChart3 size={22} />, desc: 'SQL, Python/R, data visualization, business intelligence, statistical analysis', color: 'text-fuchsia-300', border: 'border-fuchsia-500/30', iconBg: 'bg-fuchsia-600/20' },
];

// Tiny inline icon component to avoid import issues
function CheckCircleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

const DIFFICULTY_CONFIG: Record<Difficulty, { color: string; bg: string; minutes: string; label: string }> = {
  Easy: { color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-500/40', minutes: '20-30 min', label: 'Entry Level' },
  Medium: { color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-500/40', minutes: '30-45 min', label: 'Mid Level' },
  Hard: { color: 'text-red-400', bg: 'bg-red-950/60 border-red-500/40', minutes: '45-60 min', label: 'Senior Level' },
};

const DURATION_BY_DIFFICULTY: Record<Difficulty, number> = {
  Easy: 25,
  Medium: 40,
  Hard: 55,
};

export default function LibraryPage() {
  const router = useRouter();
  const [activeCompany, setActiveCompany] = useState<string>('Google');
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Record<string, Difficulty>>({});
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  const visibleCompanies = useMemo(() => {
    const filtered = COMPANIES.filter(c =>
      companySearch === '' || c.name.toLowerCase().includes(companySearch.toLowerCase())
    );
    return showAllCompanies ? filtered : filtered.slice(0, 6);
  }, [showAllCompanies, companySearch]);

  const filteredRoles = useMemo(() =>
    ALL_ROLES.filter(r =>
      search === '' ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.desc.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  );

  const getDifficulty = (id: string): Difficulty => selectedDifficulty[id] || 'Medium';

  const setRoleDifficulty = (id: string, d: Difficulty) => {
    setSelectedDifficulty(prev => ({ ...prev, [id]: d }));
  };

  const handleStart = (role: typeof ALL_ROLES[0]) => {
    const diff = getDifficulty(role.id);
    const duration = DURATION_BY_DIFFICULTY[diff];
    router.push(
      `/interview-permissions?company=${encodeURIComponent(activeCompany)}&role=${encodeURIComponent(role.name)}&difficulty=${encodeURIComponent(diff)}&duration=${duration}`
    );
  };

  const activeCompanyCfg = COMPANIES.find(c => c.name === activeCompany) || COMPANIES[0];

  return (
    <div className="min-h-screen w-full bg-[#0B1220] text-slate-100">
      {/* Background */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/6 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0B1220]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-8 lg:px-16 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-white">Interview Library</h1>
              <p className="text-xs text-slate-400">Practice with AI across {COMPANIES.length} companies · {ALL_ROLES.length} roles</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search roles..."
                className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 transition-colors"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 md:px-8 lg:px-16 py-8">

        {/* Company selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Company</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={companySearch}
                  onChange={e => setCompanySearch(e.target.value)}
                  placeholder="Filter companies..."
                  className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 mb-3">
            {visibleCompanies.map(company => {
              const isActive = activeCompany === company.name;
              return (
                <button
                  key={company.name}
                  onClick={() => setActiveCompany(company.name)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border font-bold text-xs whitespace-nowrap transition-all hover:-translate-y-0.5 ${
                    isActive
                      ? `${company.bg} ${company.color} ${company.border} shadow-lg`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <span className="text-xl font-black">{company.emoji}</span>
                  <span className="text-[10px]">{company.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowAllCompanies(!showAllCompanies)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1"
          >
            {showAllCompanies ? '▲ Show Less' : `▼ Show All ${COMPANIES.length} Companies`}
          </button>
        </div>

        {/* Active company banner */}
        <div className={`flex items-center gap-4 p-4 rounded-2xl border mb-8 ${activeCompanyCfg.bg} ${activeCompanyCfg.border}`}>
          <div className={`w-12 h-12 rounded-2xl bg-slate-900/60 flex items-center justify-center font-black text-2xl ${activeCompanyCfg.color}`}>
            {activeCompanyCfg.emoji}
          </div>
          <div>
            <h2 className={`text-lg font-extrabold ${activeCompanyCfg.color}`}>{activeCompanyCfg.name} Interview Prep</h2>
            <p className="text-xs text-slate-400">{ALL_ROLES.length} roles available · AI-powered · Adaptive difficulty</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2">
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
              <span key={d} className={`text-xs font-bold px-3 py-1 rounded-full border ${DIFFICULTY_CONFIG[d].bg} ${DIFFICULTY_CONFIG[d].color}`}>{d}</span>
            ))}
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden mb-5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search interview roles..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Roles grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              {filteredRoles.length} Interview Roles
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">AI Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredRoles.map(role => {
              const diff = getDifficulty(role.id);
              const diffCfg = DIFFICULTY_CONFIG[diff];
              return (
                <div key={role.id} className={`bg-slate-900/70 border ${role.border} rounded-3xl p-5 flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1 transition-all group`}>

                  {/* Icon + Name */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 ${role.iconBg} rounded-2xl ${role.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                      {role.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-extrabold ${role.color} leading-tight`}>{role.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{role.desc}</p>
                    </div>
                  </div>

                  {/* Difficulty selector */}
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Difficulty</p>
                    <div className="flex gap-1.5">
                      {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                        <button
                          key={d}
                          onClick={() => setRoleDifficulty(role.id, d)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            diff === d
                              ? `${DIFFICULTY_CONFIG[d].bg} ${DIFFICULTY_CONFIG[d].color}`
                              : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={12} /> {diffCfg.minutes}
                    </div>
                    {['AI Voice', 'Live Score', 'Certificate'].map(f => (
                      <span key={f} className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-lg">{f}</span>
                    ))}
                  </div>

                  {/* Start button */}
                  <button
                    onClick={() => handleStart(role)}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg group-hover:shadow-cyan-500/20"
                  >
                    <Play size={14} fill="white" />
                    Start with {activeCompany}
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {filteredRoles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg mb-2">No roles found</p>
            <p className="text-slate-600 text-sm">Try a different search term</p>
            <button onClick={() => setSearch('')} className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all">
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
