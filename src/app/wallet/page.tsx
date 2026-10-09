'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Wallet, Coins, ArrowUpRight, ArrowDownRight,
  Clock, History, Target, Zap, Shield, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { getUserWallet, getTransactionHistory, UserWallet, CreditTransaction } from '../../lib/walletDb';

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all');

  useEffect(() => {
    if (user?.id) loadWalletData();
    else if (user === null) router.push('/login');
  }, [user]);

  const loadWalletData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [walletData, historyData] = await Promise.all([
        getUserWallet(user.id),
        getTransactionHistory(user.id)
      ]);
      setWallet(walletData);
      setTransactions(historyData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTx = transactions.filter(t => filter === 'all' || t.type === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet size={20} className="text-amber-400" />
              Credits Wallet
            </h1>
            <p className="text-xs text-slate-400">Manage your SmartHire credits</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/30 rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 text-amber-500/10 rotate-12 pointer-events-none">
            <Coins size={200} />
          </div>
          
          <div className="relative z-10">
            <p className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
              <Shield size={16} /> Total Available Balance
            </p>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-5xl font-extrabold text-white">
                {wallet?.balance?.toLocaleString() || 0}
              </span>
              <span className="text-xl font-medium text-amber-500/80 pb-1">credits</span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/competitions" className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl text-sm transition-all flex items-center gap-2">
                <Target size={16} /> Earn More Credits
              </Link>
              <button className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2">
                <Zap size={16} className="text-cyan-400" /> Book Mock Interview
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History size={18} className="text-slate-400" /> Transaction History
            </h2>
            
            {/* Filters */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-white/10">
              {(['all', 'earn', 'spend'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filter === f ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredTx.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Clock size={24} className="text-slate-500" />
                </div>
                <h3 className="text-white font-medium mb-1">No transactions found</h3>
                <p className="text-slate-400 text-sm">Your wallet activity will appear here.</p>
              </div>
            ) : (
              filteredTx.map(tx => {
                const isEarn = tx.type === 'earn';
                const date = new Date(tx.createdAt?.seconds ? tx.createdAt.seconds * 1000 : tx.createdAt).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                return (
                  <div key={tx.id} className="p-4 hover:bg-white/2 transition-colors flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isEarn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {isEarn ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{tx.description}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="capitalize">{tx.source.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{date}</span>
                      </div>
                    </div>
                    
                    <div className={`text-right font-bold ${isEarn ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isEarn ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
