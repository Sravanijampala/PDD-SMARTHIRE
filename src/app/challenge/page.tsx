'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Flame, Trophy, Target, Code, Calendar, Star, TrendingUp,
  CheckCircle2, Clock, Bookmark, ChevronRight, Users, Zap, BarChart3, Sparkles
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import {
  getTodayChallengeDay, getProblemsForDay, getUserSubmissionsForProblem,
  getUserSkillProfile, getLeaderboard, getUserBadges, getAllBadges,
  ChallengeDay, Problem, Submission, UserSkillProfile, LeaderboardEntry, Badge, UserBadge,
} from '../../lib/careerprepDb';
import { seedRichChallengeData } from '../../lib/seedChallengeData';
import { StreakCalendar } from '../../components/StreakCalendar';
import { BadgeShowcase, BadgeDisplayInfo } from '../../components/BadgeShowcase';
import { Podium } from '../../components/Podium';

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  hard: { label: 'Hard', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
};

type ActiveTab = 'problems' | 'stats' | 'leaderboard';

export default function ChallengePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('problems');
  const [challengeDay, setChallengeDay] = useState<ChallengeDay | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProfile, setUserProfile] = useState<UserSkillProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userBadgeIds, setUserBadgeIds] = useState<Set<string>>(new Set());
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      let day = await getTodayChallengeDay();
      if (!day) {
        await seedRichChallengeData();
        day = await getTodayChallengeDay();
      }

      if (day) {
        setChallengeDay(day);
        const probs = await getProblemsForDay(day.id);
        setProblems(probs);

        if (user?.id) {
          // Check which problems user has solved
          const solved = new Set<string>();
          await Promise.all(probs.map(async (p) => {
            const subs = await getUserSubmissionsForProblem(user.id, p.id!);
            if (subs.some(s => s.verdict === 'accepted')) solved.add(p.id!);
          }));
          setSolvedProblems(solved);
        }
      }

      const [profile, lb, badges] = await Promise.all([
        user?.id ? getUserSkillProfile(user.id) : Promise.resolve(null),
        getLeaderboard(20),
        getAllBadges(),
      ]);

      if (user?.id && !profile) {
        router.push('/onboarding');
        return;
      }

      setUserProfile(profile);
      setLeaderboard(lb);
      setAllBadges(badges);

      if (user?.id) {
        const ub = await getUserBadges(user.id);
        setUserBadgeIds(new Set(ub.map(b => b.badgeId)));
      }
    } finally {
      setLoading(false);
    }
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const userRank = leaderboard.findIndex(e => e.userId === user?.id) + 1;

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame size={20} className="text-orange-400" />
                Daily Coding Challenge
              </h1>
              <p className="text-xs text-slate-400">
                {challengeDay ? `Day ${challengeDay.dayNumber} · ${challengeDay.theme}` : 'Loading...'}
              </p>
            </div>
          </div>
          {/* Streak badge */}
          {userProfile && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5">
              <Flame size={16} className="text-orange-400" />
              <span className="text-orange-400 font-bold text-sm">{userProfile.currentStreak || 0}</span>
              <span className="text-orange-400/70 text-xs">day streak</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-1">
          {(['problems', 'stats', 'leaderboard'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              {tab === 'leaderboard' && <Trophy size={14} className="inline mr-1.5" />}
              {tab === 'stats' && <BarChart3 size={14} className="inline mr-1.5" />}
              {tab === 'problems' && <Code size={14} className="inline mr-1.5" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* PROBLEMS TAB */}
            {activeTab === 'problems' && (
              <div className="space-y-4">
                {userProfile?.currentDifficultyTier && (
                  <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <Sparkles size={20} className="text-cyan-400 flex-shrink-0" />
                    <p className="text-sm text-cyan-100">
                      We've tailored today's challenge to your <span className="font-bold text-white capitalize">{userProfile.currentDifficultyTier}</span> level profile in <span className="font-bold text-white">{userProfile.languages?.[0] || 'Software Engineering'}</span>.
                    </p>
                  </div>
                )}
                {problems.length === 0 ? (
                  <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center">
                    <Code size={40} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No problems available for today yet.</p>
                  </div>
                ) : problems.map((problem) => {
                  const cfg = DIFFICULTY_CONFIG[problem.difficulty];
                  const isSolved = solvedProblems.has(problem.id!);
                  return (
                    <Link key={problem.id} href={`/challenge/solve/${problem.id}`}>
                      <div className="group bg-slate-900 border border-white/5 hover:border-white/10 rounded-2xl p-5 flex items-center gap-5 hover:shadow-xl hover:shadow-black/20 transition-all cursor-pointer">
                        {/* Status icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSolved ? 'bg-emerald-500/10' : 'bg-slate-800'}`}>
                          {isSolved
                            ? <CheckCircle2 size={20} className="text-emerald-400" />
                            : <Code size={20} className="text-slate-400" />
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-semibold">{problem.title}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                              {cfg.label}
                            </span>
                            {problem.topicTags.slice(0, 2).map(tag => (
                              <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-400">{tag}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Zap size={11} className="text-amber-400" />{problem.points} pts</span>
                            <span className="capitalize">{problem.difficulty}</span>
                          </div>
                        </div>

                        <ChevronRight size={18} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {!userProfile ? (
                  <div className="text-center py-12 text-slate-400">Sign in to view your stats.</div>
                ) : (
                  <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Points', value: userProfile.totalPoints || 0, icon: <Star size={18} className="text-amber-400" />, color: 'text-amber-400' },
                        { label: 'Current Streak', value: `${userProfile.currentStreak || 0}d`, icon: <Flame size={18} className="text-orange-400" />, color: 'text-orange-400' },
                        { label: 'Best Streak', value: `${userProfile.longestStreak || 0}d`, icon: <Trophy size={18} className="text-cyan-400" />, color: 'text-cyan-400' },
                        { label: 'Current Tier', value: userProfile.currentDifficultyTier || 'Easy', icon: <Target size={18} className="text-purple-400" />, color: 'text-purple-400' },
                      ].map(stat => (
                        <div key={stat.label} className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                          <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-slate-400 text-xs">{stat.label}</span></div>
                          <p className={`text-2xl font-bold ${stat.color} capitalize`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Activity Heatmap */}
                    <StreakCalendar
                      solveHistory={{ [new Date().toISOString().split('T')[0]]: userProfile.currentStreak ? 1 : 0 }}
                      currentStreak={userProfile.currentStreak || 0}
                      longestStreak={userProfile.longestStreak || 0}
                    />

                    {/* Badge Showcase */}
                    <BadgeShowcase
                      badges={allBadges.map(b => ({
                        ...b,
                        earned: userBadgeIds.has(b.id),
                        progress: userBadgeIds.has(b.id) ? 100 : (b.criteriaType === 'points' && userProfile.totalPoints) ? Math.min(100, Math.floor((userProfile.totalPoints / b.criteriaValue) * 100)) : 0
                      }))}
                    />
                  </>
                )}
              </div>
            )}

            {/* LEADERBOARD TAB */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                {/* Podium Top 3 */}
                {leaderboard.length > 0 && (
                  <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <h2 className="text-center text-white font-bold mb-6">🏆 Top Performers</h2>
                    <Podium entries={leaderboard.slice(0, 3).map((e, i) => ({ ...e, rank: e.rank ?? i + 1 }))} currentUserId={user?.id} />
                  </div>
                )}

                {/* Full Table */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-12 px-4 py-3 text-xs text-slate-500 border-b border-white/5">
                    <span className="col-span-1">Rank</span>
                    <span className="col-span-6">Participant</span>
                    <span className="col-span-3 text-right">Points</span>
                    <span className="col-span-2 text-right">Streak</span>
                  </div>
                  {leaderboard.map((entry, i) => {
                    const isCurrentUser = entry.userId === user?.id;
                    return (
                      <div
                        key={entry.userId}
                        className={`grid grid-cols-12 px-4 py-3 border-b border-white/5 items-center text-sm ${isCurrentUser ? 'bg-cyan-500/5 border-l-2 border-l-cyan-500' : 'hover:bg-white/2'} transition-colors`}
                      >
                        <span className={`col-span-1 font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                          #{i + 1}
                        </span>
                        <div className="col-span-6 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {entry.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className={`font-medium truncate ${isCurrentUser ? 'text-cyan-400' : 'text-white'}`}>
                            {entry.displayName} {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                          </span>
                        </div>
                        <span className="col-span-3 text-right font-bold text-amber-400">{(entry.totalPoints || 0).toLocaleString()}</span>
                        <span className="col-span-2 text-right text-orange-400 flex items-center justify-end gap-1">
                          <Flame size={12} /> {entry.currentStreak || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
