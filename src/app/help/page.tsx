'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react';

const faqs = [
  { q: 'How does the AI Interview work?', a: 'The AI interviewer uses Text-to-Speech to ask questions out loud. You respond verbally, and Speech Recognition captures your answer. The AI then asks follow-up questions based on your response. The entire session is analyzed for technical knowledge, communication, confidence, and more.' },
  { q: 'Why is my camera not working?', a: 'Your browser may be blocking camera access. Click the camera/lock icon in your browser\'s address bar, select "Allow", and reload the page. Make sure no other app is using your camera. Chrome or Edge browsers work best.' },
  { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send a reset link. If you signed up with Google, use the "Continue with Google" button instead.' },
  { q: 'Can I download my interview report?', a: 'Yes! After completing any AI interview, navigate to the Performance Report screen. You\'ll find "Download PDF Report" and "Download Session Log" buttons that save your results as text files.' },
  { q: 'How are interview scores calculated?', a: 'Scores are calculated based on 14 metrics: Technical Knowledge, Communication, Confidence, Fluency, Voice Clarity, Grammar, Eye Contact, Facial Expression, Emotion, Speaking Speed, Filler Words, and more. Each metric contributes to your overall score.' },
  { q: 'What is the Interview Library?', a: 'The Interview Library contains company-specific interview rounds for Google, Meta, and Amazon. Each round includes AI voice questions, a timer, follow-up questions, and a performance report. Choose difficulty levels (Easy/Medium/Hard) to match your preparation level.' },
  { q: 'Is my data private?', a: 'Your interview sessions and personal data are stored locally in your browser session. Profile data is synced with our backend. We never share your interview content with third parties.' },
  { q: 'How do I earn certificates?', a: 'Complete any AI interview round with a score of 70% or higher to earn a certificate. Certificates are available for download from the Certificates page in your dashboard.' },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100">
      <div className="fixed top-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/6 rounded-full blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-30 bg-[#0B1220]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-16 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-xl font-extrabold text-white">Help & Support</h1>
          <p className="text-xs text-slate-400">Frequently asked questions and contact</p>
        </div>
      </header>

      <div className="w-full px-6 lg:px-16 py-8 max-w-3xl mx-auto space-y-8">
        {/* FAQ */}
        <div>
          <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
            <HelpCircle size={20} className="text-cyan-400" /> Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
                <button onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-800/40 transition-colors">
                  <span className="text-sm font-bold text-white">{faq.q}</span>
                  {open === i ? <ChevronUp size={18} className="text-cyan-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-500 flex-shrink-0" />}
                </button>
                {open === i && (
                  <div className="px-6 pb-5 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Mail size={22} className="text-cyan-400" />
              <h3 className="text-base font-extrabold text-white">Email Support</h3>
            </div>
            <p className="text-sm text-slate-400">Reach our support team for technical issues or account-related queries.</p>
            <a href="mailto:support@smarthire.ai" className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-all">
              support@smarthire.ai
            </a>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <MessageCircle size={22} className="text-purple-400" />
              <h3 className="text-base font-extrabold text-white">Send Feedback</h3>
            </div>
            {sent ? (
              <p className="text-emerald-400 text-sm font-semibold">✓ Thank you for your feedback!</p>
            ) : (
              <>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or bug reports..."
                  className="w-full h-24 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none" />
                <button onClick={() => { if (feedback.trim()) setSent(true); }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all">
                  Send Feedback
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
