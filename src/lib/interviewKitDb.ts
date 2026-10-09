/**
 * SmartHire Career-Prep Platform — Interview Kit Data Layer
 * Manages the full Interview Preparation Kit: Overview, Question Bank,
 * Coding Rounds, Resources, and User Progress tracking.
 */

import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, query, where,
  orderBy, serverTimestamp, setDoc, addDoc, writeBatch,
  Timestamp
} from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW KIT
// ─────────────────────────────────────────────────────────────────────────────

export interface InterviewKit {
  id: string;
  companyName: string;
  logoUrl: string;
  overview: string;
  difficultyRating: number; // 1–5
  hiringStages: HiringStage[];
  tags: string[];
  industry: string;
  gradientFrom: string;
  gradientTo: string;
  sourceCount: number;
  createdAt?: any;
}

export interface HiringStage {
  name: string;
  description: string;
  typicalDurationDays: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BANK
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionCategory = 'technical' | 'hr' | 'behavioral' | 'system_design';

export interface QuestionBankItem {
  id: string;
  kitId: string;
  category: QuestionCategory;
  question: string;
  modelAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ─────────────────────────────────────────────────────────────────────────────
// KIT CODING PROBLEMS (links to shared Problem entity)
// ─────────────────────────────────────────────────────────────────────────────

export interface KitCodingProblem {
  id: string;
  kitId: string;
  problemId: string; // references Problem in careerprepDb
}

// ─────────────────────────────────────────────────────────────────────────────
// KIT RESOURCES (PDF / Video)
// ─────────────────────────────────────────────────────────────────────────────

export interface KitResource {
  id: string;
  kitId: string;
  type: 'pdf' | 'video';
  title: string;
  description: string;
  url: string;
  isPremium: boolean;
  creditsCost: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER KIT PROGRESS
// ─────────────────────────────────────────────────────────────────────────────

export interface UserKitProgress {
  userId: string;
  kitId: string;
  tab: string;
  percentComplete: number;
  updatedAt?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCHING
// ─────────────────────────────────────────────────────────────────────────────

export const getAllInterviewKits = async (): Promise<InterviewKit[]> => {
  const snap = await getDocs(query(collection(db, 'interviewKits'), orderBy('companyName', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as InterviewKit));
};

export const getInterviewKit = async (id: string): Promise<InterviewKit | null> => {
  const snap = await getDoc(doc(db, 'interviewKits', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as InterviewKit : null;
};

export const getQuestionsForKit = async (kitId: string): Promise<QuestionBankItem[]> => {
  const snap = await getDocs(query(
    collection(db, 'kitQuestions'),
    where('kitId', '==', kitId)
  ));
  
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuestionBankItem));
  // Sort in JS instead of Firestore to avoid composite index requirements
  return results.sort((a, b) => a.category.localeCompare(b.category));
};

export const getCodingProblemsForKit = async (kitId: string): Promise<KitCodingProblem[]> => {
  const snap = await getDocs(query(
    collection(db, 'kitCodingProblems'),
    where('kitId', '==', kitId)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as KitCodingProblem));
};

export const getResourcesForKit = async (kitId: string): Promise<KitResource[]> => {
  const snap = await getDocs(query(
    collection(db, 'kitResources'),
    where('kitId', '==', kitId)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as KitResource));
};

export const getUserKitProgress = async (userId: string, kitId: string): Promise<UserKitProgress[]> => {
  const snap = await getDocs(query(
    collection(db, 'userKitProgress'),
    where('userId', '==', userId),
    where('kitId', '==', kitId)
  ));
  return snap.docs.map(d => d.data() as UserKitProgress);
};

export const updateUserKitProgress = async (progress: UserKitProgress) => {
  const id = `${progress.userId}_${progress.kitId}_${progress.tab}`;
  await setDoc(doc(db, 'userKitProgress', id), {
    ...progress,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

export const seedInterviewKits = async () => {
  const kits: Omit<InterviewKit, 'id'>[] = [
    {
      companyName: 'Google',
      logoUrl: 'https://www.google.com/favicon.ico',
      overview: 'Google\'s interview process is one of the most rigorous in tech. It consists of phone screens, on-site coding rounds, system design sessions, and "Googleyness" behavioral evaluations. Candidates typically face 4-5 rounds over 6-8 weeks, with a hiring committee review.',
      difficultyRating: 5,
      hiringStages: [
        { name: 'Online Assessment', description: 'Algorithmic coding test (2 problems, 90 min)', typicalDurationDays: 7 },
        { name: 'Phone Screen', description: 'Live coding with a Google engineer on a shared doc', typicalDurationDays: 14 },
        { name: 'On-Site (Virtual)', description: '4-5 rounds: 2 coding, 1 system design, 1 behavioral', typicalDurationDays: 1 },
        { name: 'Hiring Committee', description: 'Packet review by committee — no candidate action needed', typicalDurationDays: 21 },
        { name: 'Team Match & Offer', description: 'Matched to a team; offer extended', typicalDurationDays: 14 },
      ],
      tags: ['Algorithms', 'System Design', 'Behavioral'],
      industry: 'Technology',
      gradientFrom: '#4285F4',
      gradientTo: '#0F9D58',
      sourceCount: 342,
    },
    {
      companyName: 'Meta',
      logoUrl: 'https://www.facebook.com/favicon.ico',
      overview: 'Meta\'s engineering interviews focus on coding fundamentals, system design at scale, and product sense. The process moves fast — typically 3-4 weeks from recruiter screen to offer. Expect deep questions on graphs, trees, and distributed systems.',
      difficultyRating: 5,
      hiringStages: [
        { name: 'Recruiter Screen', description: 'Background check and role alignment', typicalDurationDays: 5 },
        { name: 'Technical Phone Screen', description: '45 min live coding on CoderPad', typicalDurationDays: 10 },
        { name: 'On-Site', description: '2 coding + 1 system design + 1 behavioral', typicalDurationDays: 1 },
        { name: 'Offer', description: 'Decision within 1 week of on-site', typicalDurationDays: 7 },
      ],
      tags: ['Coding', 'Product', 'System Design'],
      industry: 'Technology',
      gradientFrom: '#0668E1',
      gradientTo: '#E11099',
      sourceCount: 278,
    },
    {
      companyName: 'Amazon',
      logoUrl: 'https://www.amazon.com/favicon.ico',
      overview: 'Amazon\'s interview loop is structured around its 16 Leadership Principles. Every behavioral answer should map to a principle. Technical rounds test DSA and system design at massive scale. The "Bar Raiser" round is unique to Amazon.',
      difficultyRating: 4,
      hiringStages: [
        { name: 'OA (Online Assessment)', description: '2 coding problems + work simulation', typicalDurationDays: 7 },
        { name: 'Phone Screen', description: '1 coding + LP behavioral questions', typicalDurationDays: 10 },
        { name: 'On-Site Loop', description: '4-5 rounds including a Bar Raiser', typicalDurationDays: 1 },
        { name: 'Debrief & Offer', description: 'Hiring manager debrief; offer within 5 business days', typicalDurationDays: 7 },
      ],
      tags: ['Leadership Principles', 'Coding', 'System Design'],
      industry: 'Technology',
      gradientFrom: '#FF9900',
      gradientTo: '#232F3E',
      sourceCount: 489,
    },
    {
      companyName: 'Microsoft',
      logoUrl: 'https://www.microsoft.com/favicon.ico',
      overview: 'Microsoft interviews emphasize problem-solving, OOP design, and growth mindset. The process is collaborative — interviewers may guide you. System design rounds focus on Azure-scale architecture.',
      difficultyRating: 4,
      hiringStages: [
        { name: 'Recruiter Call', description: 'Background and role fit discussion', typicalDurationDays: 5 },
        { name: 'Phone Screen', description: '45-60 min coding on a shared editor', typicalDurationDays: 10 },
        { name: 'On-Site', description: '4 rounds: coding, design, behavioral, hiring manager', typicalDurationDays: 1 },
        { name: 'Offer', description: 'Results within 1-2 weeks', typicalDurationDays: 14 },
      ],
      tags: ['OOP', 'Cloud', 'Behavioral'],
      industry: 'Technology',
      gradientFrom: '#00A4EF',
      gradientTo: '#7FBA00',
      sourceCount: 312,
    },
  ];

  const batch = writeBatch(db);
  const kitIds: string[] = [];

  for (const kit of kits) {
    const ref = doc(collection(db, 'interviewKits'));
    batch.set(ref, { ...kit, createdAt: serverTimestamp() });
    kitIds.push(ref.id);
  }
  await batch.commit();

  // Seed questions for Google (first kit)
  const googleKitId = kitIds[0];
  const questions: Omit<QuestionBankItem, 'id'>[] = [
    { kitId: googleKitId, category: 'technical', question: 'Design an algorithm to find the longest substring without repeating characters.', modelAnswer: 'Use a sliding window with a HashSet to track characters. Expand the right pointer; when a duplicate is found, shrink from the left. Time: O(n), Space: O(min(m,n)).', difficulty: 'medium' },
    { kitId: googleKitId, category: 'technical', question: 'How would you implement an LRU Cache?', modelAnswer: 'Use a HashMap combined with a Doubly Linked List. The map provides O(1) lookup; the DLL maintains access order. On get/put, move the node to the head. On capacity overflow, evict the tail.', difficulty: 'medium' },
    { kitId: googleKitId, category: 'system_design', question: 'Design Google Maps routing engine.', modelAnswer: 'Core: Pre-computed graph with road segments as edges. Use Dijkstra / A* with heuristic. Hierarchical decomposition (highways vs local roads). Real-time traffic overlay via streaming updates. Caching of popular routes.', difficulty: 'hard' },
    { kitId: googleKitId, category: 'behavioral', question: 'Tell me about a time you had to make a decision with incomplete data.', modelAnswer: 'STAR: Situation — tight deadline with missing user research. Task — decide feature direction. Action — used proxy metrics + stakeholder interviews to form a hypothesis. Result — shipped on time, validated with A/B test showing 12% engagement lift.', difficulty: 'easy' },
    { kitId: googleKitId, category: 'hr', question: 'Why Google?', modelAnswer: 'Focus on: 1) Scale of impact (billions of users), 2) Engineering culture (20% projects, peer review), 3) Specific team/product alignment with your background. Avoid generic answers.', difficulty: 'easy' },
  ];

  const qBatch = writeBatch(db);
  for (const q of questions) {
    const ref = doc(collection(db, 'kitQuestions'));
    qBatch.set(ref, q);
  }
  await qBatch.commit();

  // Seed resources for Google
  const resources: Omit<KitResource, 'id'>[] = [
    { kitId: googleKitId, type: 'pdf', title: 'Google SWE Interview Cheat Sheet', description: 'A 15-page guide covering all core data structures, time complexities, and common patterns seen in Google interviews.', url: '#', isPremium: false, creditsCost: 0 },
    { kitId: googleKitId, type: 'video', title: 'System Design: Google-Scale Search', description: 'A 45-minute video walkthrough of designing a search engine at Google scale, covering indexing, ranking, and serving.', url: '#', isPremium: true, creditsCost: 200 },
    { kitId: googleKitId, type: 'pdf', title: 'Behavioral Interview STAR Framework', description: 'Template and examples for structuring behavioral answers using the STAR method, tailored for Google\'s Googleyness criteria.', url: '#', isPremium: false, creditsCost: 0 },
  ];

  const rBatch = writeBatch(db);
  for (const r of resources) {
    const ref = doc(collection(db, 'kitResources'));
    rBatch.set(ref, r);
  }
  await rBatch.commit();

  return kitIds;
};
