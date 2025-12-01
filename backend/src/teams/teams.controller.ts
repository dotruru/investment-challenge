import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, CreateTeamMemberDto, UpdateTeamMemberDto, ImportTeamsDto } from './dto/teams.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('events/:eventId/teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  @Roles('admin')
  create(@Param('eventId') eventId: string, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(eventId, dto);
  }

  @Post('import')
  @Roles('admin')
  import(@Param('eventId') eventId: string, @Body() dto: ImportTeamsDto) {
    return this.teamsService.importTeams(eventId, dto.teams);
  }

  @Get()
  @Roles('admin', 'operator')
  findAll(@Param('eventId') eventId: string) {
    return this.teamsService.findAll(eventId);
  }

  @Get(':teamId')
  @Roles('admin', 'operator')
  findOne(@Param('eventId') eventId: string, @Param('teamId') teamId: string) {
    return this.teamsService.findOne(eventId, teamId);
  }

  @Put(':teamId')
  @Roles('admin')
  update(
    @Param('eventId') eventId: string,
    @Param('teamId') teamId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(eventId, teamId, dto);
  }

  @Delete(':teamId')
  @Roles('admin')
  remove(@Param('eventId') eventId: string, @Param('teamId') teamId: string) {
    return this.teamsService.remove(eventId, teamId);
  }

  // Team Members
  @Post(':teamId/members')
  @Roles('admin')
  addMember(
    @Param('eventId') eventId: string,
    @Param('teamId') teamId: string,
    @Body() dto: CreateTeamMemberDto,
  ) {
    return this.teamsService.addMember(eventId, teamId, dto);
  }

  @Put(':teamId/members/:memberId')
  @Roles('admin')
  updateMember(
    @Param('eventId') eventId: string,
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamsService.updateMember(eventId, teamId, memberId, dto);
  }

  @Delete(':teamId/members/:memberId')
  @Roles('admin')
  removeMember(
    @Param('eventId') eventId: string,
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.teamsService.removeMember(eventId, teamId, memberId);
  }
}

// Public teams endpoint (separate controller)
@Controller('public/events/:eventId/teams')
export class PublicTeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  @Public()
  findAll(@Param('eventId') eventId: string) {
    return this.teamsService.findAll(eventId);
  }
}

