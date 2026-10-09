"use client";

import React, { useState, useEffect } from 'react';
import {
  Bell, LogOut, User, Video, FileText, BarChart3, ShieldCheck,
  ShieldAlert, Volume2, Wifi, Play, Sparkles, TrendingUp, Search,
  ChevronRight, Library, Award, Code,
  HelpCircle, BookOpen, Calendar, History
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SmartHireLogo } from '../../components/SmartHireLogo';
import { NotificationsModal } from '../../components/NotificationsModal';
import { FeatureModals, FeatureType } from '../../components/FeatureModals';
import { SmartToolsModals } from '../../components/SmartToolsModals';
import { AIAssistantDrawer } from '../../components/AIAssistantDrawer';
import { useAuth } from '../../lib/authContext';
import { subscribeToDashboard } from '../../lib/firestore';

const ROLE_DETAILS: Record<string, {
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  salary: string;
  company: string;
  skills: string[];
}> = {
  'Staff Engineer': {
    description: 'Oversee technical direction, mentor senior engineers, and design highly scalable distributed systems. Focuses heavily on architectural patterns, concurrency, and organizational alignment.',
    difficulty: 'Hard',
    salary: '$180k - $240k',
    company: 'SmartHire Tech',
    skills: ['System Architecture', 'Cross-team Leadership', 'Tech Strategy', 'Scalability'],
  },
  'Tech Lead': {
    description: 'Lead a software engineering team, balance technical quality with agile product delivery, and architect modular systems. Covers people management, code reviews, and API design.',
    difficulty: 'Hard',
    salary: '$160k - $210k',
    company: 'SmartHire Systems',
    skills: ['Team Leadership', 'Agile Delivery', 'System Design', 'Code Quality'],
  },
  'Senior Android': {
    description: 'Build modern, performant mobile apps using Android SDK and Jetpack Compose. Tests core components, memory optimizations, custom canvas drawings, and background processes.',
    difficulty: 'Hard',
    salary: '$140k - $190k',
    company: 'SmartHire Mobile',
    skills: ['Kotlin', 'Android SDK', 'Jetpack Compose', 'Memory Management'],
  },
  'AI Architect': {
    description: 'Design and implement enterprise-grade AI systems, optimize model inference pipelines, and integrate state-of-the-art LLMs. Touches on prompt engineering, embeddings, and NLP.',
    difficulty: 'Hard',
    salary: '$200k - $260k',
    company: 'SmartHire AI Lab',
    skills: ['LLMs', 'PyTorch', 'Model Deployment', 'Neural Networks'],
  },
  'Frontend Lead': {
    description: 'Drive the frontend architecture of high-traffic web applications, establish styling standards, and optimize client-side rendering. Evaluates React/Next.js internals and web performance.',
    difficulty: 'Medium',
    salary: '$150k - $200k',
    company: 'SmartHire Web',
    skills: ['React/Next.js', 'Tailwind CSS', 'Web Performance', 'Design Systems'],
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const displayName = user?.name?.split(' ')[0] || 'Sravani';

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [activeFeatureModal, setActiveFeatureModal] = useState<FeatureType>(null);
  const [selectedRecentActivity, setSelectedRecentActivity] = useState<{ title: string; score: string } | null>(null);
  const [activeSmartTool, setActiveSmartTool] = useState<'fraud' | 'noise' | 'stability' | null>(null);
  const [activeRole, setActiveRole] = useState('Staff Engineer');
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      const unsub = subscribeToDashboard(user.id, (data) => {
        setDashboardData(data);
      });
      return () => unsub();
    }
  }, [user?.id]);

  const handleOpenRecentActivity = (title: string, score: string) => {
    setSelectedRecentActivity({ title, score });
    setActiveFeatureModal('recent_interview');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Fallbacks if Firestore data is empty
  const weeklyData = dashboardData?.weeklyProgress || [
    { day: 'Mon', score: 0 }, { day: 'Tue', score: 0 }, { day: 'Wed', score: 0 },
    { day: 'Thu', score: 0 }, { day: 'Fri', score: 0 }, { day: 'Sat', score: 0 },
    { day: 'Sun', score: 0 }
  ];
  const maxScore = Math.max(...weeklyData.map((d: any) => d.score), 100);
  const aiScore = dashboardData?.aiScore || 0;
  const upcomingSessions = dashboardData?.upcomingPracticeSessions || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const performanceAnalytics = dashboardData?.performanceAnalytics || [];

  return (
    <div className="min-h-screen w-full bg-[#0B1220] text-slate-100 font-sans relative pb-32 overflow-x-hidden">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0B1220]/80 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-16 py-4">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <SmartHireLogo size="sm" showText={false} />
            </Link>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          </div>

          <div className="flex-1 max-w-md hidden md:block px-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search mock tests, skills, recruiters..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setNotificationsOpen(true)}
              className="relative p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all group" title="Notifications">
              <Bell size={20} className="text-slate-300 group-hover:text-white" />
              {dashboardData?.unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0B1220]">
                  {dashboardData.unreadNotifications}
                </span>
              )}
            </button>

            <Link href="/profile">
              <button className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all text-slate-400 hover:text-white" title="Profile">
                <User size={20} />
              </button>
            </Link>

            <button onClick={handleLogout}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all text-slate-400 hover:text-red-400" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-6 lg:px-16 pt-8 space-y-8">

        {/* Welcome + Profile */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Welcome back,</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{displayName}</h2>
          </div>
          <Link href="/profile">
            <div className="w-12 h-12 rounded-full bg-purple-600/30 border-2 border-purple-500/60 flex items-center justify-center text-purple-300 shadow-lg cursor-pointer hover:scale-105 transition-transform overflow-hidden">
              {user?.photoUrl ? <img src={user.photoUrl} alt="avatar" className="w-full h-full object-cover" /> : <User size={24} />}
            </div>
          </Link>
        </div>

        {/* AI Preparation Level */}
        <div onClick={() => setActiveFeatureModal('prep_level')}
          className="bg-slate-900/70 hover:bg-slate-850 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md cursor-pointer transition-all hover:border-blue-500/40 group">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
              AI Preparation Level <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
            </h3>
            <span className="text-xs font-extrabold text-cyan-400">{aiScore}%</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/60">
            <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)]" style={{ width: `${aiScore}%` }} />
          </div>
        </div>

        {/* Core AI Features Grid */}
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Core AI Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'mock_test_setup', icon: <Video size={28} />, label: 'AI Mock Test', color: 'bg-[#1E1B4B]/80 border-purple-500/30 text-purple-300 icon-bg-purple' },
              { key: 'resume', icon: <FileText size={28} />, label: 'Resume Analyzer', color: 'bg-[#0F2942]/80 border-cyan-500/30 text-cyan-300 icon-bg-cyan' },
              { key: 'performance', icon: <BarChart3 size={28} />, label: 'Performance', color: 'bg-[#0E1E38]/80 border-blue-500/30 text-blue-300 icon-bg-blue' },
              { key: 'recruiter', icon: <ShieldCheck size={28} />, label: 'Recruiter View', color: 'bg-[#0A2E28]/80 border-emerald-500/30 text-emerald-300 icon-bg-emerald' },
            ].map(item => (
              <div key={item.key} onClick={() => {
                  if (item.key === 'mock_test_setup') {
                    router.push('/mock-test-setup');
                  } else {
                    setActiveFeatureModal(item.key as FeatureType);
                  }
                }}
                className={`${item.color.split(' ')[0]} hover:opacity-100 border ${item.color.split(' ')[1]} rounded-2xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group flex flex-col items-center justify-center min-h-[140px]`}>
                <div className={`p-3 ${
                  item.color.includes('purple') ? 'bg-purple-600/30 text-purple-300' :
                  item.color.includes('cyan') ? 'bg-cyan-600/30 text-cyan-300' :
                  item.color.includes('blue') ? 'bg-blue-600/30 text-blue-300' :
                  'bg-emerald-600/30 text-emerald-300'
                } rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <span className={`text-xs lg:text-sm font-bold ${
                  item.color.includes('purple') ? 'text-purple-200' :
                  item.color.includes('cyan') ? 'text-cyan-200' :
                  item.color.includes('blue') ? 'text-blue-200' :
                  'text-emerald-200'
                }`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Assessments & Practice</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { href: '/practice', icon: <Library size={20} />, label: 'Practice Hub', color: 'text-cyan-400 bg-cyan-950/50 border-cyan-500/30' },
              { href: '/challenge', icon: <Code size={20} />, label: 'Daily Challenge', color: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30' },
              { href: '/mcq', icon: <BookOpen size={20} />, label: 'MCQ Test', color: 'text-blue-400 bg-blue-950/50 border-blue-500/30' },
              { href: '/history', icon: <History size={20} />, label: 'History', color: 'text-purple-400 bg-purple-950/50 border-purple-500/30' },
              { href: '/certificates', icon: <Award size={20} />, label: 'Certificates', color: 'text-amber-400 bg-amber-950/50 border-amber-500/30' },
              { href: '/help', icon: <HelpCircle size={20} />, label: 'Help', color: 'text-slate-400 bg-slate-800/60 border-slate-700' },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className={`${item.color} border rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all cursor-pointer`}>
                  {item.icon}
                  <span className="text-xs font-bold">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-cyan-400" /> Weekly Progress
            </h3>
            <span className="text-xs text-slate-400">Avg: {Math.round(weeklyData.reduce((a: any, b: any) => a + b.score, 0) / 7)}%</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {weeklyData.map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500">{d.score}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-cyan-600 to-blue-500 transition-all hover:from-cyan-500 hover:to-blue-400"
                  style={{ height: `${(d.score / maxScore) * 100}px` }} />
                <span className="text-[10px] text-slate-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Company-wise Progress */}
        {performanceAnalytics.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Company-wise Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {performanceAnalytics.map((c: any, i: number) => (
              <div key={i} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-white">{c.name}</span>
                  <span className="text-xs text-slate-400">{c.rounds} rounds</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full`} style={{ width: `${c.score}%` }} />
                </div>
                <span className="text-lg font-extrabold text-white">{c.score}%</span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Smart Interview Tools */}
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Smart Interview Tools</h3>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setActiveSmartTool('fraud')}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#3B1825]/90 border border-red-500/40 text-red-300 font-bold text-xs hover:bg-[#4E1F30] transition-all hover:scale-105">
              <ShieldAlert size={18} className="text-red-400" /> Fraud Detection
            </button>
            <button onClick={() => setActiveSmartTool('noise')}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#332900]/90 border border-yellow-500/40 text-yellow-300 font-bold text-xs hover:bg-[#473900] transition-all hover:scale-105">
              <Volume2 size={18} className="text-yellow-400" /> Noise Check
            </button>
            <button onClick={() => setActiveSmartTool('stability')}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#0F2242]/90 border border-blue-500/40 text-blue-300 font-bold text-xs hover:bg-[#152E59] transition-all hover:scale-105">
              <Wifi size={18} className="text-blue-400" /> Stability Test
            </button>
          </div>
        </div>

        {/* AI Readiness Index */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 lg:p-8 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-cyan-400" strokeDasharray={`${aiScore}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span className="absolute text-xl font-extrabold text-white">{aiScore}%</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">AI Readiness Index</h4>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 font-extrabold text-sm mb-1">
              <TrendingUp size={16} /> Trending Up
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">Based on your recent performance across {dashboardData?.completedInterviews || 0} interviews.</p>
          </div>
        </div>

        {/* Upcoming Interviews */}
        {upcomingSessions.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Upcoming Practice Sessions</h3>
          <div className="space-y-3">
            {upcomingSessions.map((session: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-900/70 border border-slate-800 rounded-2xl hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-cyan-950/60 rounded-xl"><Calendar size={18} className="text-cyan-400" /></div>
                  <div>
                    <p className="text-sm font-bold text-white">{session.title}</p>
                    <p className="text-xs text-slate-400">{session.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    session.difficulty === 'Hard' ? 'text-red-400 bg-red-950/60' :
                    session.difficulty === 'Medium' ? 'text-amber-400 bg-amber-950/60' :
                    'text-emerald-400 bg-emerald-950/60'
                  }`}>{session.difficulty}</span>
                  <button
                    onClick={() => router.push(
                      `/interview-permissions?company=${encodeURIComponent(session.company)}&role=${encodeURIComponent(session.role)}&difficulty=${encodeURIComponent(session.difficulty)}&duration=${session.duration}`
                    )}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
                  >
                    Practice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Recommended Roles */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Recommended Roles</h3>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {['Staff Engineer', 'Tech Lead', 'Senior Android', 'AI Architect', 'Frontend Lead'].map((role) => (
                <button key={role} onClick={() => setActiveRole(role)}
                  className={`px-5 py-2.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all ${
                    activeRole === role ? 'bg-slate-800 text-cyan-400 border-cyan-500/50' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}>{role}</button>
              ))}
            </div>
          </div>

          {/* Selected Role Detail Card */}
          {activeRole && (
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-800 rounded-3xl p-6 transition-all duration-300 shadow-lg relative overflow-hidden group">
              {/* Glow background accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-300" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                      Recommended for You
                    </span>
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full ${
                      ROLE_DETAILS[activeRole]?.difficulty === 'Hard' 
                        ? 'bg-red-955/40 text-red-400 border border-red-500/20' 
                        : 'bg-amber-955/40 text-amber-400 border border-amber-500/20'
                    }`}>
                      {ROLE_DETAILS[activeRole]?.difficulty} Difficulty
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80">
                      Est. Salary: {ROLE_DETAILS[activeRole]?.salary}
                    </span>
                  </div>
                  
                  <h4 className="text-base font-extrabold text-white">{activeRole}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {ROLE_DETAILS[activeRole]?.description}
                  </p>
                  
                  {/* Skill tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ROLE_DETAILS[activeRole]?.skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 bg-slate-950 text-[10px] font-bold text-slate-400 rounded-lg border border-slate-800/80">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => router.push(
                      `/interview-permissions?company=${encodeURIComponent(ROLE_DETAILS[activeRole]?.company || 'SmartHire')}&role=${encodeURIComponent(activeRole)}&difficulty=${encodeURIComponent(ROLE_DETAILS[activeRole]?.difficulty || 'Hard')}&duration=30`
                    )}
                    className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
                  >
                    <Play size={14} fill="white" /> Start Practice
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold">Recent Activity</h3>
            <Link href="/history"><span className="text-xs text-purple-400 font-semibold cursor-pointer hover:underline">View All</span></Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity: any, i: number) => (
              <div key={i} onClick={() => handleOpenRecentActivity(activity.title, activity.score)}
                className="p-4 bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 rounded-2xl flex items-center justify-between transition-all cursor-pointer group hover:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                    <Play size={18} fill="currentColor" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{activity.title}</h4>
                    <p className="text-xs text-cyan-400 font-semibold mt-0.5">Analysis Score: {activity.score}%</p>
                  </div>
                </div>
                <div className="p-2 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

      </main>

      {/* Floating AI Assistant */}
      <button onClick={() => setAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs lg:text-sm rounded-2xl shadow-2xl shadow-purple-600/50 border border-purple-400/30 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95">
        <Sparkles size={18} className="animate-spin-slow" /> AI Assistant
      </button>

      {/* Modals */}
      <NotificationsModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <FeatureModals activeFeature={activeFeatureModal} selectedActivity={selectedRecentActivity} onClose={() => setActiveFeatureModal(null)} onNavigate={(f) => setActiveFeatureModal(f)} />
      <SmartToolsModals activeTool={activeSmartTool} onClose={() => setActiveSmartTool(null)} />
      <AIAssistantDrawer isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}
