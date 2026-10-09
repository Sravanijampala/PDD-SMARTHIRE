'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Trophy, Users, Clock, Calendar, Shield,
  Award, ChevronRight, CheckCircle2, Play, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../../lib/authContext';
import {
  getCompetition, checkRegistration, registerForCompetition, Competition
} from '../../../lib/competitionDb';

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const comp = await getCompetition(id as string);
      setCompetition(comp);
      if (user?.id && comp) {
        const reg = await checkRegistration(comp.id, user.id);
        setIsRegistered(reg);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!competition) return;

    setRegistering(true);
    try {
      await registerForCompetition(competition.id, user.id);
      setIsRegistered(true);
      // Optimistically update count
      setCompetition({ ...competition, registeredCount: competition.registeredCount + 1 });
    } catch (e) {
      console.error(e);
      alert('Failed to register. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex flex-col items-center justify-center text-white">
        <AlertTriangle size={48} className="text-slate-600 mb-4" />
        <p className="text-xl font-bold mb-2">Competition Not Found</p>
        <Link href="/competitions" className="text-indigo-400 hover:underline">← Back to Arena</Link>
      </div>
    );
  }

  const now = new Date();
  const startDate = new Date(competition.startTime?.seconds ? competition.startTime.seconds * 1000 : competition.startTime);
  const endDate = new Date(competition.endTime?.seconds ? competition.endTime.seconds * 1000 : competition.endTime);
  
  const isLive = now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;
  const isPast = now > endDate;

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Top Nav */}
      <div className="bg-slate-900/80 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/competitions" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white truncate">{competition.title}</h1>
          </div>
          <div className="flex items-center gap-2">
             <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
                isLive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                isUpcoming ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                'bg-slate-800 text-slate-400 border border-white/10'
              }`}>
                {isLive ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'ENDED'}
              </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Card */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mb-8">
          <div className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-900/20 to-transparent relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Trophy size={150} />
            </div>

            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                {competition.type} Competition
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{competition.title}</h1>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-8">
                {competition.description}
              </p>

              {/* Action Area */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <div className="flex-1 w-full">
                  {isRegistered ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle2 size={20} /> Successfully Registered
                    </div>
                  ) : isPast ? (
                    <div className="text-slate-400 font-semibold">Registration Closed</div>
                  ) : (
                    <div className="text-slate-300 font-medium">Ready to test your skills?</div>
                  )}
                  {isLive && isRegistered && (
                    <p className="text-xs text-slate-400 mt-1">The arena is open. Good luck!</p>
                  )}
                </div>
                
                <div className="w-full sm:w-auto">
                  {isLive ? (
                    isRegistered ? (
                      <Link href={`/competitions/${competition.id}/room`}>
                        <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 animate-pulse">
                          <Play size={18} /> Enter Contest Room
                        </button>
                      </Link>
                    ) : (
                      <button onClick={handleRegister} disabled={registering} className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all">
                        {registering ? 'Registering...' : 'Register to Enter'}
                      </button>
                    )
                  ) : isUpcoming ? (
                    isRegistered ? (
                      <button disabled className="w-full sm:w-auto px-8 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl cursor-not-allowed border border-white/5">
                        Starts {startDate.toLocaleDateString()}
                      </button>
                    ) : (
                      <button onClick={handleRegister} disabled={registering} className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                        {registering ? 'Registering...' : 'Register Now'}
                      </button>
                    )
                  ) : (
                    <Link href={`/competitions/${competition.id}/results`}>
                      <button className="w-full sm:w-auto px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-white/10">
                        View Results
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Calendar size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">Start Time</span>
              </div>
              <div className="font-bold text-white">{startDate.toLocaleDateString()}</div>
              <div className="text-sm text-slate-500">{startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Clock size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">End Time</span>
              </div>
              <div className="font-bold text-white">{endDate.toLocaleDateString()}</div>
              <div className="text-sm text-slate-500">{endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-amber-500/80 mb-2">
                <Award size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">Prize Pool</span>
              </div>
              <div className="font-bold text-amber-400">{competition.prizePool.toLocaleString()}</div>
              <div className="text-sm text-amber-500/50">Credits</div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Users size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">Participants</span>
              </div>
              <div className="font-bold text-indigo-400">{competition.registeredCount.toLocaleString()}</div>
              <div className="text-sm text-indigo-400/50">Registered</div>
            </div>
          </div>
        </div>

        {/* Rules & Information */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield size={20} className="text-slate-400" /> Rules & Information
          </h2>
          
          <div className="space-y-4 text-slate-300 leading-relaxed text-sm">
            <p>1. <strong className="text-white">Fair Play:</strong> Plagiarism and code-sharing are strictly prohibited. Our automated systems will flag suspicious submissions.</p>
            <p>2. <strong className="text-white">Scoring:</strong> Points are awarded based on the number of hidden test cases passed. Tie-breakers are resolved by submission time penalty.</p>
            <p>3. <strong className="text-white">Languages:</strong> You can submit code in Python 3, JavaScript, Java, C++, or C.</p>
            <p>4. <strong className="text-white">Prizes:</strong> The prize pool of {competition.prizePool} credits will be distributed among the top 10% of participants on the final leaderboard.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
