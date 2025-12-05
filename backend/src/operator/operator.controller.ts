import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OperatorService } from './operator.service';
import {
  SetStageDto,
  SetTeamDto,
  StartTimerDto,
  RandomizeRoundDto,
  TriggerAnimationDto,
  SubmitScoreDto,
} from './dto/operator.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('operator/events/:eventId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('operator', 'admin')
export class OperatorController {
  constructor(private operatorService: OperatorService) {}

  @Get('state')
  getState(@Param('eventId') eventId: string) {
    return this.operatorService.getState(eventId);
  }

  @Post('stage')
  setStage(@Param('eventId') eventId: string, @Body() dto: SetStageDto) {
    return this.operatorService.setStage(eventId, dto.stageId);
  }

  @Post('team')
  setTeam(@Param('eventId') eventId: string, @Body() dto: SetTeamDto) {
    return this.operatorService.setTeam(eventId, dto.teamId);
  }

  @Post('team/next')
  nextTeam(@Param('eventId') eventId: string) {
    return this.operatorService.nextTeam(eventId);
  }

  @Post('timer/start')
  startTimer(@Param('eventId') eventId: string, @Body() dto: StartTimerDto) {
    return this.operatorService.startTimer(eventId, dto.type, dto.durationSeconds, dto.label);
  }

  @Post('timer/pause')
  pauseTimer(@Param('eventId') eventId: string) {
    return this.operatorService.pauseTimer(eventId);
  }

  @Post('timer/resume')
  resumeTimer(@Param('eventId') eventId: string) {
    return this.operatorService.resumeTimer(eventId);
  }

  @Post('timer/reset')
  resetTimer(@Param('eventId') eventId: string) {
    return this.operatorService.resetTimer(eventId);
  }

  @Post('round/randomize')
  randomizeRound(@Param('eventId') eventId: string, @Body() dto: RandomizeRoundDto) {
    return this.operatorService.randomizeRound(eventId, dto.roundNumber);
  }

  @Post('animation/trigger')
  triggerAnimation(@Param('eventId') eventId: string, @Body() dto: TriggerAnimationDto) {
    return this.operatorService.triggerAnimation(eventId, dto.animation, dto.params);
  }

  @Post('animation/next')
  nextAnimationStep(@Param('eventId') eventId: string) {
    return this.operatorService.nextAnimationStep(eventId);
  }

  @Get('scores/status')
  getScoringStatus(@Param('eventId') eventId: string) {
    return this.operatorService.getScoringStatus(eventId);
  }

  @Get('scores')
  getOperatorScores(@Param('eventId') eventId: string) {
    return this.operatorService.getOperatorScores(eventId);
  }

  @Post('scores/:teamId')
  submitOperatorScore(
    @Param('eventId') eventId: string,
    @Param('teamId') teamId: string,
    @Body() dto: SubmitScoreDto,
  ) {
    return this.operatorService.submitOperatorScore(eventId, teamId, dto.score);
  }

  @Post('awards/lock')
  lockAwards(@Param('eventId') eventId: string) {
    return this.operatorService.lockAwards(eventId);
  }

  @Get('awards/results')
  getAwardsResults(@Param('eventId') eventId: string) {
    return this.operatorService.getAwardsResults(eventId);
  }
}

