'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Heart, Star, Users, BookOpen, Filter, ChevronRight,
  Building, Code, Brain, MessageSquare, Award, TrendingUp,
  Loader2, X, SlidersHorizontal, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import {
  getAllCompanyTracks, getUserFavorites, toggleFavoriteTrack,
  CompanyPrepTrack, seedCompanyTracks
} from '../../lib/careerprepDb';

const INDUSTRIES = ['All', 'Technology', 'IT Services', 'Consulting', 'Entertainment', 'Software'];
const DIFFICULTIES = ['All', 'easy', 'medium', 'hard'];

const SESSION_TYPE_ICONS: Record<string, React.ReactNode> = {
  mcq: <Brain size={14} />,
  coding: <Code size={14} />,
  hr: <MessageSquare size={14} />,
  technical: <BookOpen size={14} />,
  system_design: <TrendingUp size={14} />,
  behavioral: <Award size={14} />,
};

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-400 bg-emerald-400/10',
  medium: 'text-amber-400 bg-amber-400/10',
  hard: 'text-rose-400 bg-rose-400/10',
};

export default function PracticeHubPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tracks, setTracks] = useState<CompanyPrepTrack[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      let data = await getAllCompanyTracks();
      if (data.length === 0) {
        // Seed initial data if empty
        await seedCompanyTracks();
        data = await getAllCompanyTracks();
      }
      setTracks(data);
      if (user?.id) {
        const favs = await getUserFavorites(user.id);
        setFavorites(new Set(favs));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {}, 300);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, trackId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!user?.id) return;
    const newFavs = new Set(favorites);
    if (newFavs.has(trackId)) newFavs.delete(trackId);
    else newFavs.add(trackId);
    setFavorites(newFavs);
    await toggleFavoriteTrack(user.id, trackId);
  };

  const filtered = tracks.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || t.companyName.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
    const matchIndustry = industryFilter === 'All' || t.industry === industryFilter;
    const matchDiff = difficultyFilter === 'All' || t.difficulty === difficultyFilter;
    return matchSearch && matchIndustry && matchDiff;
  });

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Practice Hub</h1>
            <p className="text-xs text-slate-400">Company interview preparation tracks</p>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="max-w-7xl mx-auto px-4 pb-4 flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies, topics..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-slate-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${showFilters ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="max-w-7xl mx-auto px-4 pb-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Industry:</span>
              <select
                value={industryFilter}
                onChange={e => setIndustryFilter(e.target.value)}
                className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={e => setDifficultyFilter(e.target.value)}
                className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none capitalize"
              >
                {DIFFICULTIES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-32 bg-slate-700/50" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-700/50 rounded w-2/3" />
                  <div className="h-3 bg-slate-700/50 rounded w-full" />
                  <div className="h-3 bg-slate-700/50 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Building size={48} className="text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No tracks found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
            <button onClick={() => { setSearchQuery(''); setIndustryFilter('All'); setDifficultyFilter('All'); }}
              className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm hover:bg-cyan-500 transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-6">{filtered.length} tracks available</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(track => (
                <Link key={track.id} href={`/practice/company/${track.id}`}>
                  <CompanyCard
                    track={track}
                    isFavorite={favorites.has(track.id)}
                    onToggleFavorite={(e) => handleToggleFavorite(e, track.id)}
                  />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CompanyCard({ track, isFavorite, onToggleFavorite }: {
  track: CompanyPrepTrack;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group bg-slate-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 cursor-pointer">
      {/* Gradient Banner */}
      <div
        className="h-28 relative flex items-end p-4"
        style={{ background: `linear-gradient(135deg, ${track.gradientFrom}33, ${track.gradientTo}55)` }}
      >
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${track.gradientFrom}44, ${track.gradientTo}88)` }} />
        
        {/* Favorite Button */}
        <button
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all"
        >
          <Heart
            size={16}
            className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white/70'}
          />
        </button>

        {/* Company Name */}
        <div className="relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
            <Building size={20} className="text-white" />
          </div>
          <h3 className="text-white font-bold text-lg leading-tight">{track.companyName}</h3>
          <p className="text-white/70 text-xs">{track.tagline}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {track.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {tag}
            </span>
          ))}
          <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${DIFFICULTY_COLORS[track.difficulty]}`}>
            {track.difficulty}
          </span>
        </div>

        {/* Description */}
        <p className={`text-slate-400 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {track.description}
        </p>
        {track.description.length > 100 && (
          <button
            onClick={e => { e.preventDefault(); setExpanded(!expanded); }}
            className="text-cyan-400 text-xs mt-1 hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              {track.sessionsCount} sessions
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {(track.enrolledCount / 1000).toFixed(1)}k enrolled
            </span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Star size={12} className="fill-amber-400" />
            <span className="font-medium text-white">{track.rating}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-3 flex items-center text-cyan-400 text-sm font-medium group-hover:gap-2 transition-all">
          Start Preparing <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
