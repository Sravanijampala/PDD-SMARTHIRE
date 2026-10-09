'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bookmark, BookmarkX, Search, Tag } from 'lucide-react';

interface BookmarkItem {
  id: number;
  q: string;
  topic: string;
  company: string;
  difficulty: string;
  answer?: string;
}

const defaultBookmarks: BookmarkItem[] = [
  { id: 1, q: 'How would you design a distributed cache system?', topic: 'System Design', company: 'Google', difficulty: 'Hard' },
  { id: 2, q: 'Explain the difference between TCP and UDP.', topic: 'Networking', company: 'Meta', difficulty: 'Medium' },
  { id: 3, q: 'Tell me about a time you led a team under pressure.', topic: 'Behavioral', company: 'Amazon', difficulty: 'Medium' },
  { id: 4, q: 'What is the time complexity of Dijkstra\'s algorithm?', topic: 'DSA', company: 'Google', difficulty: 'Hard' },
  { id: 5, q: 'What are the SOLID principles?', topic: 'OOP', company: 'Meta', difficulty: 'Easy' },
];

const diffColor = (d: string) =>
  d === 'Easy' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' :
  d === 'Medium' ? 'text-amber-400 bg-amber-950/60 border-amber-500/30' :
  'text-red-400 bg-red-950/60 border-red-500/30';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(defaultBookmarks);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const companies = ['All', 'Google', 'Meta', 'Amazon'];
  const filtered = bookmarks
    .filter(b => filter === 'All' || b.company === filter)
    .filter(b => search === '' || b.q.toLowerCase().includes(search.toLowerCase()) || b.topic.toLowerCase().includes(search.toLowerCase()));

  const remove = (id: number) => setBookmarks(prev => prev.filter(b => b.id !== id));

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100">
      <div className="fixed top-0 right-1/4 w-[400px] h-[400px] bg-amber-500/6 rounded-full blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-30 bg-[#0B1220]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white">Bookmarks</h1>
            <p className="text-xs text-slate-400">{filtered.length} saved questions</p>
          </div>
        </div>
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookmarks..."
            className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48 transition-colors" />
        </div>
      </header>

      <div className="w-full px-6 lg:px-16 py-8 max-w-4xl mx-auto space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {companies.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-5 py-2 rounded-xl border text-sm font-bold whitespace-nowrap transition-all ${filter === c ? 'bg-slate-800 text-amber-400 border-amber-500/50' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">No bookmarks found</p>
            <Link href="/library" className="text-amber-400 text-sm hover:underline mt-2 block">
              Go to Interview Library →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => (
              <div key={b.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex items-start justify-between gap-4 hover:border-amber-500/30 transition-all group">
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-bold text-white leading-relaxed group-hover:text-amber-200 transition-colors">{b.q}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-1 rounded-full font-semibold">
                      <Tag size={10} /> {b.topic}
                    </span>
                    <span className="text-xs text-slate-400">{b.company}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${diffColor(b.difficulty)}`}>{b.difficulty}</span>
                  </div>
                </div>
                <button onClick={() => remove(b.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-all flex-shrink-0">
                  <BookmarkX size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
