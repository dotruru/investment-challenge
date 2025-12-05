import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto, CreateStageDto, UpdateStageDto, ReorderStagesDto } from './dto/events.dto';
import { EventStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  // Event CRUD
  async create(dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        name: dto.name,
        date: new Date(dto.date),
        venue: dto.venue,
        status: EventStatus.DRAFT,
      },
      include: {
        stages: true,
        teams: true,
        profiles: true,
        scoringCriteria: true,
      },
    });

    // Create default stages
    await this.createDefaultStages(event.id);

    // Create live state
    await this.prisma.liveState.create({
      data: {
        eventId: event.id,
      },
    });

    return this.findOne(event.id);
  }

  async findAll() {
    return this.prisma.event.findMany({
      include: {
        _count: {
          select: {
            teams: true,
            profiles: true,
            stages: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { orderIndex: 'asc' },
          include: {
            assets: true,
          },
        },
        teams: {
          orderBy: { presentationOrder: 'asc' },
          include: {
            members: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        profiles: {
          orderBy: { displayOrder: 'asc' },
        },
        scoringCriteria: {
          orderBy: { displayOrder: 'asc' },
        },
        liveState: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id); // Ensure exists

    return this.prisma.event.update({
      where: { id },
      data: {
        name: dto.name,
        date: dto.date ? new Date(dto.date) : undefined,
        venue: dto.venue,
        status: dto.status,
      },
      include: {
        stages: {
          orderBy: { orderIndex: 'asc' },
        },
        teams: true,
        profiles: true,
        scoringCriteria: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    await this.prisma.event.delete({ where: { id } });
    return { success: true };
  }

  // Stage CRUD
  async createStage(eventId: string, dto: CreateStageDto) {
    await this.findOne(eventId); // Ensure event exists

    // Get max order index
    const maxOrder = await this.prisma.eventStage.aggregate({
      where: { eventId },
      _max: { orderIndex: true },
    });

    return this.prisma.eventStage.create({
      data: {
        eventId,
        title: dto.title,
        stageType: dto.stageType,
        orderIndex: dto.orderIndex ?? (maxOrder._max.orderIndex ?? -1) + 1,
        startTimePlanned: dto.startTimePlanned ? new Date(dto.startTimePlanned) : null,
        durationMinutes: dto.durationMinutes,
        configuration: dto.configuration || {},
      },
      include: {
        assets: true,
      },
    });
  }

  async getStages(eventId: string) {
    return this.prisma.eventStage.findMany({
      where: { eventId },
      orderBy: { orderIndex: 'asc' },
      include: {
        assets: true,
      },
    });
  }

  async updateStage(eventId: string, stageId: string, dto: UpdateStageDto) {
    const stage = await this.prisma.eventStage.findFirst({
      where: { id: stageId, eventId },
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    return this.prisma.eventStage.update({
      where: { id: stageId },
      data: {
        title: dto.title,
        stageType: dto.stageType,
        startTimePlanned: dto.startTimePlanned ? new Date(dto.startTimePlanned) : undefined,
        durationMinutes: dto.durationMinutes,
        configuration: dto.configuration,
      },
      include: {
        assets: true,
      },
    });
  }

  async deleteStage(eventId: string, stageId: string) {
    const stage = await this.prisma.eventStage.findFirst({
      where: { id: stageId, eventId },
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    await this.prisma.eventStage.delete({ where: { id: stageId } });
    return { success: true };
  }

  async reorderStages(eventId: string, dto: ReorderStagesDto) {
    await this.findOne(eventId); // Ensure event exists

    // Update each stage's order index in a transaction
    await this.prisma.$transaction(
      dto.stageIds.map((stageId, index) =>
        this.prisma.eventStage.update({
          where: { id: stageId },
          data: { orderIndex: index },
        }),
      ),
    );

    return this.getStages(eventId);
  }

  // Default Stages
  private async createDefaultStages(eventId: string) {
    const defaultStages = [
      { title: 'Doors Open', stageType: 'LOBBY', orderIndex: 0 },
      { title: 'Team Card Wall', stageType: 'LOBBY_CARD_GRID', orderIndex: 1 },
      { title: 'Welcome', stageType: 'WELCOME', orderIndex: 2 },
      { title: 'Jury Reveal', stageType: 'JURY_REVEAL', orderIndex: 3 },
      { title: 'Round 1', stageType: 'ROUND', orderIndex: 4, configuration: { roundNumber: 1 } },
      { title: 'Break 1', stageType: 'BREAK', orderIndex: 5 },
      { title: 'Round 2', stageType: 'ROUND', orderIndex: 6, configuration: { roundNumber: 2 } },
      { title: 'Break 2', stageType: 'BREAK', orderIndex: 7 },
      { title: 'Keynote 1', stageType: 'KEYNOTE', orderIndex: 8, configuration: { speakerIndex: 0 } },
      { title: 'Round 3', stageType: 'ROUND', orderIndex: 9, configuration: { roundNumber: 3 } },
      { title: 'Keynote 2', stageType: 'KEYNOTE', orderIndex: 10, configuration: { speakerIndex: 1 } },
      { title: 'Scoring', stageType: 'SCORING', orderIndex: 11 },
      { title: 'Awards Ceremony', stageType: 'AWARDS', orderIndex: 12 },
      { title: 'Leaderboard', stageType: 'LEADERBOARD', orderIndex: 13 },
      { title: 'Networking', stageType: 'NETWORKING', orderIndex: 14 },
    ];

    await this.prisma.eventStage.createMany({
      data: defaultStages.map((stage) => ({
        eventId,
        title: stage.title,
        stageType: stage.stageType as any,
        orderIndex: stage.orderIndex,
        configuration: stage.configuration || {},
      })),
    });
  }

  // Display data (public)
  async getDisplayData(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        date: true,
        venue: true,
        status: true,
        stages: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            stageType: true,
            orderIndex: true,
            configuration: true,
            assets: {
              select: {
                id: true,
                assetType: true,
                url: true,
                displayOrder: true,
                metadata: true,
              },
            },
          },
        },
        teams: {
          orderBy: { presentationOrder: 'asc' },
          select: {
            id: true,
            name: true,
            university: true,
            rankBadge: true,
            strategyTagline: true,
            avatarCardImageUrl: true,
            roundAssignment: true,
            presentationOrder: true,
            status: true,
            members: {
              orderBy: { displayOrder: 'asc' },
              select: {
                id: true,
                name: true,
                photoUrl: true,
                role: true,
              },
            },
            scores: {
              select: {
                totalScore: true,
                criteriaScores: true,
              },
            },
          },
        },
        profiles: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            name: true,
            role: true,
            company: true,
            photoUrl: true,
            bioShort: true,
            profileType: true,
            displayOrder: true,
          },
        },
        scoringCriteria: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            name: true,
            maxScore: true,
            weight: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Calculate total scores for each team
    const teamsWithScores = event.teams.map((team: any) => {
      const totalScore = team.scores.reduce((sum: number, s: any) => sum + (s.totalScore || 0), 0);
      return {
        ...team,
        totalScore,
      };
    });

    return {
      ...event,
      teams: teamsWithScores,
    };
  }
}

