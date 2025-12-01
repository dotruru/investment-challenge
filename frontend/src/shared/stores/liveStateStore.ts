import { create } from 'zustand';
import type { LiveState, EventStage, Team, TimerState, AnimationState, RoundState } from '../types';

interface LiveStateStore {
  state: LiveState | null;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  lastError: string | null;

  // Setters
  setFullState: (state: LiveState) => void;
  setCurrentStage: (stage: EventStage) => void;
  setCurrentTeam: (team: Team | null) => void;
  setTimerState: (timer: TimerState) => void;
  setAnimationState: (animation: AnimationState) => void;
  setRoundState: (round: RoundState) => void;
  
  // Connection state
  setConnectionState: (state: {
    isConnected?: boolean;
    isReconnecting?: boolean;
    reconnectAttempt?: number;
    lastError?: string | null;
  }) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  state: null,
  isConnected: false,
  isReconnecting: false,
  reconnectAttempt: 0,
  lastError: null,
};

export const useLiveStateStore = create<LiveStateStore>((set) => ({
  ...initialState,

  setFullState: (newState) =>
    set({ state: newState }),

  setCurrentStage: (stage) =>
    set((s) => ({
      state: s.state
        ? { ...s.state, currentStageId: stage.id, currentStage: stage }
        : null,
    })),

  setCurrentTeam: (team) =>
    set((s) => ({
      state: s.state
        ? { ...s.state, currentTeamId: team?.id || null, currentTeam: team }
        : null,
    })),

  setTimerState: (timer) =>
    set((s) => ({
      state: s.state ? { ...s.state, timerState: timer } : null,
    })),

  setAnimationState: (animation) =>
    set((s) => ({
      state: s.state ? { ...s.state, animationState: animation } : null,
    })),

  setRoundState: (round) =>
    set((s) => ({
      state: s.state ? { ...s.state, roundState: round } : null,
    })),

  setConnectionState: (connectionState) =>
    set((s) => ({
      ...s,
      ...connectionState,
    })),

  reset: () => set(initialState),
}));

