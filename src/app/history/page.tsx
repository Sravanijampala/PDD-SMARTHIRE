'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Calendar, Download, Award, LogIn, Monitor, Smartphone, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { getInterviewsByUser, getLoginHistory } from '../../lib/firestore';

const scoreColor = (s: number) => s >= 85 ? 'text-emerald-400' : s >= 70 ? 'text-amber-400' : 'text-red-400';
const scoreBg = (s: number) => s >= 85 ? 'bg-emerald-950/60 border-emerald-500/30' : s >= 70 ? 'bg-amber-950/60 border-amber-500/30' : 'bg-red-950/60 border-red-500/30';

const formatDate = (ts: any) => {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (ts: any) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'interviews' | 'logins'>('interviews');
  const [interviews, setInterviews] = useState<any[]>([]);
  const [logins, setLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [indexError, setIndexError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user?.id) {
      router.push('/login');
    }
  }, [authLoading, user?.id, router]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setIndexError(null);
    Promise.all([
      getInterviewsByUser(user.id),
      getLoginHistory(user.id),
    ]).then(([iv, lg]) => {
      setInterviews(iv);
      setLogins(lg);
    }).catch((err) => {
      console.error(err);
      if (err?.message?.includes('index')) {
        setIndexError('A Firestore index is being built. This takes 1–2 minutes on first use. Please refresh the page shortly.');
      }
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const downloadReport = (h: any) => {
    const content = `SmartHire Interview Report\n\nCompany: ${h.company || h.role || 'N/A'}\nRound: ${h.round || 'Mock Interview'}\nScore: ${h.result?.scores?.overall ?? h.score ?? 'N/A'}/100\nDate: ${formatDate(h.createdAt)}\n\nPerformance: ${(h.result?.scores?.overall ?? h.score ?? 0) >= 85 ? 'Excellent' : (h.result?.scores?.overall ?? h.score ?? 0) >= 70 ? 'Good' : 'Needs Improvement'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartHire_Report_${formatDate(h.createdAt)}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100">
      <div className="fixed top-0 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-30 bg-[#0B1220]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white">Activity History</h1>
            <p className="text-xs text-slate-400">
            {authLoading ? 'Authenticating...' : user ? user.email : 'Not logged in'}
          </p>
          </div>
        </div>
      </header>

      <div className="w-full px-6 lg:px-16 py-8 max-w-5xl mx-auto space-y-6">

        {/* Tabs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab('interviews')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${tab === 'interviews' ? 'bg-slate-800 text-cyan-400 border-cyan-500/50' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            <BookOpen size={15} /> Interview Sessions
          </button>
          <button
            onClick={() => setTab('logins')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${tab === 'logins' ? 'bg-slate-800 text-purple-400 border-purple-500/50' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            <LogIn size={15} /> Login Activity
          </button>
        </div>

        {/* Index building banner */}
        {indexError && (
          <div className="flex items-start gap-3 p-4 bg-amber-950/50 border border-amber-500/40 rounded-2xl text-amber-300 text-sm">
            <RefreshCw size={16} className="mt-0.5 shrink-0 animate-spin" />
            <div>
              <p className="font-bold mb-0.5">Index Building in Progress</p>
              <p className="text-amber-400/80 text-xs">{indexError}</p>
              <button onClick={() => window.location.reload()} className="mt-2 text-xs font-bold underline hover:text-white transition-colors">
                Refresh Now
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw size={28} className="text-cyan-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading your history...</p>
          </div>
        ) : tab === 'interviews' ? (
          <>
            {/* Stats */}
            {interviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Sessions', val: interviews.length, color: 'text-cyan-400' },
                  { label: 'Avg Score', val: `${Math.round(interviews.reduce((a, b) => a + (b.result?.scores?.overall ?? b.score ?? 0), 0) / interviews.length)}%`, color: 'text-purple-400' },
                  { label: 'Best Score', val: `${Math.max(...interviews.map(h => h.result?.scores?.overall ?? h.score ?? 0))}%`, color: 'text-emerald-400' },
                  { label: 'Companies', val: new Set(interviews.map(h => h.company || h.role || 'N/A')).size, color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 text-center">
                    <div className={`text-2xl font-extrabold ${s.color}`}>{s.val}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Interview List */}
            <div className="space-y-3">
              {interviews.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="font-semibold">No interviews yet</p>
                  <p className="text-xs mt-1">Complete your first mock interview to see results here.</p>
                  <Link href="/ai-interview" className="inline-block mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-all">
                    Start Interview
                  </Link>
                </div>
              ) : interviews.map((h, i) => {
                const score = h.result?.scores?.overall ?? h.score ?? 0;
                return (
                  <div key={h.id ?? i} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-extrabold ${scoreColor(score)} ${scoreBg(score)} border w-16 h-16 rounded-2xl flex items-center justify-center`}>
                        {score}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-extrabold text-white">{h.company || h.role || 'Mock Interview'}</span>
                          {h.round && <><span className="text-slate-500">·</span><span className="text-sm font-semibold text-slate-300">{h.round}</span></>}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(h.createdAt)}</span>
                          {h.duration && <span className="flex items-center gap-1"><Clock size={12} />{h.duration}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {score >= 85 && <Award size={18} className="text-amber-400" />}
                      <button onClick={() => downloadReport(h)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all">
                        <Download size={14} /> Report
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Login Activity Tab */
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-2">Showing last {logins.length} login events for your account.</p>
            {logins.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <LogIn size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No login history yet</p>
                <p className="text-xs mt-1">Your login activity will appear here next time you sign in.</p>
              </div>
            ) : logins.map((l, i) => (
              <div key={l.id ?? i} className={`bg-slate-900/70 border rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-slate-700 transition-all ${i === 0 ? 'border-purple-500/40' : 'border-slate-800'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-purple-900/60 border border-purple-500/40' : 'bg-slate-800 border border-slate-700'}`}>
                    <LogIn size={20} className={i === 0 ? 'text-purple-400' : 'text-slate-400'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-white">{user?.email}</span>
                      {i === 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-900/60 text-purple-300 border border-purple-500/40 rounded-full">Current Session</span>}
                    </div>
                    <div className="text-xs text-slate-400">{l.browser} · {formatDate(l.loginAt)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{formatTime(l.loginAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
