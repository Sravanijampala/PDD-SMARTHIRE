'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle2, XCircle, Search, Clock, ShieldAlert, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import {
  getFlaggedSessions, resolveSessionFlag, getProctoringEvents,
  MockInterviewSession, ProctoringEvent
} from '../../../lib/mockInterviewDb';

export default function AdminFlaggedSessionsPage() {
  const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [events, setEvents] = useState<Record<string, ProctoringEvent[]>>({});
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getFlaggedSessions();
      setSessions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    if (!events[sessionId]) {
      const evts = await getProctoringEvents(sessionId);
      setEvents(prev => ({ ...prev, [sessionId]: evts }));
    }
  };

  const handleResolve = async (sessionId: string, action: 'approve' | 'reject') => {
    const notes = prompt(`Enter notes for ${action === 'approve' ? 'approving' : 'rejecting'} this session:`);
    if (notes === null) return;
    
    setActioning(sessionId);
    try {
      await resolveSessionFlag(sessionId, action, notes);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (e) {
      console.error(e);
      alert('Failed to resolve');
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <Loader2 size={32} className="text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060E1E] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="text-amber-500" />
              Proctoring Review Queue
            </h1>
            <p className="text-slate-400 mt-2">Review sessions flagged for suspicious activity during mock interviews.</p>
          </div>
          <div className="px-4 py-2 bg-slate-900 border border-white/10 rounded-lg flex items-center gap-2">
            <span className="font-bold text-amber-500">{sessions.length}</span>
            <span className="text-slate-400">Pending Reviews</span>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">All Caught Up!</h2>
            <p className="text-slate-400">There are no flagged sessions waiting for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div key={session.id} className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => handleExpand(session.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Interview ID: {session.id.substring(0, 8)}...</h3>
                      <p className="text-sm text-slate-400">User: {session.userId} · Status: {session.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-slate-500">
                      Completed: {session.completedAt ? new Date(session.completedAt.seconds * 1000).toLocaleString() : 'N/A'}
                    </span>
                    {expandedId === session.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </div>
                </div>

                {expandedId === session.id && (
                  <div className="p-6 border-t border-white/10 bg-slate-950">
                    <h4 className="font-semibold text-white mb-4">Proctoring Events Log</h4>
                    <div className="space-y-3 mb-6">
                      {!events[session.id] ? (
                        <Loader2 size={16} className="text-cyan-500 animate-spin" />
                      ) : events[session.id].length === 0 ? (
                        <p className="text-slate-400 text-sm">No events found.</p>
                      ) : (
                        events[session.id].map(evt => (
                          <div key={evt.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3">
                              {evt.severity === 'high' ? (
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                              )}
                              <span className="text-sm font-medium capitalize">{evt.type.replace('_', ' ')}</span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {evt.timestamp ? new Date(evt.timestamp.seconds * 1000).toLocaleTimeString() : 'N/A'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResolve(session.id, 'approve'); }}
                        disabled={actioning === session.id}
                        className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 border border-emerald-500/30 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} /> Approve & Release Report
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResolve(session.id, 'reject'); }}
                        disabled={actioning === session.id}
                        className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 border border-rose-500/30 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={16} /> Reject (Cancel Interview)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
