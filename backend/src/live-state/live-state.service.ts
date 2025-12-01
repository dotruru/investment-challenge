import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface TimerState {
  type: 'presentation' | 'qa' | 'break' | 'custom';
  status: 'idle' | 'running' | 'paused' | 'completed';
  durationMs: number;
  serverStartTime: number;
  pausedRemainingMs?: number;
  label?: string;
}

export interface AnimationState {
  currentAnimation: string | null;
  step: number;
  totalSteps: number;
  params?: Record<string, any>;
}

export interface RoundState {
  currentRound: number;
  teamOrder: string[];
  currentTeamIndex: number;
  teamsCompleted: string[];
}

export interface FullLiveState {
  eventId: string;
  currentStageId: string | null;
  currentStage: any | null;
  currentTeamId: string | null;
  currentTeam: any | null;
  timerState: TimerState;
  animationState: AnimationState;
  roundState: RoundState;
  awardsLocked: boolean;
  updatedAt: string;
}

@Injectable()
export class LiveStateService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getState(eventId: string): Promise<FullLiveState> {
    // Get from Redis first (hot data)
    const redisState = await this.redis.getLiveState(eventId);
    
    // Get persistent state from DB
    const dbState = await this.prisma.liveState.findUnique({
      where: { eventId },
      include: {
        event: {
          include: {
            stages: {
              orderBy: { orderIndex: 'asc' },
            },
            teams: {
              include: {
                members: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!dbState) {
      throw new NotFoundException(`Live state for event ${eventId} not found`);
    }

    // Get current stage details
    let currentStage = null;
    if (dbState.currentStageId) {
      currentStage = await this.prisma.eventStage.findUnique({
        where: { id: dbState.currentStageId },
        include: { assets: true },
      });
    }

    // Get current team details
    let currentTeam = null;
    if (dbState.currentTeamId) {
      currentTeam = await this.prisma.team.findUnique({
        where: { id: dbState.currentTeamId },
        include: {
          members: { orderBy: { displayOrder: 'asc' } },
        },
      });
    }

    // Parse JSON fields from Redis or DB
    const timerState = redisState.timerState
      ? JSON.parse(redisState.timerState)
      : (dbState.timerState as any) || { type: 'presentation', status: 'idle', durationMs: 0, serverStartTime: 0 };

    const animationState = redisState.animationState
      ? JSON.parse(redisState.animationState)
      : (dbState.animationState as any) || { currentAnimation: null, step: 0, totalSteps: 0 };

    const roundState = redisState.roundState
      ? JSON.parse(redisState.roundState)
      : (dbState.roundState as any) || { currentRound: 0, teamOrder: [], currentTeamIndex: 0, teamsCompleted: [] };

    return {
      eventId,
      currentStageId: dbState.currentStageId,
      currentStage,
      currentTeamId: dbState.currentTeamId,
      currentTeam,
      timerState,
      animationState,
      roundState,
      awardsLocked: dbState.awardsLocked,
      updatedAt: new Date().toISOString(),
    };
  }

  async setCurrentStage(eventId: string, stageId: string): Promise<FullLiveState> {
    // Verify stage exists
    const stage = await this.prisma.eventStage.findFirst({
      where: { id: stageId, eventId },
    });

    if (!stage) {
      throw new NotFoundException(`Stage ${stageId} not found`);
    }

    // Update DB
    await this.prisma.liveState.update({
      where: { eventId },
      data: { currentStageId: stageId },
    });

    // Update Redis
    await this.redis.updateLiveStateField(eventId, 'currentStageId', stageId);

    return this.getState(eventId);
  }

  async setCurrentTeam(eventId: string, teamId: string): Promise<FullLiveState> {
    // Verify team exists
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, eventId },
    });

    if (!team) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }

    // Update team status to PRESENTING
    await this.prisma.team.update({
      where: { id: teamId },
      data: { status: 'PRESENTING' },
    });

    // Update DB
    await this.prisma.liveState.update({
      where: { eventId },
      data: { currentTeamId: teamId },
    });

    // Update Redis
    await this.redis.updateLiveStateField(eventId, 'currentTeamId', teamId);

    return this.getState(eventId);
  }

  async updateTimerState(eventId: string, timerState: TimerState): Promise<void> {
    // Update Redis (hot path)
    await this.redis.setTimerState(eventId, timerState);

    // Update DB (async persistence)
    await this.prisma.liveState.update({
      where: { eventId },
      data: { timerState: timerState as any },
    });
  }

  async startTimer(eventId: string, type: TimerState['type'], durationSeconds: number, label?: string): Promise<TimerState> {
    const timerState: TimerState = {
      type,
      status: 'running',
      durationMs: durationSeconds * 1000,
      serverStartTime: Date.now(),
      label,
    };

    await this.updateTimerState(eventId, timerState);
    return timerState;
  }

  async pauseTimer(eventId: string): Promise<TimerState> {
    const currentTimer = await this.redis.getTimerState(eventId);
    const timerState = currentTimer.status ? currentTimer : { status: 'idle' };

    if (timerState.status !== 'running') {
      return timerState as TimerState;
    }

    const elapsed = Date.now() - Number(timerState.serverStartTime);
    const remaining = Math.max(0, Number(timerState.durationMs) - elapsed);

    const pausedState: TimerState = {
      type: timerState.type as TimerState['type'],
      status: 'paused',
      durationMs: Number(timerState.durationMs),
      serverStartTime: Number(timerState.serverStartTime),
      pausedRemainingMs: remaining,
      label: timerState.label,
    };

    await this.updateTimerState(eventId, pausedState);
    return pausedState;
  }

  async resumeTimer(eventId: string): Promise<TimerState> {
    const currentTimer = await this.redis.getTimerState(eventId);

    if (currentTimer.status !== 'paused' || !currentTimer.pausedRemainingMs) {
      return currentTimer as TimerState;
    }

    const resumedState: TimerState = {
      type: currentTimer.type as TimerState['type'],
      status: 'running',
      durationMs: Number(currentTimer.pausedRemainingMs),
      serverStartTime: Date.now(),
      label: currentTimer.label,
    };

    await this.updateTimerState(eventId, resumedState);
    return resumedState;
  }

  async resetTimer(eventId: string): Promise<TimerState> {
    const timerState: TimerState = {
      type: 'presentation',
      status: 'idle',
      durationMs: 0,
      serverStartTime: 0,
    };

    await this.updateTimerState(eventId, timerState);
    return timerState;
  }

  async updateAnimationState(eventId: string, animationState: AnimationState): Promise<void> {
    // Update Redis
    await this.redis.updateLiveStateField(eventId, 'animationState', JSON.stringify(animationState));

    // Update DB
    await this.prisma.liveState.update({
      where: { eventId },
      data: { animationState: animationState as any },
    });
  }

  async updateRoundState(eventId: string, roundState: RoundState): Promise<void> {
    // Update Redis
    await this.redis.updateLiveStateField(eventId, 'roundState', JSON.stringify(roundState));

    // Update DB
    await this.prisma.liveState.update({
      where: { eventId },
      data: { roundState: roundState as any },
    });
  }

  async completeCurrentTeam(eventId: string): Promise<FullLiveState> {
    const state = await this.getState(eventId);

    if (state.currentTeamId) {
      // Mark team as completed
      await this.prisma.team.update({
        where: { id: state.currentTeamId },
        data: { status: 'COMPLETED' },
      });

      // Update round state
      const roundState = { ...state.roundState };
      if (!roundState.teamsCompleted.includes(state.currentTeamId)) {
        roundState.teamsCompleted.push(state.currentTeamId);
      }
      roundState.currentTeamIndex++;

      await this.updateRoundState(eventId, roundState);
    }

    return this.getState(eventId);
  }
}

