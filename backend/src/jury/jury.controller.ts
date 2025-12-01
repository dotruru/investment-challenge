import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JuryService } from './jury.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubmitScoreDto } from '../scoring/dto/scoring.dto';

@Controller('jury')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('jury')
export class JuryController {
  constructor(private juryService: JuryService) {}

  @Get('event')
  getEventInfo(@CurrentUser('id') juryId: string) {
    return this.juryService.getEventInfo(juryId);
  }

  @Get('teams')
  getTeams(@CurrentUser('id') juryId: string) {
    return this.juryService.getTeams(juryId);
  }

  @Get('teams/:teamId')
  getTeamDetails(
    @CurrentUser('id') juryId: string,
    @Param('teamId') teamId: string,
  ) {
    return this.juryService.getTeamDetails(juryId, teamId);
  }

  @Get('scores')
  getScores(@CurrentUser('id') juryId: string) {
    return this.juryService.getScores(juryId);
  }

  @Post('scores/:teamId')
  submitScore(
    @CurrentUser('id') juryId: string,
    @Param('teamId') teamId: string,
    @Body() dto: SubmitScoreDto,
  ) {
    return this.juryService.submitScore(juryId, teamId, dto);
  }

  @Get('current')
  getCurrentTeam(@CurrentUser('id') juryId: string) {
    return this.juryService.getCurrentTeam(juryId);
  }

  @Get('criteria')
  getCriteria(@CurrentUser('id') juryId: string) {
    return this.juryService.getCriteria(juryId);
  }
}

