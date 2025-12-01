import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profiles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ProfileType } from '@prisma/client';

@Controller('events/:eventId/profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Post()
  @Roles('admin')
  create(@Param('eventId') eventId: string, @Body() dto: CreateProfileDto) {
    return this.profilesService.create(eventId, dto);
  }

  @Get()
  @Roles('admin', 'operator')
  findAll(
    @Param('eventId') eventId: string,
    @Query('type') profileType?: ProfileType,
  ) {
    return this.profilesService.findAll(eventId, profileType);
  }

  @Get('jury')
  @Roles('admin', 'operator')
  getJuryMembers(@Param('eventId') eventId: string) {
    return this.profilesService.getJuryMembers(eventId);
  }

  @Get(':profileId')
  @Roles('admin', 'operator')
  findOne(@Param('eventId') eventId: string, @Param('profileId') profileId: string) {
    return this.profilesService.findOne(eventId, profileId);
  }

  @Put(':profileId')
  @Roles('admin')
  update(
    @Param('eventId') eventId: string,
    @Param('profileId') profileId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.update(eventId, profileId, dto);
  }

  @Delete(':profileId')
  @Roles('admin')
  remove(@Param('eventId') eventId: string, @Param('profileId') profileId: string) {
    return this.profilesService.remove(eventId, profileId);
  }

  @Post(':profileId/regenerate-code')
  @Roles('admin')
  regenerateAccessCode(
    @Param('eventId') eventId: string,
    @Param('profileId') profileId: string,
  ) {
    return this.profilesService.regenerateAccessCode(eventId, profileId);
  }
}

// Public profiles endpoint
@Controller('public/events/:eventId/profiles')
export class PublicProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get()
  @Public()
  findAll(@Param('eventId') eventId: string) {
    return this.profilesService.findAll(eventId);
  }
}

