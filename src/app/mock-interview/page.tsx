'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Bot, Users, Zap, ChevronRight, Wallet, Clock,
  Building, CheckCircle2, Loader2, Calendar, Star, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { getUserWallet, UserWallet } from '../../lib/walletDb';
import {
  bookAIMockInterview, getUserMockInterviews,
  MockInterview, MOCK_INTERVIEW_COSTS
} from '../../lib/mockInterviewDb';

type Step = 'select_type' | 'select_company' | 'confirm' | 'done';

export default function MockInterviewBookingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('select_type');
  const [selectedType, setSelectedType] = useState<'ai_simulated' | 'peer_mentor' | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [history, setHistory] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [newInterviewId, setNewInterviewId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) loadData();
    else if (user === null) router.push('/login');
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [w, h] = await Promise.all([
        getUserWallet(user.id),
        getUserMockInterviews(user.id),
      ]);
      setWallet(w);
      setHistory(h);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (type: 'ai_simulated' | 'peer_mentor') => {
    setSelectedType(type);
    setStep('select_company');
  };

  const handleConfirm = async () => {
    if (!user || !selectedType) return;
    const cost = MOCK_INTERVIEW_COSTS[selectedType];
    
    if ((wallet?.balance || 0) < cost) {
      alert(`Insufficient credits! You need ${cost} credits. Your balance: ${wallet?.balance || 0}`);
      return;
    }

    setBooking(true);
    try {
      if (selectedType === 'ai_simulated') {
        const id = await bookAIMockInterview(user.id, companyName || undefined, role || undefined);
        setNewInterviewId(id);
      } else {
        // For peer_mentor, we'd show a calendar picker. For now, show a placeholder.
        alert('Peer mock scheduling will be available soon! Please use AI Mock for now.');
        setBooking(false);
        return;
      }
      setStep('done');
      // Refresh wallet
      const updatedWallet = await getUserWallet(user.id);
      setWallet(updatedWallet);
    } catch (e: any) {
      alert(`Booking failed: ${e.message}`);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <Loader2 size={32} className="text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Top Nav */}
      <div className="bg-slate-900/80 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-bold text-lg">Mock Interviews</h1>
          </div>
          <Link href="/wallet" className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-bold text-sm">
            <Wallet size={16} /> {wallet?.balance || 0} cr
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── STEP 1: SELECT TYPE ── */}
        {step === 'select_type' && (
          <div>
            <h2 className="text-2xl font-extrabold text-white mb-2">Choose Interview Type</h2>
            <p className="text-slate-400 mb-8">Select the type of mock interview you'd like to practice.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* AI Mock */}
              <button
                onClick={() => handleSelectType('ai_simulated')}
                className="group text-left bg-slate-900 border border-white/5 hover:border-cyan-500/30 rounded-2xl p-8 transition-all hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="w-14 h-14 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Bot size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI-Simulated Mock</h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  Start immediately. Our AI interviewer asks role-specific questions and gives you a structured feedback report.
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-cyan-400 font-bold text-sm">{MOCK_INTERVIEW_COSTS.ai_simulated} credits</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Zap size={12} /> Instant</span>
                </div>
              </button>

              {/* Peer Mock */}
              <button
                onClick={() => handleSelectType('peer_mentor')}
                className="group text-left bg-slate-900 border border-white/5 hover:border-violet-500/30 rounded-2xl p-8 transition-all hover:shadow-xl hover:shadow-violet-500/5"
              >
                <div className="w-14 h-14 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Users size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Peer / Mentor Mock</h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  Book a scheduled session with a human mentor. Video call with mutual feedback exchange.
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-violet-400 font-bold text-sm">{MOCK_INTERVIEW_COSTS.peer_mentor} credits</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12} /> Scheduled</span>
                </div>
              </button>
            </div>

            {/* Past Interviews */}
            {history.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-slate-400" /> Past Mock Interviews
                </h3>
                <div className="space-y-3">
                  {history.slice(0, 5).map(interview => {
                    const date = new Date(interview.createdAt?.seconds ? interview.createdAt.seconds * 1000 : interview.createdAt).toLocaleDateString();
                    return (
                      <div key={interview.id} className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          interview.type === 'ai_simulated' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-violet-500/10 text-violet-400'
                        }`}>
                          {interview.type === 'ai_simulated' ? <Bot size={20} /> : <Users size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white">
                            {interview.type === 'ai_simulated' ? 'AI Mock' : 'Peer Mock'}
                            {interview.companyName && ` — ${interview.companyName}`}
                          </div>
                          <div className="text-xs text-slate-400">{date} • {interview.status}</div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold rounded capitalize ${
                          interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {interview.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: SELECT COMPANY ── */}
        {step === 'select_company' && (
          <div>
            <button onClick={() => setStep('select_type')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-6">
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-extrabold text-white mb-2">Customize Your Mock</h2>
            <p className="text-slate-400 mb-8">Optionally specify a target company and role to get tailored questions.</p>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company (optional)</label>
                <div className="relative">
                  <Building size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Google, Meta, Amazon"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={() => setStep('confirm')}
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── STEP 3: CONFIRM ── */}
        {step === 'confirm' && selectedType && (
          <div>
            <button onClick={() => setStep('select_company')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-6">
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-extrabold text-white mb-8">Confirm Booking</h2>

            <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 mb-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-slate-400">Interview Type</span>
                  <span className="text-white font-bold">
                    {selectedType === 'ai_simulated' ? '🤖 AI-Simulated' : '👥 Peer / Mentor'}
                  </span>
                </div>
                {companyName && (
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-slate-400">Company</span>
                    <span className="text-white font-bold">{companyName}</span>
                  </div>
                )}
                {role && (
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-slate-400">Role</span>
                    <span className="text-white font-bold">{role}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-slate-400">Cost</span>
                  <span className="text-amber-400 font-extrabold text-lg">{MOCK_INTERVIEW_COSTS[selectedType]} credits</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-400">Your Balance</span>
                  <span className={`font-bold text-lg ${(wallet?.balance || 0) >= MOCK_INTERVIEW_COSTS[selectedType] ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {wallet?.balance || 0} credits
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleConfirm}
                disabled={booking || (wallet?.balance || 0) < MOCK_INTERVIEW_COSTS[selectedType]}
                className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                {booking ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {booking ? 'Booking...' : 'Confirm & Start'}
              </button>

              {(wallet?.balance || 0) < MOCK_INTERVIEW_COSTS[selectedType] && (
                <Link href="/competitions">
                  <button className="px-8 py-3 bg-amber-500/10 text-amber-400 font-bold rounded-xl border border-amber-500/20">
                    Earn More Credits →
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: DONE ── */}
        {step === 'done' && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Mock Interview Booked!</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
              {selectedType === 'ai_simulated'
                ? 'Your AI mock interview is ready. Navigate to the interview room to start.'
                : 'Your peer mock interview has been scheduled. You will receive a confirmation email.'
              }
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">
                  Back to Dashboard
                </button>
              </Link>
              <button
                onClick={() => { setStep('select_type'); setSelectedType(null); setCompanyName(''); setRole(''); }}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all"
              >
                Book Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
