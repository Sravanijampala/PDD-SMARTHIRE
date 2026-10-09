/**
 * SmartHire Career-Prep Platform — Firestore Data Layer
 * Handles all read/write operations for Practice Hub and Daily Coding Challenge.
 */

import { db, storage } from './firebase';
import {
  collection, doc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, onSnapshot,
  serverTimestamp, orderBy, limit, increment,
  arrayUnion, addDoc, Timestamp, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ─────────────────────────────────────────────────────────────────────────────
// USER SKILL PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export interface UserSkillProfile {
  userId: string;
  languages: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  domainTags: string[];
  resumeUrl?: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastSolvedDate?: string; // YYYY-MM-DD
  currentDifficultyTier: 'easy' | 'medium' | 'hard';
  consecutiveSolves: number;
  consecutiveFails: number;
  updatedAt?: any;
}

export const upsertUserSkillProfile = async (userId: string, data: Partial<UserSkillProfile>) => {
  const ref = doc(db, 'userSkillProfiles', userId);
  await setDoc(ref, { ...data, userId, updatedAt: serverTimestamp() }, { merge: true });
};

export const getUserSkillProfile = async (userId: string): Promise<UserSkillProfile | null> => {
  const snap = await getDoc(doc(db, 'userSkillProfiles', userId));
  return snap.exists() ? (snap.data() as UserSkillProfile) : null;
};

export const subscribeUserSkillProfile = (userId: string, cb: (p: UserSkillProfile | null) => void) => {
  return onSnapshot(doc(db, 'userSkillProfiles', userId), snap => {
    cb(snap.exists() ? (snap.data() as UserSkillProfile) : null);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY PREP TRACKS (Practice Hub)
// ─────────────────────────────────────────────────────────────────────────────
export interface CompanyPrepTrack {
  id: string;
  companyName: string;
  logoUrl: string;
  tagline: string;
  description: string;
  sessionsCount: number;
  enrolledCount: number;
  rating: number;
  tags: string[];
  industry: string;
  difficulty: 'easy' | 'medium' | 'hard';
  gradientFrom: string;
  gradientTo: string;
  createdAt?: any;
}



export interface UserPrepProgress {
  userId: string;
  trackId: string;
  sessionId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  completedAt?: any;
}

export const getAllCompanyTracks = async (): Promise<CompanyPrepTrack[]> => {
  const snap = await getDocs(query(collection(db, 'companyPrepTracks'), orderBy('enrolledCount', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompanyPrepTrack));
};

export const getCompanyTrack = async (id: string): Promise<CompanyPrepTrack | null> => {
  const snap = await getDoc(doc(db, 'companyPrepTracks', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as CompanyPrepTrack : null;
};

export const getSessionsForTrack = async (trackId: string): Promise<PrepSession[]> => {
  const snap = await getDocs(query(
    collection(db, 'prepSessions'),
    where('trackId', '==', trackId)
  ));
  
  if (snap.empty) {
    // Seed default sessions if missing
    const defaultSessions: Omit<PrepSession, 'id'>[] = [
      { trackId, type: 'mcq', title: 'Aptitude & Reasoning', description: 'Practice quantitative aptitude, logical reasoning, and verbal ability questions.', duration: 45, questionCount: 30, order: 1 },
      { trackId, type: 'coding', title: 'DSA Foundations', description: 'Solve core Data Structures and Algorithms problems commonly asked.', duration: 60, questionCount: 3, order: 2 },
      { trackId, type: 'technical', title: 'Technical / NQT specific', description: 'Specific technical topics and NQT pattern questions.', duration: 45, questionCount: 20, order: 3 },
      { trackId, type: 'system_design', title: 'Advanced Features & Design', description: 'System design basics and advanced features.', duration: 45, questionCount: 5, order: 4 },
      { trackId, type: 'hr', title: 'HR & Behavioral', description: 'Standard HR round questions and behavioral assessment.', duration: 30, questionCount: 10, order: 5 }
    ];
    
    const batch = writeBatch(db);
    for (const session of defaultSessions) {
      const ref = doc(collection(db, 'prepSessions'));
      batch.set(ref, { ...session, createdAt: serverTimestamp() });
    }
    await batch.commit();
    
    // Fetch again
    const newSnap = await getDocs(query(collection(db, 'prepSessions'), where('trackId', '==', trackId)));
    const sessions = newSnap.docs.map(d => ({ id: d.id, ...d.data() } as PrepSession));
    sessions.sort((a, b) => a.order - b.order);
    return sessions;
  }
  
  const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() } as PrepSession));
  sessions.sort((a, b) => a.order - b.order);
  return sessions;
};

export const getUserPrepProgress = async (userId: string, trackId: string): Promise<Record<string, UserPrepProgress>> => {
  const snap = await getDocs(query(
    collection(db, 'userPrepProgress'),
    where('userId', '==', userId),
    where('trackId', '==', trackId)
  ));
  const result: Record<string, UserPrepProgress> = {};
  snap.docs.forEach(d => {
    const data = d.data() as UserPrepProgress;
    result[data.sessionId] = data;
  });
  return result;
};

export const updateSessionProgress = async (progress: UserPrepProgress) => {
  const id = `${progress.userId}_${progress.sessionId}`;
  await setDoc(doc(db, 'userPrepProgress', id), {
    ...progress,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// Favorites
export const toggleFavoriteTrack = async (userId: string, trackId: string): Promise<boolean> => {
  const id = `${userId}_${trackId}`;
  const ref = doc(db, 'favoritePrepTracks', id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  } else {
    await setDoc(ref, { userId, trackId, savedAt: serverTimestamp() });
    return true;
  }
};

export const getUserFavorites = async (userId: string): Promise<string[]> => {
  const snap = await getDocs(query(collection(db, 'favoritePrepTracks'), where('userId', '==', userId)));
  return snap.docs.map(d => d.data().trackId as string);
};

// ─────────────────────────────────────────────────────────────────────────────
// DAILY CODING CHALLENGE
// ─────────────────────────────────────────────────────────────────────────────
export interface ChallengeDay {
  id: string;
  dayNumber: number;
  theme: string;
  releaseDate: string; // ISO date string YYYY-MM-DD
  problemIds: string[];
}

export interface Problem {
  id: string;
  challengeDayId: string;
  title: string;
  statement: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  topicTags: string[];
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: Record<string, string>; // language -> starter code
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
}

export interface Submission {
  id?: string;
  userId: string;
  problemId: string;
  language: string;
  code: string;
  verdict: 'accepted' | 'wrong_answer' | 'tle' | 'runtime_error' | 'compilation_error' | 'pending';
  runtimeMs?: number;
  memoryKb?: number;
  submittedAt: any;
  pointsAwarded?: number;
}

export const getTodayChallengeDay = async (): Promise<ChallengeDay | null> => {
  const today = new Date().toISOString().split('T')[0];
  const snap = await getDocs(query(
    collection(db, 'challengeDays'),
    where('releaseDate', '<=', today),
    orderBy('releaseDate', 'desc'),
    limit(1)
  ));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as ChallengeDay;
};

export const getProblemsForDay = async (dayId: string): Promise<Problem[]> => {
  const snap = await getDocs(query(
    collection(db, 'problems'),
    where('challengeDayId', '==', dayId)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Problem));
};

export const getProblem = async (id: string): Promise<Problem | null> => {
  const snap = await getDoc(doc(db, 'problems', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Problem : null;
};

export const saveSubmission = async (sub: Submission): Promise<string> => {
  const ref = await addDoc(collection(db, 'submissions'), {
    ...sub,
    submittedAt: serverTimestamp()
  });
  return ref.id;
};

export const updateSubmission = async (id: string, data: Partial<Submission>) => {
  await updateDoc(doc(db, 'submissions', id), data);
};

export const getUserSubmissionsForProblem = async (userId: string, problemId: string): Promise<Submission[]> => {
  const snap = await getDocs(query(
    collection(db, 'submissions'),
    where('userId', '==', userId),
    where('problemId', '==', problemId)
  ));
  const submissions = snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission));
  submissions.sort((a, b) => b.submittedAt?.toMillis?.() - a.submittedAt?.toMillis?.());
  return submissions;
};

// ─────────────────────────────────────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  criteriaType: 'points' | 'streak' | 'languages' | 'topic_solves' | 'first_solve';
  criteriaValue: number;
  criteriaTag?: string; // for topic_solves
  color: string;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: any;
}

export const getAllBadges = async (): Promise<Badge[]> => {
  const snap = await getDocs(collection(db, 'badges'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Badge));
};

export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  const snap = await getDocs(query(collection(db, 'userBadges'), where('userId', '==', userId)));
  return snap.docs.map(d => d.data() as UserBadge);
};

export const awardBadge = async (userId: string, badgeId: string) => {
  const id = `${userId}_${badgeId}`;
  const ref = doc(db, 'userBadges', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { userId, badgeId, earnedAt: serverTimestamp() });
    return true; // newly awarded
  }
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoUrl?: string;
  totalPoints: number;
  currentStreak: number;
  rank?: number;
}

export const getLeaderboard = async (limitCount = 50): Promise<LeaderboardEntry[]> => {
  const snap = await getDocs(query(
    collection(db, 'userSkillProfiles'),
    orderBy('totalPoints', 'desc'),
    limit(limitCount)
  ));
  
  // We join with user names — in a real app we'd denormalize this
  const entries = await Promise.all(snap.docs.map(async (d, i) => {
    const profile = d.data() as UserSkillProfile;
    // Get user display name
    const userSnap = await getDoc(doc(db, 'users', d.id));
    const userData = userSnap.data();
    return {
      userId: d.id,
      displayName: userData?.fullName || userData?.name || 'Anonymous',
      photoUrl: userData?.profileImage || userData?.photoUrl || '',
      totalPoints: profile.totalPoints || 0,
      currentStreak: profile.currentStreak || 0,
      rank: i + 1
    } as LeaderboardEntry;
  }));
  return entries;
};

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA HELPER — Populates Firestore with initial company tracks and challenge days
// ─────────────────────────────────────────────────────────────────────────────
export const seedCompanyTracks = async () => {
  const tracks: Omit<CompanyPrepTrack, 'id'>[] = [
    { companyName: 'Google', logoUrl: 'https://www.google.com/favicon.ico', tagline: 'Think Big, Build Fast', description: 'Master Google\'s unique interview format covering algorithms, system design, and Googleyness behavioral questions across all engineering levels.', sessionsCount: 8, enrolledCount: 45230, rating: 4.8, tags: ['Algorithms', 'System Design', 'Behavioral'], industry: 'Technology', difficulty: 'hard', gradientFrom: '#4285F4', gradientTo: '#0F9D58' },
    { companyName: 'Meta', logoUrl: 'https://www.facebook.com/favicon.ico', tagline: 'Move Fast with Stable Infra', description: 'Crack Meta\'s coding interviews with focus on product sense, graph algorithms, distributed systems, and the "Move Fast" engineering culture.', sessionsCount: 7, enrolledCount: 38750, rating: 4.7, tags: ['Coding', 'Product', 'System Design'], industry: 'Technology', difficulty: 'hard', gradientFrom: '#0668E1', gradientTo: '#E11099' },
    { companyName: 'Amazon', logoUrl: 'https://www.amazon.com/favicon.ico', tagline: 'Customer Obsession', description: 'Deep-dive into Amazon\'s 16 Leadership Principles combined with core DSA prep and hands-on system design at massive scale.', sessionsCount: 9, enrolledCount: 52100, rating: 4.9, tags: ['Leadership Principles', 'Coding', 'System Design'], industry: 'Technology', difficulty: 'hard', gradientFrom: '#FF9900', gradientTo: '#232F3E' },
    { companyName: 'Microsoft', logoUrl: 'https://www.microsoft.com/favicon.ico', tagline: 'Empower Every Person', description: 'Prepare for Microsoft interviews with OOP design patterns, Azure cloud architecture, and behavioral questions focused on growth mindset.', sessionsCount: 7, enrolledCount: 41200, rating: 4.7, tags: ['OOP', 'Cloud', 'Behavioral'], industry: 'Technology', difficulty: 'medium', gradientFrom: '#00A4EF', gradientTo: '#7FBA00' },
    { companyName: 'Apple', logoUrl: 'https://www.apple.com/favicon.ico', tagline: 'Think Different', description: 'Navigate Apple\'s highly selective and secretive interview process focusing on Swift, hardware-software integration, and design excellence.', sessionsCount: 6, enrolledCount: 29800, rating: 4.6, tags: ['Swift', 'Design', 'Hardware'], industry: 'Technology', difficulty: 'hard', gradientFrom: '#555555', gradientTo: '#1C1C1E' },
    { companyName: 'Netflix', logoUrl: 'https://www.netflix.com/favicon.ico', tagline: 'Freedom & Responsibility', description: 'Explore Netflix\'s culture deck philosophy in technical interviews with focus on streaming systems, microservices, and high-impact individual ownership.', sessionsCount: 5, enrolledCount: 18600, rating: 4.5, tags: ['Streaming', 'Microservices', 'Culture'], industry: 'Entertainment', difficulty: 'hard', gradientFrom: '#E50914', gradientTo: '#141414' },
    { companyName: 'Adobe', logoUrl: 'https://www.adobe.com/favicon.ico', tagline: 'Creativity for All', description: 'Prepare for Adobe\'s creative-focused engineering interviews with emphasis on multimedia processing, APIs, and cross-platform development.', sessionsCount: 5, enrolledCount: 14500, rating: 4.4, tags: ['APIs', 'Multimedia', 'Cross-Platform'], industry: 'Software', difficulty: 'medium', gradientFrom: '#FF0000', gradientTo: '#FF7A00' },
    { companyName: 'TCS', logoUrl: '', tagline: 'Experience Certainty', description: 'Ace TCS\'s NQT and technical rounds with strong fundamentals in DSA, aptitude, verbal ability, and programming in multiple languages.', sessionsCount: 6, enrolledCount: 98400, rating: 4.3, tags: ['Aptitude', 'DSA', 'NQT'], industry: 'IT Services', difficulty: 'easy', gradientFrom: '#0D2F60', gradientTo: '#1E6FCC' },
    { companyName: 'Infosys', logoUrl: '', tagline: 'Navigate Your Next', description: 'Comprehensive preparation for Infosys InfyTQ and on-campus recruitment covering aptitude, reasoning, and technical programming skills.', sessionsCount: 5, enrolledCount: 87200, rating: 4.2, tags: ['InfyTQ', 'Aptitude', 'Programming'], industry: 'IT Services', difficulty: 'easy', gradientFrom: '#007CC3', gradientTo: '#00B4D8' },
    { companyName: 'Wipro', logoUrl: '', tagline: 'Innovate. Sustain. Transform.', description: 'Prepare for Wipro\'s WILP and NLTH programs with comprehensive aptitude, coding, and essay writing practice modules.', sessionsCount: 4, enrolledCount: 76500, rating: 4.1, tags: ['WILP', 'Aptitude', 'Coding'], industry: 'IT Services', difficulty: 'easy', gradientFrom: '#4A148C', gradientTo: '#7B1FA2' },
    { companyName: 'Deloitte', logoUrl: '', tagline: 'Making an Impact', description: 'Prepare for Deloitte\'s case study and analytical interviews with business problem-solving, consulting scenarios, and tech consulting rounds.', sessionsCount: 6, enrolledCount: 22100, rating: 4.5, tags: ['Consulting', 'Case Studies', 'Analytics'], industry: 'Consulting', difficulty: 'medium', gradientFrom: '#006400', gradientTo: '#7CB342' },
  ];

  const batch = writeBatch(db);
  for (const track of tracks) {
    const ref = doc(collection(db, 'companyPrepTracks'));
    batch.set(ref, { ...track, createdAt: serverTimestamp() });
  }
  await batch.commit();
};

export const seedBadges = async () => {
  const badges: Omit<Badge, 'id'>[] = [
    { name: 'Code Novice', description: 'Earn your first 100 points', iconUrl: '🏅', criteriaType: 'points', criteriaValue: 100, color: '#CD7F32' },
    { name: 'Bronze Coder', description: 'Accumulate 500 points', iconUrl: '🥉', criteriaType: 'points', criteriaValue: 500, color: '#CD7F32' },
    { name: 'Silver Hacker', description: 'Accumulate 2000 points', iconUrl: '🥈', criteriaType: 'points', criteriaValue: 2000, color: '#C0C0C0' },
    { name: 'Gold Champion', description: 'Accumulate 5000 points', iconUrl: '🥇', criteriaType: 'points', criteriaValue: 5000, color: '#FFD700' },
    { name: 'Streak Starter', description: 'Maintain a 3-day coding streak', iconUrl: '🔥', criteriaType: 'streak', criteriaValue: 3, color: '#FF6B35' },
    { name: 'Streak Master', description: 'Maintain a 7-day coding streak', iconUrl: '⚡', criteriaType: 'streak', criteriaValue: 7, color: '#FFA500' },
    { name: 'Streak Legend', description: 'Maintain a 30-day coding streak', iconUrl: '💎', criteriaType: 'streak', criteriaValue: 30, color: '#00FFFF' },
    { name: 'Language Explorer', description: 'Solve problems in 3+ different languages', iconUrl: '🌐', criteriaType: 'languages', criteriaValue: 3, color: '#9C27B0' },
    { name: 'Topic Slayer: DP', description: 'Solve 10 Dynamic Programming problems', iconUrl: '🧠', criteriaType: 'topic_solves', criteriaValue: 10, criteriaTag: 'Dynamic Programming', color: '#E91E63' },
    { name: 'First Blood', description: 'Submit your very first solution', iconUrl: '⚔️', criteriaType: 'first_solve', criteriaValue: 1, color: '#F44336' },
  ];

  const batch = writeBatch(db);
  for (const badge of badges) {
    const ref = doc(collection(db, 'badges'));
    batch.set(ref, badge);
  }
  await batch.commit();
};

export const seedChallengeDays = async () => {
  const today = new Date();
  const toDate = (daysBack: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysBack);
    return d.toISOString().split('T')[0];
  };

  const days = [
    { dayNumber: 1, theme: 'Arrays & Two Pointers', releaseDate: toDate(2) },
    { dayNumber: 2, theme: 'Strings & Hashing', releaseDate: toDate(1) },
    { dayNumber: 3, theme: 'Dynamic Programming Basics', releaseDate: toDate(0) },
  ];

  for (const day of days) {
    const dayRef = await addDoc(collection(db, 'challengeDays'), day);
    
    // Seed problems for each day
    const problemsByDay: Omit<Problem, 'id'>[] = [
      {
        challengeDayId: dayRef.id,
        title: 'Two Sum',
        statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
        difficulty: 'easy',
        points: 100,
        topicTags: ['Arrays', 'Hash Map'],
        examples: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
        ],
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
        starterCode: {
          python: 'def twoSum(nums, target):\n    # Your code here\n    pass',
          javascript: 'function twoSum(nums, target) {\n    // Your code here\n}',
          java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}',
          cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your code here\n        return {};\n    }\n};',
          c: '#include <stdlib.h>\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Your code here\n    *returnSize = 2;\n    int* result = (int*)malloc(2 * sizeof(int));\n    return result;\n}'
        },
        testCases: [
          { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false },
          { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: false },
          { input: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: true }
        ]
      }
    ];
    
    for (const problem of problemsByDay) {
      await addDoc(collection(db, 'problems'), problem);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS & PROGRESS
// ─────────────────────────────────────────────────────────────────────────────

export interface PrepSession {
  id?: string;
  trackId: string;
  type: 'mcq' | 'coding' | 'hr' | 'technical' | 'system_design' | 'behavioral';
  title: string;
  description?: string;
  duration: number;
  questionCount: number;
  order: number;
  isCompleted?: boolean;
}

export interface UserTrackProgress {
  userId: string;
  trackId: string;
  completedSessionIds: string[];
  lastAccessed: any;
  progressPercent: number;
}

export const getPrepSessionsForTrack = async (trackId: string): Promise<PrepSession[]> => {
  const q = query(collection(db, 'prepSessions'), where('trackId', '==', trackId));
  const snap = await getDocs(q);
  // Sort manually to avoid index issues
  const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() } as PrepSession));
  sessions.sort((a, b) => a.order - b.order);
  return sessions;
};

export const getUserTrackProgress = async (userId: string, trackId: string): Promise<UserTrackProgress | null> => {
  const docId = `${userId}_${trackId}`;
  const ref = doc(db, 'userTrackProgress', docId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserTrackProgress) : null;
};

export const markSessionCompleted = async (userId: string, trackId: string, sessionId: string, totalSessions: number) => {
  const docId = `${userId}_${trackId}`;
  const ref = doc(db, 'userTrackProgress', docId);
  const snap = await getDoc(ref);
  
  if (snap.exists()) {
    const data = snap.data() as UserTrackProgress;
    const newCompleted = Array.from(new Set([...data.completedSessionIds, sessionId]));
    await setDoc(ref, {
      ...data,
      completedSessionIds: newCompleted,
      progressPercent: Math.round((newCompleted.length / totalSessions) * 100),
      lastAccessed: serverTimestamp()
    }, { merge: true });
  } else {
    await setDoc(ref, {
      userId,
      trackId,
      completedSessionIds: [sessionId],
      progressPercent: Math.round((1 / totalSessions) * 100),
      lastAccessed: serverTimestamp()
    });
  }
};

export const seedTrackSessions = async (trackId: string) => {
  const q = query(collection(db, 'prepSessions'), where('trackId', '==', trackId));
  const snap = await getDocs(q);
  if (!snap.empty) return; // already seeded

  const sessions: Omit<PrepSession, 'id'>[] = [
    { trackId, type: 'mcq', title: 'Core Concepts Quiz', duration: 15, order: 1, questionCount: 10 },
    { trackId, type: 'coding', title: 'Data Structures Challenge', duration: 45, order: 2, questionCount: 5 },
    { trackId, type: 'system_design', title: 'Architecture Basics', duration: 60, order: 3, questionCount: 3 },
    { trackId, type: 'hr', title: 'Behavioral Prep', duration: 20, order: 4, questionCount: 8 },
  ];

  const batch = writeBatch(db);
  for (const s of sessions) {
    const ref = doc(collection(db, 'prepSessions'));
    batch.set(ref, s);
  }
  await batch.commit();
};

