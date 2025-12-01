import { Injectable } from '@nestjs/common';
import { LiveStateService } from '../live-state/live-state.service';
import { EventGateway } from '../websocket/event.gateway';
import { TeamsService } from '../teams/teams.service';
import { ScoringService } from '../scoring/scoring.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperatorService {
  constructor(
    private liveStateService: LiveStateService,
    private eventGateway: EventGateway,
    private teamsService: TeamsService,
    private scoringService: ScoringService,
    private prisma: PrismaService,
  ) {}

  async getState(eventId: string) {
    return this.liveStateService.getState(eventId);
  }

  async setStage(eventId: string, stageId: string) {
    const state = await this.liveStateService.setCurrentStage(eventId, stageId);
    
    // Initialize animation state based on stage type
    if (state.currentStage?.stageType === 'JURY_REVEAL') {
      // Get jury count
      const juryCount = await this.prisma.personProfile.count({
        where: { eventId, profileType: 'JURY' },
      });
      await this.liveStateService.updateAnimationState(eventId, {
        currentAnimation: 'jury_reveal',
        step: 0,
        totalSteps: juryCount,
        params: {},
      });
    } else if (state.currentStage?.stageType === 'AWARDS') {
      await this.liveStateService.updateAnimationState(eventId, {
        currentAnimation: 'awards',
        step: 0,
        totalSteps: 3, // 3rd, 2nd, 1st
        params: {},
      });
    } else {
      // Reset animation state for other stages
      await this.liveStateService.updateAnimationState(eventId, {
        currentAnimation: null,
        step: 0,
        totalSteps: 0,
        params: {},
      });
    }

    // Re-fetch state with updated animation
    const updatedState = await this.liveStateService.getState(eventId);
    
    // Broadcast to all clients
    this.eventGateway.broadcastStageChange(eventId, updatedState.currentStage);
    this.eventGateway.broadcastStateChange(eventId, 'state:update', updatedState);

    return {
      success: true,
      liveState: updatedState,
    };
  }

  async setTeam(eventId: string, teamId: string) {
    const state = await this.liveStateService.setCurrentTeam(eventId, teamId);
    
    // Broadcast to all clients
    this.eventGateway.broadcastTeamSelected(eventId, state.currentTeam);
    this.eventGateway.broadcastStateChange(eventId, 'state:update', state);

    return {
      success: true,
      liveState: state,
    };
  }

  async startTimer(eventId: string, type: 'presentation' | 'qa' | 'break' | 'custom', durationSeconds: number, label?: string) {
    const timerState = await this.liveStateService.startTimer(eventId, type, durationSeconds, label);
    
    // Broadcast timer sync
    this.eventGateway.broadcastTimerSync(eventId, timerState);

    // Start interval for timer sync (every second)
    this.startTimerSyncInterval(eventId);

    return {
      success: true,
      timer: timerState,
    };
  }

  async pauseTimer(eventId: string) {
    const timerState = await this.liveStateService.pauseTimer(eventId);
    
    this.eventGateway.broadcastTimerSync(eventId, timerState);

    return {
      success: true,
      timer: timerState,
    };
  }

  async resumeTimer(eventId: string) {
    const timerState = await this.liveStateService.resumeTimer(eventId);
    
    this.eventGateway.broadcastTimerSync(eventId, timerState);
    this.startTimerSyncInterval(eventId);

    return {
      success: true,
      timer: timerState,
    };
  }

  async resetTimer(eventId: string) {
    const timerState = await this.liveStateService.resetTimer(eventId);
    
    this.eventGateway.broadcastTimerSync(eventId, timerState);

    return {
      success: true,
      timer: timerState,
    };
  }

  async randomizeRound(eventId: string, roundNumber: number) {
    const teamOrder = await this.teamsService.randomizeOrder(eventId, roundNumber);

    // Update round state
    await this.liveStateService.updateRoundState(eventId, {
      currentRound: roundNumber,
      teamOrder: teamOrder.map(t => t.teamId),
      currentTeamIndex: 0,
      teamsCompleted: [],
    });

    // Broadcast animation trigger for shuffle
    this.eventGateway.broadcastAnimationTrigger(eventId, 'shuffle', { roundNumber });

    // After animation delay, broadcast final order
    setTimeout(() => {
      this.eventGateway.broadcastRoundRandomized(eventId, teamOrder);
    }, 2000);

    return {
      success: true,
      teamOrder,
    };
  }

  async triggerAnimation(eventId: string, animation: string, params?: any) {
    const animationState = {
      currentAnimation: animation,
      step: 0,
      totalSteps: params?.totalSteps || 1,
      params,
    };

    await this.liveStateService.updateAnimationState(eventId, animationState);
    this.eventGateway.broadcastAnimationTrigger(eventId, animation, params);

    return {
      success: true,
      animationState,
    };
  }

  async nextAnimationStep(eventId: string) {
    const state = await this.liveStateService.getState(eventId);
    const { animationState } = state;

    // Allow step to go from 0 to totalSteps (inclusive for "revealed" count)
    if (animationState.step < animationState.totalSteps) {
      const newState = {
        ...animationState,
        step: animationState.step + 1,
      };

      await this.liveStateService.updateAnimationState(eventId, newState);
      
      // Broadcast animation step to all clients
      this.eventGateway.broadcastStateChange(eventId, 'animation:step', newState);
      this.eventGateway.broadcastStateChange(eventId, 'state:update', await this.liveStateService.getState(eventId));

      return { success: true, animationState: newState };
    }

    return { success: false, message: 'Animation completed' };
  }

  async getScoringStatus(eventId: string) {
    const state = await this.liveStateService.getState(eventId);
    
    if (!state.currentTeamId) {
      return { teamId: null, status: null };
    }

    const status = await this.scoringService.getScoringStatus(eventId, state.currentTeamId);
    
    return {
      teamId: state.currentTeamId,
      status,
    };
  }

  async lockAwards(eventId: string) {
    return this.scoringService.lockResults(eventId);
  }

  async getAwardsResults(eventId: string) {
    return this.scoringService.calculateRankings(eventId);
  }

  async nextTeam(eventId: string) {
    // Complete current team
    await this.liveStateService.completeCurrentTeam(eventId);
    
    const state = await this.liveStateService.getState(eventId);
    const { roundState } = state;

    // Check if there are more teams
    if (roundState.currentTeamIndex < roundState.teamOrder.length) {
      const nextTeamId = roundState.teamOrder[roundState.currentTeamIndex];
      return this.setTeam(eventId, nextTeamId);
    }

    return {
      success: false,
      message: 'No more teams in this round',
      liveState: state,
    };
  }

  // Timer sync interval management
  private timerIntervals: Map<string, NodeJS.Timeout> = new Map();

  private startTimerSyncInterval(eventId: string) {
    // Clear existing interval
    this.stopTimerSyncInterval(eventId);

    const interval = setInterval(async () => {
      try {
        const state = await this.liveStateService.getState(eventId);
        const { timerState } = state;

        if (timerState.status === 'running') {
          // Calculate remaining time
          const elapsed = Date.now() - timerState.serverStartTime;
          const remaining = Math.max(0, timerState.durationMs - elapsed);

          // Check for timer warnings
          if (remaining <= 60000 && remaining > 59000) {
            this.eventGateway.broadcastStateChange(eventId, 'timer:warning', { remaining, warning: '1_minute' });
          } else if (remaining <= 30000 && remaining > 29000) {
            this.eventGateway.broadcastStateChange(eventId, 'timer:warning', { remaining, warning: '30_seconds' });
          } else if (remaining <= 10000 && remaining > 9000) {
            this.eventGateway.broadcastStateChange(eventId, 'timer:warning', { remaining, warning: '10_seconds' });
          }

          // Check if timer completed
          if (remaining === 0) {
            const completedState = { ...timerState, status: 'completed' as const };
            await this.liveStateService.updateTimerState(eventId, completedState);
            this.eventGateway.broadcastTimerSync(eventId, completedState);
            this.eventGateway.broadcastStateChange(eventId, 'timer:completed', { type: timerState.type });
            this.stopTimerSyncInterval(eventId);
          }
        } else {
          this.stopTimerSyncInterval(eventId);
        }
      } catch (error) {
        console.error('Timer sync error:', error);
        this.stopTimerSyncInterval(eventId);
      }
    }, 1000);

    this.timerIntervals.set(eventId, interval);
  }

  private stopTimerSyncInterval(eventId: string) {
    const interval = this.timerIntervals.get(eventId);
    if (interval) {
      clearInterval(interval);
      this.timerIntervals.delete(eventId);
    }
  }
}

