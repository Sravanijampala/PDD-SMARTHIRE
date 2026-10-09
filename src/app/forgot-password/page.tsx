'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { SmartHireLogo } from '../../components/SmartHireLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { auth } = await import('../../lib/firebase');
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email.';
      setError(msg.includes('user-not-found') ? 'No account found with this email.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090F1E] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed top-0 left-1/3 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/"><SmartHireLogo size="md" showText={true} /></Link>
          <p className="text-slate-400 text-sm mt-3">Reset your password</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Check your inbox!</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                We sent a password reset link to <strong className="text-cyan-400">{email}</strong>. Check your email and follow the link to reset your password.
              </p>
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 text-sm font-bold transition-colors">
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-5">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Mail size={18} />}
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <Link href="/login" className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 mt-6 transition-colors">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
