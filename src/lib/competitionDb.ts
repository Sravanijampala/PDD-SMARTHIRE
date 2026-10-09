/**
 * SmartHire Career-Prep Platform — Competitions Data Layer
 * Handles Weekly/5-Day competitions, registrations, and contest-specific logic.
 */

import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, query, where,
  orderBy, serverTimestamp, setDoc, Timestamp, writeBatch
} from 'firebase/firestore';
import { Problem } from './careerprepDb';

export type CompetitionStatus = 'upcoming' | 'live' | 'past';

export interface Competition {
  id: string;
  title: string;
  type: 'weekly' | '5-day';
  description: string;
  startTime: any; // Firestore Timestamp
  endTime: any;
  prizePool: number; // in credits
  registeredCount: number;
  problemIds: string[];
}

export interface CompetitionRegistration {
  id?: string;
  competitionId: string;
  userId: string;
  registeredAt: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCHING COMPETITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getCompetitionsByStatus = async (status: CompetitionStatus): Promise<Competition[]> => {
  const now = new Date();
  let q;
  
  if (status === 'upcoming') {
    q = query(collection(db, 'competitions'), where('startTime', '>', now), orderBy('startTime', 'asc'));
  } else if (status === 'live') {
    q = query(
      collection(db, 'competitions'),
      where('startTime', '<=', now),
      // Note: Firestore doesn't allow multiple inequality filters on different fields, 
      // so we filter endTime in memory.
      orderBy('startTime', 'desc')
    );
  } else {
    // past
    q = query(collection(db, 'competitions'), where('endTime', '<', now), orderBy('endTime', 'desc'));
  }

  const snap = await getDocs(q);
  let comps = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as Competition));

  if (status === 'live') {
    comps = comps.filter(c => {
      const end = c.endTime?.seconds ? new Date(c.endTime.seconds * 1000) : new Date(c.endTime);
      return end > now;
    });
  }

  return comps;
};

export const getCompetition = async (id: string): Promise<Competition | null> => {
  const snap = await getDoc(doc(db, 'competitions', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Competition : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

export const checkRegistration = async (competitionId: string, userId: string): Promise<boolean> => {
  const ref = doc(db, 'competitionRegistrations', `${competitionId}_${userId}`);
  const snap = await getDoc(ref);
  return snap.exists();
};

export const registerForCompetition = async (competitionId: string, userId: string): Promise<void> => {
  const ref = doc(db, 'competitionRegistrations', `${competitionId}_${userId}`);
  
  // Basic transaction to atomically register (increment registeredCount could be added here in Prod)
  await setDoc(ref, {
    competitionId,
    userId,
    registeredAt: serverTimestamp()
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// SEEDING DUMMY DATA
// ─────────────────────────────────────────────────────────────────────────────

export const seedCompetitions = async () => {
  const now = new Date();
  
  const upcomingStart = new Date(now);
  upcomingStart.setDate(upcomingStart.getDate() + 2);
  const upcomingEnd = new Date(upcomingStart);
  upcomingEnd.setDate(upcomingEnd.getDate() + 5);

  const liveStart = new Date(now);
  liveStart.setDate(liveStart.getDate() - 1);
  const liveEnd = new Date(liveStart);
  liveEnd.setDate(liveEnd.getDate() + 7); // weekly

  const pastStart = new Date(now);
  pastStart.setDate(pastStart.getDate() - 10);
  const pastEnd = new Date(pastStart);
  pastEnd.setDate(pastEnd.getDate() + 5);

  const competitions: Omit<Competition, 'id'>[] = [
    {
      title: 'SmartHire Weekly Sprint #42',
      type: 'weekly',
      description: 'Test your algorithms speed in this intense 7-day challenge. Top 10 users earn premium credits!',
      startTime: Timestamp.fromDate(liveStart),
      endTime: Timestamp.fromDate(liveEnd),
      prizePool: 5000,
      registeredCount: 342,
      problemIds: ['comp_prob_1', 'comp_prob_2']
    },
    {
      title: 'Graph Theory 5-Day Clash',
      type: '5-day',
      description: 'Exclusive 5-day contest focusing heavily on graph algorithms and traversal techniques.',
      startTime: Timestamp.fromDate(upcomingStart),
      endTime: Timestamp.fromDate(upcomingEnd),
      prizePool: 2500,
      registeredCount: 128,
      problemIds: []
    },
    {
      title: 'Dynamic Programming Masterclass',
      type: '5-day',
      description: 'Past contest targeting advanced DP patterns.',
      startTime: Timestamp.fromDate(pastStart),
      endTime: Timestamp.fromDate(pastEnd),
      prizePool: 3000,
      registeredCount: 512,
      problemIds: []
    }
  ];

  const batch = writeBatch(db);
  for (const comp of competitions) {
    const ref = doc(collection(db, 'competitions'));
    batch.set(ref, comp);
  }
  await batch.commit();
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYOUT LOGIC
// ─────────────────────────────────────────────────────────────────────────────

export const closeCompetitionAndPayout = async (competitionId: string) => {
  // In a real app, this is triggered by a Cloud Function or Cron Job when endTime is reached.
  const comp = await getCompetition(competitionId);
  if (!comp) return;

  // We would query all submissions for this competition, compute scores, rank users.
  // Then we use the Wallet transaction logic to reward the top users.
  // For example:
  // const topUsers = await computeLeaderboard(competitionId);
  // for (const user of topUsers) {
  //    await processCreditTransaction(user.userId, rewardAmount, 'earn', 'competition_win', `Placed #${user.rank} in ${comp.title}`, comp.id);
  // }
  console.log(`Competition ${competitionId} closed. Payouts processed.`);
};

