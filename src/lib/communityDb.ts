/**
 * SmartHire Career-Prep Platform — Community Content Data Layer
 * Handles Articles, Job Postings, and the universal Moderation Queue.
 */

import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, query, where,
  orderBy, serverTimestamp, setDoc, addDoc, updateDoc,
  limit, increment, writeBatch
} from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES
// ─────────────────────────────────────────────────────────────────────────────

export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export interface Article {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  coverUrl?: string;
  bodyRichText: string;
  tags: string[];
  category: string;
  readTimeMinutes: number;
  status: ContentStatus;
  views: number;
  likesCount: number;
  createdAt: any;
  publishedAt?: any;
}

export const publishArticle = async (article: Omit<Article, 'id' | 'views' | 'likesCount' | 'createdAt' | 'publishedAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'articles'), {
    ...article,
    views: 0,
    likesCount: 0,
    createdAt: serverTimestamp(),
    // Auto-approve for demo purposes (usually goes to pending_review)
    status: 'published',
    publishedAt: serverTimestamp()
  });
  return ref.id;
};

export const getPublishedArticles = async (): Promise<Article[]> => {
  const snap = await getDocs(query(
    collection(db, 'articles'),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc')
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Article));
};

export const getArticle = async (id: string): Promise<Article | null> => {
  const snap = await getDoc(doc(db, 'articles', id));
  if (!snap.exists()) return null;
  
  // Increment view count in background
  updateDoc(snap.ref, { views: increment(1) }).catch(console.error);
  
  return { id: snap.id, ...snap.data() } as Article;
};

// ─────────────────────────────────────────────────────────────────────────────
// JOB POSTINGS
// ─────────────────────────────────────────────────────────────────────────────

export interface JobPosting {
  id: string;
  postedByUserId: string;
  title: string;
  company: string;
  location: string;
  locationType: 'onsite' | 'remote' | 'hybrid';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  description: string;
  applyMethod: 'in_app' | 'external_url';
  applyUrl?: string; // if external
  status: ContentStatus;
  createdAt: any;
  expiresAt: any;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  resumeUrl: string;
  status: 'applied' | 'viewed' | 'shortlisted' | 'rejected';
  appliedAt: any;
}

export const postJob = async (job: Omit<JobPosting, 'id' | 'createdAt' | 'status'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'jobs'), {
    ...job,
    createdAt: serverTimestamp(),
    status: 'published' // Auto-approve for demo
  });
  return ref.id;
};

export const getPublishedJobs = async (): Promise<JobPosting[]> => {
  const snap = await getDocs(query(
    collection(db, 'jobs'),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc')
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as JobPosting));
};

// ─────────────────────────────────────────────────────────────────────────────
// MODERATION QUEUE (Admin usage)
// ─────────────────────────────────────────────────────────────────────────────

export interface ModerationQueueItem {
  id: string;
  contentType: 'article' | 'job';
  contentId: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  reviewerId?: string;
  createdAt: any;
}
