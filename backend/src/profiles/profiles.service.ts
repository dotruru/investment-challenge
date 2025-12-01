import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profiles.dto';
import { ProfileType } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const generateAccessCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(eventId: string, dto: CreateProfileDto) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Get max display order
    const maxOrder = await this.prisma.personProfile.aggregate({
      where: { eventId, profileType: dto.profileType },
      _max: { displayOrder: true },
    });

    const profile = await this.prisma.personProfile.create({
      data: {
        eventId,
        name: dto.name,
        role: dto.role,
        company: dto.company,
        photoUrl: dto.photoUrl,
        bioShort: dto.bioShort,
        profileType: dto.profileType,
        displayOrder: dto.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });

    // Create jury auth if profile is JURY
    if (dto.profileType === ProfileType.JURY) {
      await this.prisma.juryAuth.create({
        data: {
          juryId: profile.id,
          accessCode: generateAccessCode(),
        },
      });
    }

    return this.findOne(eventId, profile.id);
  }

  async findAll(eventId: string, profileType?: ProfileType) {
    return this.prisma.personProfile.findMany({
      where: {
        eventId,
        ...(profileType && { profileType }),
      },
      include: {
        juryAuth: {
          select: {
            accessCode: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(eventId: string, profileId: string) {
    const profile = await this.prisma.personProfile.findFirst({
      where: { id: profileId, eventId },
      include: {
        juryAuth: {
          select: {
            accessCode: true,
            lastLoginAt: true,
          },
        },
        scores: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                university: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${profileId} not found`);
    }

    return profile;
  }

  async update(eventId: string, profileId: string, dto: UpdateProfileDto) {
    await this.findOne(eventId, profileId); // Ensure exists

    return this.prisma.personProfile.update({
      where: { id: profileId },
      data: {
        name: dto.name,
        role: dto.role,
        company: dto.company,
        photoUrl: dto.photoUrl,
        bioShort: dto.bioShort,
        displayOrder: dto.displayOrder,
      },
      include: {
        juryAuth: {
          select: {
            accessCode: true,
            lastLoginAt: true,
          },
        },
      },
    });
  }

  async remove(eventId: string, profileId: string) {
    await this.findOne(eventId, profileId); // Ensure exists
    await this.prisma.personProfile.delete({ where: { id: profileId } });
    return { success: true };
  }

  // Regenerate jury access code
  async regenerateAccessCode(eventId: string, profileId: string) {
    const profile = await this.findOne(eventId, profileId);
    
    if (profile.profileType !== ProfileType.JURY) {
      throw new NotFoundException('Profile is not a jury member');
    }

    await this.prisma.juryAuth.update({
      where: { juryId: profileId },
      data: {
        accessCode: generateAccessCode(),
        accessToken: null, // Invalidate existing token
      },
    });

    return this.findOne(eventId, profileId);
  }

  // Get all jury members for an event
  async getJuryMembers(eventId: string) {
    return this.prisma.personProfile.findMany({
      where: { eventId, profileType: ProfileType.JURY },
      include: {
        juryAuth: {
          select: {
            accessCode: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: { scores: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }
}

