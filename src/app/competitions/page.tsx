'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy, Calendar, Users, Clock, ArrowRight, Activity, 
  Flame, CheckCircle2, ChevronRight, Award, Zap
} from 'lucide-react';
import { getCompetitionsByStatus, seedCompetitions, Competition } from '../../lib/competitionDb';

type Tab = 'live' | 'upcoming' | 'past';

export default function CompetitionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitions();
  }, [activeTab]);

  const loadCompetitions = async () => {
    setLoading(true);
    try {
      let data = await getCompetitionsByStatus(activeTab);
      // Auto-seed if completely empty (for demo purposes)
      if (data.length === 0 && activeTab === 'live') {
        const checkPast = await getCompetitionsByStatus('past');
        if (checkPast.length === 0) {
          await seedCompetitions();
          data = await getCompetitionsByStatus(activeTab);
        }
      }
      setCompetitions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 to-slate-900 border-b border-white/5 pt-12 pb-16 px-4">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Trophy size={200} />
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <Flame size={16} /> Global Coding Arena
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Compete. Climb. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Conquer.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mb-8">
            Join weekly and 5-day coding contests. Test your skills against peers globally, climb the leaderboards, and earn credits for premium mock interviews.
          </p>
          
          <div className="flex gap-4">
            <Link href="/wallet" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl font-medium transition-colors flex items-center gap-2">
              <Zap size={18} className="text-amber-400" /> View Wallet
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-8">
          {(['live', 'upcoming', 'past'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'live' && <Activity size={16} className="inline mr-2" />}
              {tab === 'upcoming' && <Calendar size={16} className="inline mr-2" />}
              {tab === 'past' && <CheckCircle2 size={16} className="inline mr-2" />}
              {tab} Contests
              
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-white/5 rounded-2xl">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={24} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No {activeTab} competitions</h3>
            <p className="text-slate-400">Check back later for new coding challenges.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {competitions.map((comp) => {
              const startDate = new Date(comp.startTime?.seconds ? comp.startTime.seconds * 1000 : comp.startTime);
              const endDate = new Date(comp.endTime?.seconds ? comp.endTime.seconds * 1000 : comp.endTime);
              
              const isLive = activeTab === 'live';
              const isUpcoming = activeTab === 'upcoming';
              
              return (
                <div key={comp.id} className="group bg-slate-900 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-black/20">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    
                    {/* Left: Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wide ${
                          comp.type === 'weekly' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}>
                          {comp.type}
                        </span>
                        {isLive && (
                          <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> LIVE NOW
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">{comp.title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-4 max-w-2xl">
                        {comp.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-500" />
                          {isUpcoming ? `Starts: ${startDate.toLocaleDateString()}` : `Ends: ${endDate.toLocaleDateString()}`}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-slate-500" />
                          {comp.registeredCount} Registered
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <Award size={14} />
                          {comp.prizePool} cr Prize Pool
                        </div>
                      </div>
                    </div>

                    {/* Right: CTA */}
                    <div className="w-full md:w-auto flex-shrink-0">
                      <Link href={`/competitions/${comp.id}`}>
                        <button className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          isLive 
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/20'
                            : isUpcoming
                              ? 'bg-white/10 hover:bg-white/15 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}>
                          {isLive ? 'Enter Arena' : isUpcoming ? 'View & Register' : 'View Results'}
                          <ChevronRight size={16} className={isLive ? 'group-hover:translate-x-1 transition-transform' : ''} />
                        </button>
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
