/**
 * SmartHire Career-Prep Platform — Wallet & Credits Ledger
 * Handles earning (competitions, streaks) and spending (mock interviews).
 * Uses Firestore transactions for safe, atomic balance updates.
 */

import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, query, where,
  orderBy, runTransaction, serverTimestamp, setDoc
} from 'firebase/firestore';

export interface UserWallet {
  userId: string;
  balance: number;
  updatedAt: any;
}

export type TransactionType = 'earn' | 'spend';

export interface CreditTransaction {
  id?: string;
  userId: string;
  amount: number;
  type: TransactionType;
  source: string; // e.g., 'competition_win', 'mock_interview'
  referenceId?: string; // ID of the competition or mock interview
  description: string;
  createdAt: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// WALLET FETCHING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gets a user's current wallet balance. Creates an empty wallet if it doesn't exist.
 */
export const getUserWallet = async (userId: string): Promise<UserWallet> => {
  const ref = doc(db, 'userWallets', userId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) {
    const initialWallet: UserWallet = {
      userId,
      balance: 0,
      updatedAt: serverTimestamp()
    };
    await setDoc(ref, initialWallet);
    return initialWallet;
  }
  
  return snap.data() as UserWallet;
};

/**
 * Gets the transaction history for a user.
 */
export const getTransactionHistory = async (userId: string): Promise<CreditTransaction[]> => {
  const snap = await getDocs(query(
    collection(db, 'creditTransactions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  ));
  
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CreditTransaction));
};

// ─────────────────────────────────────────────────────────────────────────────
// ATOMIC TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Processes a credit transaction safely using a Firestore transaction.
 * Ensures balance never goes below zero.
 * 
 * @throws Error if insufficient funds or invalid transaction type.
 */
export const processCreditTransaction = async (
  userId: string,
  amount: number,
  type: TransactionType,
  source: string,
  description: string,
  referenceId?: string
): Promise<string> => {
  if (amount <= 0) {
    throw new Error('Transaction amount must be strictly positive.');
  }

  const walletRef = doc(db, 'userWallets', userId);
  const txRef = doc(collection(db, 'creditTransactions'));

  await runTransaction(db, async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    let currentBalance = 0;

    if (walletSnap.exists()) {
      currentBalance = walletSnap.data().balance || 0;
    } else {
      // Create wallet if it doesn't exist
      transaction.set(walletRef, { userId, balance: 0, updatedAt: serverTimestamp() });
    }

    const newBalance = type === 'earn' 
      ? currentBalance + amount 
      : currentBalance - amount;

    if (newBalance < 0) {
      throw new Error(`Insufficient credits. Balance: ${currentBalance}, Required: ${amount}`);
    }

    // Update wallet balance
    transaction.update(walletRef, { 
      balance: newBalance,
      updatedAt: serverTimestamp()
    });

    // Write transaction ledger entry
    const txData: CreditTransaction = {
      userId,
      amount,
      type,
      source,
      description,
      createdAt: serverTimestamp(),
    };
    if (referenceId) txData.referenceId = referenceId;

    transaction.set(txRef, txData);
  });

  return txRef.id;
};
