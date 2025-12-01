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
import { ScoringService } from './scoring.service';
import { CreateCriteriaDto, UpdateCriteriaDto } from './dto/scoring.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('events/:eventId/criteria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScoringController {
  constructor(private scoringService: ScoringService) {}

  @Post()
  @Roles('admin')
  create(@Param('eventId') eventId: string, @Body() dto: CreateCriteriaDto) {
    return this.scoringService.createCriteria(eventId, dto);
  }

  @Get()
  @Roles('admin', 'operator', 'jury')
  findAll(@Param('eventId') eventId: string) {
    return this.scoringService.getCriteria(eventId);
  }

  @Put(':criteriaId')
  @Roles('admin')
  update(
    @Param('eventId') eventId: string,
    @Param('criteriaId') criteriaId: string,
    @Body() dto: UpdateCriteriaDto,
  ) {
    return this.scoringService.updateCriteria(eventId, criteriaId, dto);
  }

  @Delete(':criteriaId')
  @Roles('admin')
  remove(@Param('eventId') eventId: string, @Param('criteriaId') criteriaId: string) {
    return this.scoringService.deleteCriteria(eventId, criteriaId);
  }

  @Get('rankings')
  @Roles('admin', 'operator')
  getRankings(@Param('eventId') eventId: string) {
    return this.scoringService.calculateRankings(eventId);
  }
}

