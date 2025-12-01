import { useState, useEffect, useMemo } from 'react';
import type { TimerState } from '../types';

export function useTimer(timerState: TimerState | null) {
  const [now, setNow] = useState(Date.now());

  // Update "now" every 100ms for smooth countdown
  useEffect(() => {
    if (!timerState || timerState.status !== 'running') {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [timerState?.status]);

  const remainingMs = useMemo(() => {
    if (!timerState) return 0;

    if (timerState.status === 'paused') {
      return timerState.pausedRemainingMs ?? 0;
    }

    if (timerState.status === 'completed' || timerState.status === 'idle') {
      return 0;
    }

    const elapsed = now - timerState.serverStartTime;
    return Math.max(0, timerState.durationMs - elapsed);
  }, [timerState, now]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  const formatted = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  const progress = useMemo(() => {
    if (!timerState || timerState.durationMs === 0) return 0;
    return ((timerState.durationMs - remainingMs) / timerState.durationMs) * 100;
  }, [timerState, remainingMs]);

  const isWarning = remainingSeconds <= 60 && remainingSeconds > 0;
  const isCritical = remainingSeconds <= 10 && remainingSeconds > 0;
  const isComplete = remainingMs === 0 && timerState?.status === 'running';

  return {
    remainingMs,
    remainingSeconds,
    formatted,
    progress,
    isWarning,
    isCritical,
    isComplete,
    status: timerState?.status ?? 'idle',
    type: timerState?.type,
    label: timerState?.label,
  };
}

