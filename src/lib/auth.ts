'use client';

import { createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
  token: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
