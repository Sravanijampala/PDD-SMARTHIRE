'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInterviewTimerOptions {
  durationSeconds: number;
  sessionKey?: string;
  onExpire?: () => void;
}

export function useInterviewTimer({ durationSeconds, sessionKey = 'smarthire_timer', onExpire }: UseInterviewTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const [isClient, setIsClient] = useState(false);

  // Read from session storage only on client-side after hydration
  useEffect(() => {
    setIsClient(true);
    const saved = sessionStorage.getItem(sessionKey);
    if (saved) {
      const { remaining, savedAt } = JSON.parse(saved);
      const elapsed = Math.floor((Date.now() - savedAt) / 1000);
      const restored = remaining - elapsed;
      if (restored > 0) {
        setTimeLeft(restored);
      } else {
        setTimeLeft(0);
      }
    }
  }, [sessionKey]);

  const [isPaused, setIsPaused] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Persist time to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isRunning) return;
    sessionStorage.setItem(sessionKey, JSON.stringify({ remaining: timeLeft, savedAt: Date.now() }));
  }, [timeLeft, sessionKey, isRunning]);

  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        sessionStorage.removeItem(sessionKey);
        onExpireRef.current?.();
        return 0;
      }
      return prev - 1;
    });
  }, [sessionKey]);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(true);
    setIsPaused(false);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPaused(true);
    // Save current time when pausing
    sessionStorage.setItem(sessionKey, JSON.stringify({ remaining: timeLeft, savedAt: Date.now() }));
  }, [sessionKey, timeLeft]);

  const resume = useCallback(() => {
    setIsPaused(false);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    sessionStorage.removeItem(sessionKey);
    setTimeLeft(durationSeconds);
    setIsRunning(false);
    setIsPaused(false);
  }, [durationSeconds, sessionKey]);

  // Auto-start on mount
  useEffect(() => {
    start();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [start]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const percentage = Math.round((timeLeft / durationSeconds) * 100);

  return { timeLeft, formatted, minutes, seconds, percentage, isPaused, isRunning, pause, resume, reset, start };
}
