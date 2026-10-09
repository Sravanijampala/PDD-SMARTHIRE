'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Check, X, Clock, FileText, Briefcase, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../../../lib/authContext';
import { db } from '../../../lib/firebase';
import { collection, getDocs, query, where, updateDoc, doc, orderBy } from 'firebase/firestore';

interface QueueItem {
  id: string;
  contentType: 'article' | 'job';
  contentId: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: any;
  contentData?: any; // the actual article or job data for review
}

export default function ModerationQueuePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Basic admin check - in production use custom claims
    if (user === null) {
      router.push('/login');
    } else if (user) {
      loadQueue();
    }
  }, [user]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      // In a real app we query the ModerationQueue table. 
      // For demo, we just fetch all jobs/articles with status pending_review.
      
      const articlesSnap = await getDocs(query(collection(db, 'articles'), where('status', '==', 'pending_review')));
      const jobsSnap = await getDocs(query(collection(db, 'jobs'), where('status', '==', 'pending_review')));
      
      const items: QueueItem[] = [];
      
      articlesSnap.forEach(d => items.push({
        id: `mod_${d.id}`,
        contentType: 'article',
        contentId: d.id,
        status: 'pending',
        createdAt: d.data().createdAt,
        contentData: d.data()
      }));
      
      jobsSnap.forEach(d => items.push({
        id: `mod_${d.id}`,
        contentType: 'job',
        contentId: d.id,
        status: 'pending',
        createdAt: d.data().createdAt,
        contentData: d.data()
      }));
      
      // Sort newest first
      items.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      
      setQueue(items);
    } catch (e) {
      console.error("Failed to load moderation queue", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (item: QueueItem, decision: 'published' | 'rejected') => {
    setProcessingId(item.id);
    try {
      const collectionName = item.contentType === 'article' ? 'articles' : 'jobs';
      await updateDoc(doc(db, collectionName, item.contentId), {
        status: decision
      });
      
      // Remove from UI
      setQueue(q => q.filter(x => x.id !== item.id));
    } catch (e) {
      alert("Failed to update status");
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Top Nav */}
      <div className="bg-slate-900 border-b border-white/5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-rose-500" />
            <h1 className="font-bold text-lg">Moderation Queue</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <span>{queue.length} Pending Items</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="text-slate-500 animate-spin" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-white/5 rounded-2xl">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Queue is Empty</h3>
            <p className="text-slate-400">All user generated content has been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => (
              <div key={item.id} className="bg-slate-900 border border-white/5 rounded-xl p-6 flex flex-col md:flex-row gap-6">
                
                {/* Icon & Type */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    item.contentType === 'article' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}>
                    {item.contentType === 'article' ? <FileText size={24} /> : <Briefcase size={24} />}
                  </div>
                </div>

                {/* Content Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {item.contentType} Submission
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/> Pending Review</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">
                    {item.contentData?.title || 'Untitled'}
                  </h3>
                  
                  {item.contentType === 'article' && (
                    <div className="text-sm text-slate-400 line-clamp-2 bg-slate-950 p-3 rounded-lg border border-white/5" dangerouslySetInnerHTML={{ __html: item.contentData?.bodyRichText?.substring(0, 200) || '' }} />
                  )}

                  {item.contentType === 'job' && (
                    <div className="text-sm text-slate-400">
                      <strong>Company:</strong> {item.contentData?.company} <br/>
                      <strong>Location:</strong> {item.contentData?.location} ({item.contentData?.locationType})
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col justify-end gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleDecision(item, 'published')}
                    disabled={processingId === item.id}
                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {processingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Approve
                  </button>
                  <button 
                    onClick={() => handleDecision(item, 'rejected')}
                    disabled={processingId === item.id}
                    className="flex-1 md:flex-none px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-sm font-bold rounded-lg transition-colors border border-rose-500/20 flex items-center justify-center gap-2"
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
