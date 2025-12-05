import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { LiveStateService } from '../live-state/live-state.service';
import { EventGateway } from '../websocket/event.gateway';
import { SubmitScoreDto } from '../scoring/dto/scoring.dto';

@Injectable()
export class JuryService {
  constructor(
    private prisma: PrismaService,
    private scoringService: ScoringService,
    private liveStateService: LiveStateService,
    private eventGateway: EventGateway,
  ) {}

  async getEventInfo(juryId: string) {
    const profile = await this.prisma.personProfile.findUnique({
      where: { id: juryId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            venue: true,
            status: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Jury profile not found');
    }

    return profile.event;
  }

  async getTeams(juryId: string) {
    const profile = await this.prisma.personProfile.findUnique({
      where: { id: juryId },
      select: { eventId: true },
    });

    if (!profile) {
      throw new NotFoundException('Jury profile not found');
    }

    const teams = await this.prisma.team.findMany({
      where: { eventId: profile.eventId },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [
        { roundAssignment: 'asc' },
        { presentationOrder: 'asc' },
      ],
    });

    // Get jury's scores
    const scores = await this.prisma.teamScore.findMany({
      where: { juryId },
      select: { teamId: true },
    });
    const scoredTeamIds = scores.map((s) => s.teamId);

    return teams.map((team) => ({
      ...team,
      hasScored: scoredTeamIds.includes(team.id),
    }));
  }

  async getTeamDetails(juryId: string, teamId: string) {
    const profile = await this.prisma.personProfile.findUnique({
      where: { id: juryId },
      select: { eventId: true },
    });

    if (!profile) {
      throw new NotFoundException('Jury profile not found');
    }

    const team = await this.prisma.team.findFirst({
      where: { id: teamId, eventId: profile.eventId },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Get existing score if any
    const score = await this.prisma.teamScore.findUnique({
      where: { teamId_juryId: { teamId, juryId } },
    });

    // Get criteria
    const criteria = await this.scoringService.getCriteria(profile.eventId);

    return {
      team,
      existingScore: score,
      criteria,
    };
  }

  async getScores(juryId: string) {
    const profile = await this.prisma.personProfile.findUnique({
      where: { id: juryId },
      select: { eventId: true },
    });

    if (!profile) {
      throw new NotFoundException('Jury profile not found');
    }

    return this.scoringService.getJuryScores(profile.eventId, juryId);
  }

  async submitScore(juryId: string, teamId: string, dto: SubmitScoreDto) {
    const profile = await this.prisma.personProfile.findUnique({
      where: { id: juryId },
      select: { eventId: true, name: true },
    });

    if (!profile) {
      throw new NotFoundException('Jury profile not found');
    }

    const result = await this.scoringService.submitScore(profile.eventId, juryId, teamId, dto);

    // Notify operator of score submission
    this.eventGateway.broadcastScoreSubmitted(profile.eventId, {
      teamId,
      juryId,
      juryName: profile.name,
    });

    return result;
  }

  // Simplified scoring: single 0-100 score
  async submitSimpleScore(juryId: string, teamId: string, score: number) {
    const profile = await this.prisma.personProfile.findUnique({
      where: { id: juryId },
      select: { eventId: true, name: true },
    });

    if (!profile) {
      throw new NotFoundException('Jury profile not found');
    }

    // Validate score range
    if (score < 0 || score > 100) {
      throw new Error('Score must be between 0 and 100');
    }

    // Check if awards are locked
    const liveState = await this.prisma.liveState.findUnique({
      where: { eventId: profile.eventId },
    });

    if (liveState?.awardsLocked) {
      throw new Error('Results have been locked. Scoring is no longer allowed.');
    }

    // Upsert the simple score directly
    const teamScore = await this.prisma.teamScore.upsert({
      where: {
        teamId_juryId: { teamId, juryId },
      },
      create: {
        teamId,
        juryId,
        criteriaScores: { simple: score },
        totalScore: score,
      },
      update: {
        criteriaScores: { simple: score },
        totalScore: score,
        submittedAt: new Date(),
      },
    });

    // Notify operator of score submission
    this.eventGateway.broadcastScoreSubmitted(profile.eventId, {
      teamId,
      juryId,
      juryName: profile.name,
      score,
    });

    return {
      success: true,
      score: {
        teamId,
        score,
        submittedAt: teamScore.submittedAt,
      },
    };
  }

  async getCurrentTeam(juryId: string) {
    const profile = await this.prisma.personProfile.findUnique({
      where: { id: juryId },
      select: { eventId: true },
    });

    if (!profile) {
      throw new NotFoundException('Jury profile not found');
    }

    const state = await this.liveStateService.getState(profile.eventId);

    if (!state.currentTeamId) {
      return { currentTeam: null };
    }

    const team = await this.prisma.team.findUnique({
      where: { id: state.currentTeamId },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    // Get existing score if any
    const score = await this.prisma.teamScore.findUnique({
      where: { teamId_juryId: { teamId: state.currentTeamId, juryId } },
    });

    // Get criteria
    const criteria = await this.scoringService.getCriteria(profile.eventId);

    return {
      currentTeam: team,
      existingScore: score,
      criteria,
      timerState: state.timerState,
    };
  }

  async getCriteria(juryId: string) {
    const profile = await this.prisma.personProfile.findUnique({
      where: { id: juryId },
      select: { eventId: true },
    });

    if (!profile) {
      throw new NotFoundException('Jury profile not found');
    }

    return this.scoringService.getCriteria(profile.eventId);
  }
}

