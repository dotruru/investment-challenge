import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateCriteriaDto, UpdateCriteriaDto, SubmitScoreDto } from './dto/scoring.dto';

@Injectable()
export class ScoringService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // Scoring Criteria Management
  async createCriteria(eventId: string, dto: CreateCriteriaDto) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const maxOrder = await this.prisma.scoringCriteria.aggregate({
      where: { eventId },
      _max: { displayOrder: true },
    });

    return this.prisma.scoringCriteria.create({
      data: {
        eventId,
        name: dto.name,
        description: dto.description,
        maxScore: dto.maxScore ?? 10,
        weight: dto.weight ?? 1.0,
        displayOrder: dto.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });
  }

  async getCriteria(eventId: string) {
    return this.prisma.scoringCriteria.findMany({
      where: { eventId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateCriteria(eventId: string, criteriaId: string, dto: UpdateCriteriaDto) {
    const criteria = await this.prisma.scoringCriteria.findFirst({
      where: { id: criteriaId, eventId },
    });

    if (!criteria) {
      throw new NotFoundException(`Criteria with ID ${criteriaId} not found`);
    }

    return this.prisma.scoringCriteria.update({
      where: { id: criteriaId },
      data: {
        name: dto.name,
        description: dto.description,
        maxScore: dto.maxScore,
        weight: dto.weight,
        displayOrder: dto.displayOrder,
      },
    });
  }

  async deleteCriteria(eventId: string, criteriaId: string) {
    const criteria = await this.prisma.scoringCriteria.findFirst({
      where: { id: criteriaId, eventId },
    });

    if (!criteria) {
      throw new NotFoundException(`Criteria with ID ${criteriaId} not found`);
    }

    await this.prisma.scoringCriteria.delete({ where: { id: criteriaId } });
    return { success: true };
  }

  // Score Submission
  async submitScore(eventId: string, juryId: string, teamId: string, dto: SubmitScoreDto) {
    // Check if awards are locked
    const liveState = await this.prisma.liveState.findUnique({
      where: { eventId },
    });

    if (liveState?.awardsLocked) {
      throw new ForbiddenException('Results have been locked. Scoring is no longer allowed.');
    }

    // Get criteria for validation
    const criteria = await this.prisma.scoringCriteria.findMany({
      where: { eventId },
    });

    // Validate all criteria are scored
    const criteriaIds = criteria.map((c) => c.id);
    const submittedIds = dto.criteriaScores.map((s) => s.criteriaId);
    const missingCriteria = criteriaIds.filter((id) => !submittedIds.includes(id));

    if (missingCriteria.length > 0) {
      throw new ForbiddenException('All criteria must be scored');
    }

    // Validate score ranges
    for (const score of dto.criteriaScores) {
      const criterion = criteria.find((c) => c.id === score.criteriaId);
      if (!criterion) {
        throw new NotFoundException(`Criteria ${score.criteriaId} not found`);
      }
      if (score.score < 1 || score.score > criterion.maxScore) {
        throw new ForbiddenException(
          `Score for ${criterion.name} must be between 1 and ${criterion.maxScore}`,
        );
      }
    }

    // Calculate total weighted score
    const criteriaScoresMap: Record<string, number> = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const score of dto.criteriaScores) {
      const criterion = criteria.find((c) => c.id === score.criteriaId)!;
      criteriaScoresMap[score.criteriaId] = score.score;
      totalWeightedScore += score.score * criterion.weight;
      totalWeight += criterion.weight;
    }

    const averageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Upsert score
    const teamScore = await this.prisma.teamScore.upsert({
      where: {
        teamId_juryId: { teamId, juryId },
      },
      create: {
        teamId,
        juryId,
        criteriaScores: criteriaScoresMap,
        totalScore: averageScore,
      },
      update: {
        criteriaScores: criteriaScoresMap,
        totalScore: averageScore,
        submittedAt: new Date(),
      },
    });

    // Update Redis for real-time tracking
    await this.redis.addJuryScore(eventId, teamId, juryId);

    return {
      success: true,
      score: {
        teamId,
        criteriaScores: criteriaScoresMap,
        totalScore: averageScore,
        submittedAt: teamScore.submittedAt,
      },
    };
  }

  // Get jury's submitted scores
  async getJuryScores(eventId: string, juryId: string) {
    const scores = await this.prisma.teamScore.findMany({
      where: { juryId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            university: true,
            roundAssignment: true,
            status: true,
            eventId: true,
          },
        },
      },
    });

    return scores.filter((s) => s.team.eventId === eventId);
  }

  // Get scoring status for operator
  async getScoringStatus(eventId: string, teamId: string) {
    const jury = await this.prisma.personProfile.findMany({
      where: { eventId, profileType: 'JURY' },
      select: { id: true, name: true },
    });

    const scores = await this.prisma.teamScore.findMany({
      where: { teamId },
      select: { juryId: true },
    });

    const scoredJuryIds = scores.map((s) => s.juryId);

    return {
      total: jury.length,
      submitted: scoredJuryIds.length,
      jury: jury.map((j) => ({
        id: j.id,
        name: j.name,
        hasSubmitted: scoredJuryIds.includes(j.id),
      })),
    };
  }

  // Calculate final rankings
  async calculateRankings(eventId: string) {
    const teams = await this.prisma.team.findMany({
      where: { eventId },
      include: {
        scores: true,
      },
    });

    const rankings = teams.map((team) => {
      const totalScores = team.scores.reduce((sum, s) => sum + (s.totalScore || 0), 0);
      const averageScore = team.scores.length > 0 ? totalScores / team.scores.length : 0;

      return {
        teamId: team.id,
        teamName: team.name,
        university: team.university,
        roundAssignment: team.roundAssignment,
        scoresCount: team.scores.length,
        averageScore,
      };
    });

    // Sort by average score descending
    rankings.sort((a, b) => b.averageScore - a.averageScore);

    // Add ranks
    return rankings.map((r, index) => ({
      ...r,
      rank: index + 1,
    }));
  }

  // Lock results
  async lockResults(eventId: string) {
    await this.prisma.liveState.update({
      where: { eventId },
      data: { awardsLocked: true },
    });

    // Lock all scores
    await this.prisma.teamScore.updateMany({
      where: {
        team: { eventId },
      },
      data: { isLocked: true },
    });

    return { success: true, locked: true };
  }

  // Operator-submitted scores (simplified single score per team)
  async submitOperatorScore(eventId: string, teamId: string, score: number) {
    // Check if awards are locked
    const liveState = await this.prisma.liveState.findUnique({
      where: { eventId },
    });

    if (liveState?.awardsLocked) {
      throw new ForbiddenException('Results have been locked. Scoring is no longer allowed.');
    }

    // Validate score range
    if (score < 0 || score > 100) {
      throw new ForbiddenException('Score must be between 0 and 100');
    }

    // Check if operator score already exists for this team
    const existingScore = await this.prisma.teamScore.findFirst({
      where: { teamId, isOperator: true },
    });

    let teamScore;
    if (existingScore) {
      // Update existing score
      teamScore = await this.prisma.teamScore.update({
        where: { id: existingScore.id },
        data: {
          criteriaScores: { overall: score },
          totalScore: score,
          submittedAt: new Date(),
        },
      });
    } else {
      // Create new operator score
      teamScore = await this.prisma.teamScore.create({
        data: {
          teamId,
          juryId: null,
          isOperator: true,
          criteriaScores: { overall: score },
          totalScore: score,
        },
      });
    }

    return {
      success: true,
      score: {
        teamId,
        totalScore: score,
        submittedAt: teamScore.submittedAt,
      },
    };
  }

  async getOperatorScores(eventId: string) {
    const teams = await this.prisma.team.findMany({
      where: { eventId },
      include: {
        scores: {
          where: { isOperator: true },
        },
      },
    });

    return teams.map((team) => {
      const operatorScore = team.scores[0];
      return {
        teamId: team.id,
        teamName: team.name,
        university: team.university,
        roundAssignment: team.roundAssignment,
        score: operatorScore?.totalScore ?? null,
        saved: !!operatorScore,
        submittedAt: operatorScore?.submittedAt,
      };
    });
  }
}

