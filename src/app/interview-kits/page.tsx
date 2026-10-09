'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Star, ChevronRight, Users, BarChart3 } from 'lucide-react';
import { getAllInterviewKits, seedInterviewKits, InterviewKit } from '../../lib/interviewKitDb';

export default function InterviewKitsPage() {
  const [kits, setKits] = useState<InterviewKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadKits();
  }, []);

  const loadKits = async () => {
    setLoading(true);
    try {
      let data = await getAllInterviewKits();
      if (data.length === 0) {
        await seedInterviewKits();
        data = await getAllInterviewKits();
      }
      setKits(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = kits.filter(k =>
    k.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-900/30 to-slate-900 border-b border-white/5 pt-12 pb-16 px-4">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
            <BookOpen size={16} /> Interview Preparation
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Crack Any <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Interview.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mb-8">
            Company-specific kits with question banks, coding rounds, resources, and crowd-sourced interview experiences. Everything you need in one place.
          </p>

          <div className="relative max-w-lg">
            <Search size={20} className="absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by company or topic..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 bg-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-white/5 rounded-2xl">
            <BookOpen size={32} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No kits found</h3>
            <p className="text-slate-400">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(kit => (
              <Link key={kit.id} href={`/interview-kits/${kit.id}`}>
                <div className="group h-full bg-slate-900 border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-black/30 cursor-pointer flex flex-col">
                  {/* Gradient header */}
                  <div
                    className="h-28 relative flex items-end p-5"
                    style={{ background: `linear-gradient(135deg, ${kit.gradientFrom}, ${kit.gradientTo})` }}
                  >
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative z-10 flex items-center gap-3">
                      {kit.logoUrl ? (
                        <img src={kit.logoUrl} alt="" className="w-10 h-10 rounded-lg bg-white/90 p-1" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-extrabold text-lg">
                          {kit.companyName.charAt(0)}
                        </div>
                      )}
                      <h3 className="text-2xl font-extrabold text-white drop-shadow-lg">{kit.companyName}</h3>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">
                      {kit.overview}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {kit.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-slate-800 text-slate-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Footer Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="font-bold text-white">{kit.difficultyRating}/5</span> difficulty
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 size={14} />
                        {kit.sourceCount} sources
                      </div>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
