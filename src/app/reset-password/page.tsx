'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { SmartHireLogo } from '../../components/SmartHireLogo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      // Get oobCode from URL (Firebase sends ?oobCode=xxx)
      const params = new URLSearchParams(window.location.search);
      const oobCode = params.get('oobCode');
      if (!oobCode) throw new Error('Invalid reset link. Please request a new one.');
      const { auth } = await import('../../lib/firebase');
      const { confirmPasswordReset } = await import('firebase/auth');
      await confirmPasswordReset(auth, oobCode, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090F1E] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed top-0 left-1/3 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <SmartHireLogo size="md" showText={true} />
          <p className="text-slate-400 text-sm mt-3">Set a new password</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          {done ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
              <p className="text-slate-400 text-sm">Redirecting to sign in...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-5">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-12 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
                    <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold text-sm rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
              <div className="text-center mt-6">
                <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Back to Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
