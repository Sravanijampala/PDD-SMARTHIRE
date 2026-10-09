/**
 * SmartHire — Gamification Engine
 * Handles points, streaks, adaptive difficulty, and badge awarding.
 * Pure business logic — easily unit-testable.
 */

import { UserSkillProfile, Badge, UserBadge, Submission, awardBadge, upsertUserSkillProfile } from './careerprepDb';

// ─────────────────────────────────────────────────────────────────────────────
// POINTS CONFIGURATION (config-driven — add tiers without refactor)
// ─────────────────────────────────────────────────────────────────────────────
export const POINTS_CONFIG = {
  difficulty: {
    easy: 100,
    medium: 250,
    hard: 500,
  },
  bonusSameDaySubmission: 50,
  bonusStreakMultiplier: 0.1, // 10% bonus per active streak day (capped at 2x)
  maxStreakMultiplier: 2.0,
};

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE DIFFICULTY
// ─────────────────────────────────────────────────────────────────────────────
export const ADAPTIVE_CONFIG = {
  solveCountToLevelUp: 3,   // Raise difficulty after N consecutive solves
  failCountToLevelDown: 3,  // Ease off after M consecutive fails
};

export type DifficultyTier = 'easy' | 'medium' | 'hard';

export function computeNewDifficultyTier(
  currentTier: DifficultyTier,
  consecutiveSolves: number,
  consecutiveFails: number
): DifficultyTier {
  const tierOrder: DifficultyTier[] = ['easy', 'medium', 'hard'];
  const idx = tierOrder.indexOf(currentTier);

  if (consecutiveSolves >= ADAPTIVE_CONFIG.solveCountToLevelUp && idx < 2) {
    return tierOrder[idx + 1];
  }
  if (consecutiveFails >= ADAPTIVE_CONFIG.failCountToLevelDown && idx > 0) {
    return tierOrder[idx - 1];
  }
  return currentTier;
}

// ─────────────────────────────────────────────────────────────────────────────
// STREAK LOGIC
// ─────────────────────────────────────────────────────────────────────────────
export function computeNewStreak(
  lastSolvedDate: string | undefined,
  currentStreak: number,
  longestStreak: number,
  todayStr: string // YYYY-MM-DD
): { currentStreak: number; longestStreak: number; lastSolvedDate: string } {
  if (!lastSolvedDate) {
    // First solve ever
    return { currentStreak: 1, longestStreak: Math.max(1, longestStreak), lastSolvedDate: todayStr };
  }

  const last = new Date(lastSolvedDate);
  const today = new Date(todayStr);
  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already solved today — don't increment streak
    return { currentStreak, longestStreak, lastSolvedDate };
  } else if (diffDays === 1) {
    // Consecutive day — increment streak
    const newStreak = currentStreak + 1;
    return { currentStreak: newStreak, longestStreak: Math.max(newStreak, longestStreak), lastSolvedDate: todayStr };
  } else {
    // Streak broken
    return { currentStreak: 1, longestStreak, lastSolvedDate: todayStr };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POINTS CALCULATION
// ─────────────────────────────────────────────────────────────────────────────
export function computePoints(
  difficulty: 'easy' | 'medium' | 'hard',
  isSameDay: boolean,
  currentStreak: number
): number {
  let base = POINTS_CONFIG.difficulty[difficulty];
  if (isSameDay) base += POINTS_CONFIG.bonusSameDaySubmission;

  const streakMultiplier = Math.min(
    1 + currentStreak * POINTS_CONFIG.bonusStreakMultiplier,
    POINTS_CONFIG.maxStreakMultiplier
  );
  return Math.round(base * streakMultiplier);
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE CRITERIA CHECK
// ─────────────────────────────────────────────────────────────────────────────
export interface BadgeCheckContext {
  totalPoints: number;
  currentStreak: number;
  uniqueLanguages: string[];
  topicSolveCounts: Record<string, number>;
  totalSolves: number;
}

export function checkBadgeEarned(badge: Badge, ctx: BadgeCheckContext): boolean {
  switch (badge.criteriaType) {
    case 'points':
      return ctx.totalPoints >= badge.criteriaValue;
    case 'streak':
      return ctx.currentStreak >= badge.criteriaValue;
    case 'languages':
      return ctx.uniqueLanguages.length >= badge.criteriaValue;
    case 'topic_solves':
      return (ctx.topicSolveCounts[badge.criteriaTag || ''] || 0) >= badge.criteriaValue;
    case 'first_solve':
      return ctx.totalSolves >= badge.criteriaValue;
    default:
      return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER PROCESS SUBMISSION — Called after a successful code submission
// ─────────────────────────────────────────────────────────────────────────────
export async function processAcceptedSubmission(
  userId: string,
  profile: UserSkillProfile,
  submission: Submission,
  difficulty: 'easy' | 'medium' | 'hard',
  problemTopicTags: string[],
  allBadges: Badge[],
  userBadgeIds: string[],
  releaseDate: string,
): Promise<{
  pointsAwarded: number;
  newBadges: Badge[];
  newStreak: number;
  newTier: DifficultyTier;
}> {
  const today = new Date().toISOString().split('T')[0];
  const isSameDay = releaseDate === today;

  // 1. Compute streak
  const streakData = computeNewStreak(
    profile.lastSolvedDate,
    profile.currentStreak || 0,
    profile.longestStreak || 0,
    today
  );

  // 2. Compute points with streak bonus
  const pointsAwarded = computePoints(difficulty, isSameDay, streakData.currentStreak);

  // 3. Compute consecutive solve/fail counters for adaptive difficulty
  const isFirstSolveToday = streakData.lastSolvedDate !== profile.lastSolvedDate;
  const consecutiveSolves = isFirstSolveToday ? (profile.consecutiveSolves || 0) + 1 : profile.consecutiveSolves || 0;
  const consecutiveFails = 0; // reset on solve

  // 4. Adaptive difficulty tier
  const newTier = computeNewDifficultyTier(
    profile.currentDifficultyTier || 'easy',
    consecutiveSolves,
    consecutiveFails
  );

  // 5. Update languages and topic counts
  const newLanguages = Array.from(new Set([...(profile.languages || []), submission.language]));
  // If `topicSolveCounts` doesn't exist on UserSkillProfile, we can just cast it or add it to the DB schema
  const currentTopicCounts = (profile as any).topicSolveCounts || {};
  const newTopicCounts = { ...currentTopicCounts };
  for (const tag of problemTopicTags) {
    newTopicCounts[tag] = (newTopicCounts[tag] || 0) + 1;
  }

  // 6. Update Firestore profile
  const newTotalPoints = (profile.totalPoints || 0) + pointsAwarded;
  await upsertUserSkillProfile(userId, {
    totalPoints: newTotalPoints,
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    lastSolvedDate: streakData.lastSolvedDate,
    currentDifficultyTier: newTier,
    consecutiveSolves,
    consecutiveFails,
    languages: newLanguages,
    ...( { topicSolveCounts: newTopicCounts } as any ),
  });

  // 7. Check and award badges
  const ctx: BadgeCheckContext = {
    totalPoints: newTotalPoints,
    currentStreak: streakData.currentStreak,
    uniqueLanguages: newLanguages,
    topicSolveCounts: newTopicCounts,
    totalSolves: (profile as any).totalSolves ? (profile as any).totalSolves + 1 : 1,
  };

  const newBadges: Badge[] = [];
  for (const badge of allBadges) {
    if (!userBadgeIds.includes(badge.id) && checkBadgeEarned(badge, ctx)) {
      const awarded = await awardBadge(userId, badge.id);
      if (awarded) newBadges.push(badge);
    }
  }

  // Update total solves in profile (optional, just for first_solve badge tracking)
  await upsertUserSkillProfile(userId, {
    ...( { totalSolves: ctx.totalSolves } as any ),
  });

  return {
    pointsAwarded,
    newBadges,
    newStreak: streakData.currentStreak,
    newTier,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS FAILED SUBMISSION — Track failures for adaptive difficulty
// ─────────────────────────────────────────────────────────────────────────────
export async function processFailedSubmission(
  userId: string,
  profile: UserSkillProfile,
): Promise<{ newTier: DifficultyTier }> {
  const consecutiveFails = (profile.consecutiveFails || 0) + 1;
  const consecutiveSolves = 0; // reset on fail

  const newTier = computeNewDifficultyTier(
    profile.currentDifficultyTier || 'easy',
    consecutiveSolves,
    consecutiveFails
  );

  await upsertUserSkillProfile(userId, {
    currentDifficultyTier: newTier,
    consecutiveFails,
    consecutiveSolves,
  });

  return { newTier };
}
