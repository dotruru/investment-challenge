import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto, CreateTeamMemberDto, UpdateTeamMemberDto, ImportTeamDto } from './dto/teams.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(eventId: string, dto: CreateTeamDto) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check for duplicate team name in event
    const existing = await this.prisma.team.findUnique({
      where: { eventId_name: { eventId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException(`Team "${dto.name}" already exists in this event`);
    }

    return this.prisma.team.create({
      data: {
        eventId,
        name: dto.name,
        university: dto.university,
        rankGlobal: dto.rankGlobal,
        rankBadge: dto.rankBadge,
        stats: dto.stats || {},
        strategyTagline: dto.strategyTagline,
        strategyTearsheetUrl: dto.strategyTearsheetUrl,
        avatarCardImageUrl: dto.avatarCardImageUrl,
        roundAssignment: dto.roundAssignment,
        status: 'APPROVED',
      },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async findAll(eventId: string) {
    return this.prisma.team.findMany({
      where: { eventId },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { scores: true },
        },
      },
      orderBy: [
        { roundAssignment: 'asc' },
        { presentationOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(eventId: string, teamId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, eventId },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
        scores: {
          include: {
            jury: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    return team;
  }

  async update(eventId: string, teamId: string, dto: UpdateTeamDto) {
    await this.findOne(eventId, teamId); // Ensure exists

    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        name: dto.name,
        university: dto.university,
        rankGlobal: dto.rankGlobal,
        rankBadge: dto.rankBadge,
        stats: dto.stats,
        strategyTagline: dto.strategyTagline,
        strategyTearsheetUrl: dto.strategyTearsheetUrl,
        avatarCardImageUrl: dto.avatarCardImageUrl,
        roundAssignment: dto.roundAssignment,
        presentationOrder: dto.presentationOrder,
        status: dto.status,
      },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async remove(eventId: string, teamId: string) {
    await this.findOne(eventId, teamId); // Ensure exists
    await this.prisma.team.delete({ where: { id: teamId } });
    return { success: true };
  }

  // Team Members
  async addMember(eventId: string, teamId: string, dto: CreateTeamMemberDto) {
    await this.findOne(eventId, teamId); // Ensure team exists

    // Get max display order
    const maxOrder = await this.prisma.teamMember.aggregate({
      where: { teamId },
      _max: { displayOrder: true },
    });

    return this.prisma.teamMember.create({
      data: {
        teamId,
        name: dto.name,
        photoUrl: dto.photoUrl,
        role: dto.role,
        quote: dto.quote,
        displayOrder: dto.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });
  }

  async updateMember(eventId: string, teamId: string, memberId: string, dto: UpdateTeamMemberDto) {
    await this.findOne(eventId, teamId); // Ensure team exists

    const member = await this.prisma.teamMember.findFirst({
      where: { id: memberId, teamId },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }

    return this.prisma.teamMember.update({
      where: { id: memberId },
      data: {
        name: dto.name,
        photoUrl: dto.photoUrl,
        role: dto.role,
        quote: dto.quote,
        displayOrder: dto.displayOrder,
      },
    });
  }

  async removeMember(eventId: string, teamId: string, memberId: string) {
    await this.findOne(eventId, teamId); // Ensure team exists

    const member = await this.prisma.teamMember.findFirst({
      where: { id: memberId, teamId },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }

    await this.prisma.teamMember.delete({ where: { id: memberId } });
    return { success: true };
  }

  // Randomization
  async randomizeOrder(eventId: string, roundNumber: number) {
    const teams = await this.prisma.team.findMany({
      where: { eventId, roundAssignment: roundNumber },
    });

    // Fisher-Yates shuffle
    const shuffled = [...teams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Update presentation orders
    await this.prisma.$transaction(
      shuffled.map((team, index) =>
        this.prisma.team.update({
          where: { id: team.id },
          data: { presentationOrder: index + 1 },
        }),
      ),
    );

    return shuffled.map((team, index) => ({
      position: index + 1,
      teamId: team.id,
      teamName: team.name,
      university: team.university,
    }));
  }

  // Teams by round
  async findByRound(eventId: string, roundNumber: number) {
    return this.prisma.team.findMany({
      where: { eventId, roundAssignment: roundNumber },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { presentationOrder: 'asc' },
    });
  }

  // Bulk import teams from CSV data
  async importTeams(eventId: string, teams: ImportTeamDto[]) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as { name: string; error: string }[],
    };

    for (const teamData of teams) {
      try {
        // Check for duplicate team name in event
        const existing = await this.prisma.team.findUnique({
          where: { eventId_name: { eventId, name: teamData.name } },
        });

        if (existing) {
          results.skipped++;
          results.errors.push({ name: teamData.name, error: 'Team already exists' });
          continue;
        }

        // Create team with members
        await this.prisma.team.create({
          data: {
            eventId,
            name: teamData.name,
            university: teamData.university,
            roundAssignment: teamData.roundAssignment,
            strategyTagline: teamData.strategyTagline,
            rankBadge: teamData.rankBadge,
            status: 'APPROVED',
            members: teamData.memberNames?.length
              ? {
                  create: teamData.memberNames.map((name, index) => ({
                    name,
                    displayOrder: index,
                  })),
                }
              : undefined,
          },
        });

        results.created++;
      } catch (error) {
        results.errors.push({
          name: teamData.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      ...results,
      total: teams.length,
    };
  }
}

