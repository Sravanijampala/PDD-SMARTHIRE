/**
 * SmartHire Career-Prep Platform — Mock Interview Data Layer
 * Handles AI-simulated and Peer/Mentor mock interview booking.
 */

import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, query, where,
  orderBy, serverTimestamp, setDoc, addDoc
} from 'firebase/firestore';
import { processCreditTransaction } from './walletDb';

export type MockInterviewType = 'ai_simulated' | 'peer_mentor';
export type MockInterviewStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed_pending_review' | 'flagged_suspicious' | 'under_review' | 'completed' | 'cancelled';

export interface MockInterview {
  id: string;
  userId: string;
  type: MockInterviewType;
  companyId?: string;
  companyName?: string;
  role?: string;
  scheduledAt?: any;
  status: MockInterviewStatus;
  creditsCost: number;
  feedbackReport?: FeedbackReport;
  counterpartUserId?: string;
  createdAt: any;
}

export interface TheoryQuestion {
  id: string;
  question: string;
  expectedKeywords: string[];
  answer?: string;
}

export interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  starterCode: Record<string, string>;
  submittedCode?: string;
}

export interface MockInterviewSession extends MockInterview {
  language: string;
  questions: (TheoryQuestion | CodingQuestion)[];
  startedAt?: any;
  completedAt?: any;
  reportId?: string;
}

export interface ProctoringEvent {
  id?: string;
  sessionId: string;
  type: 'tab_switch' | 'devtools' | 'copy_paste' | 'no_face' | 'multiple_faces';
  severity: 'low' | 'medium' | 'high';
  timestamp: any;
}

export interface PerformanceReport {
  id?: string;
  sessionId: string;
  overallScore: number;
  perQuestionScores: { questionId: string; score: number; feedback: string }[];
  strengths: string[];
  gaps: string[];
  suggestedResources: string[];
  generatedAt: any;
  status: 'pending' | 'ready' | 'under_review';
}

export interface FeedbackReport {
  strengths: string[];
  gaps: string[];
  suggestedResources: string[];
  overallScore: number; // 1-10
  notes: string;
}

export interface MentorSlot {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar?: string;
  expertise: string[];
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "10:00 AM - 11:00 AM"
  isBooked: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREDIT COSTS
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_INTERVIEW_COSTS = {
  ai_simulated: 100,
  peer_mentor: 250,
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const bookAIMockInterview = async (
  userId: string,
  companyName?: string,
  role?: string
): Promise<string> => {
  const cost = MOCK_INTERVIEW_COSTS.ai_simulated;

  // Deduct credits atomically
  await processCreditTransaction(
    userId,
    cost,
    'spend',
    'mock_interview_ai',
    `AI Mock Interview${companyName ? ` — ${companyName}` : ''}`
  );

  // Create the interview record
  const ref = await addDoc(collection(db, 'mockInterviews'), {
    userId,
    type: 'ai_simulated',
    companyName: companyName || null,
    role: role || null,
    status: 'in_progress',
    creditsCost: cost,
    createdAt: serverTimestamp(),
  });

  return ref.id;
};

export const bookPeerMockInterview = async (
  userId: string,
  slotId: string,
  companyName?: string,
  role?: string
): Promise<string> => {
  const cost = MOCK_INTERVIEW_COSTS.peer_mentor;

  // Deduct credits
  await processCreditTransaction(
    userId,
    cost,
    'spend',
    'mock_interview_peer',
    `Peer Mock Interview${companyName ? ` — ${companyName}` : ''}`
  );

  // Mark slot as booked
  await setDoc(doc(db, 'mentorSlots', slotId), { isBooked: true }, { merge: true });

  // Create interview record
  const ref = await addDoc(collection(db, 'mockInterviews'), {
    userId,
    type: 'peer_mentor',
    companyName: companyName || null,
    role: role || null,
    status: 'scheduled',
    creditsCost: cost,
    createdAt: serverTimestamp(),
  });

  return ref.id;
};

// ─────────────────────────────────────────────────────────────────────────────
// FETCHING
// ─────────────────────────────────────────────────────────────────────────────

export const getUserMockInterviews = async (userId: string): Promise<MockInterview[]> => {
  const snap = await getDocs(query(
    collection(db, 'mockInterviews'),
    where('userId', '==', userId)
  ));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as MockInterview));
  // Sort in JS to avoid Firestore composite index requirement
  return results.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });
};

export const getAvailableMentorSlots = async (): Promise<MentorSlot[]> => {
  const snap = await getDocs(query(
    collection(db, 'mentorSlots'),
    where('isBooked', '==', false)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorSlot));
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSION FORMAT & PROCTORING
// ─────────────────────────────────────────────────────────────────────────────

export const getMockInterview = async (id: string): Promise<MockInterviewSession | null> => {
  const snap = await getDoc(doc(db, 'mockInterviews', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as MockInterviewSession;
};

export const startMockInterviewSession = async (id: string, language: string): Promise<void> => {
  // Generate dummy questions for the session
  const questions: (TheoryQuestion | CodingQuestion)[] = [];
  for (let i = 1; i <= 7; i++) {
    questions.push({
      id: `tq_${i}`,
      question: `Theory Question ${i}: How would you explain the underlying architecture and trade-offs of this specific problem scenario?`,
      expectedKeywords: ['concept', 'solution', 'trade-off']
    } as TheoryQuestion);
  }
  questions.push({
    id: 'cq_1',
    title: 'Two Sum Variant',
    description: 'Find two numbers in the array that add up to target. Write an optimized O(n) solution using a hash map.',
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  // your code here\n}',
      python: 'def twoSum(nums, target):\n  # your code here\n  pass',
      java: 'class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    // your code here\n    return new int[]{};\n  }\n}'
    }
  } as CodingQuestion);

  await setDoc(doc(db, 'mockInterviews', id), {
    status: 'in_progress',
    language,
    questions,
    startedAt: serverTimestamp()
  }, { merge: true });
};

export const logProctoringEvent = async (event: Omit<ProctoringEvent, 'id'|'timestamp'>): Promise<void> => {
  await addDoc(collection(db, 'proctoringEvents'), {
    ...event,
    timestamp: serverTimestamp()
  });
};

export const getProctoringEvents = async (sessionId: string): Promise<ProctoringEvent[]> => {
  const snap = await getDocs(query(
    collection(db, 'proctoringEvents'),
    where('sessionId', '==', sessionId),
    orderBy('timestamp', 'asc')
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProctoringEvent));
};

export const submitMockInterviewSession = async (
  sessionId: string,
  questions: (TheoryQuestion | CodingQuestion)[],
  isFlagged: boolean
): Promise<void> => {
  const status = isFlagged ? 'flagged_suspicious' : 'completed_pending_review';
  await setDoc(doc(db, 'mockInterviews', sessionId), {
    status,
    questions,
    completedAt: serverTimestamp()
  }, { merge: true });

  // Simulate kicking off async LLM scoring via an API route
  fetch('/api/mock-interview/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, isFlagged })
  }).catch(console.error);
};

export const getFlaggedSessions = async (): Promise<MockInterviewSession[]> => {
  const snap1 = await getDocs(query(collection(db, 'mockInterviews'), where('status', '==', 'flagged_suspicious')));
  const snap2 = await getDocs(query(collection(db, 'mockInterviews'), where('status', '==', 'under_review')));
  
  const results = [
    ...snap1.docs.map(d => ({ id: d.id, ...d.data() } as MockInterviewSession)),
    ...snap2.docs.map(d => ({ id: d.id, ...d.data() } as MockInterviewSession))
  ];
  return results.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
};

export const resolveSessionFlag = async (sessionId: string, action: 'approve' | 'reject', notes?: string): Promise<void> => {
  const snap = await getDoc(doc(db, 'mockInterviews', sessionId));
  if (!snap.exists()) return;
  const session = snap.data() as MockInterviewSession;
  
  const newStatus = action === 'approve' ? 'completed' : 'cancelled';
  
  await setDoc(doc(db, 'mockInterviews', sessionId), {
    status: newStatus,
    adminNotes: notes || null
  }, { merge: true });

  if (session.reportId && action === 'approve') {
    await setDoc(doc(db, 'performanceReports', session.reportId as string), {
      status: 'ready'
    }, { merge: true });
  }
};
