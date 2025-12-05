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
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, CreateStageDto, UpdateStageDto, ReorderStagesDto } from './dto/events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // Admin CRUD
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Get()
  @Public()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  // Stage Management
  @Get(':id/stages')
  @Roles('admin', 'operator')
  getStages(@Param('id') eventId: string) {
    return this.eventsService.getStages(eventId);
  }

  @Post(':id/stages')
  @Roles('admin')
  createStage(@Param('id') eventId: string, @Body() dto: CreateStageDto) {
    return this.eventsService.createStage(eventId, dto);
  }

  @Put(':id/stages/:stageId')
  @Roles('admin')
  updateStage(
    @Param('id') eventId: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.eventsService.updateStage(eventId, stageId, dto);
  }

  @Delete(':id/stages/:stageId')
  @Roles('admin')
  deleteStage(@Param('id') eventId: string, @Param('stageId') stageId: string) {
    return this.eventsService.deleteStage(eventId, stageId);
  }

  @Post(':id/stages/reorder')
  @Roles('admin')
  reorderStages(@Param('id') eventId: string, @Body() dto: ReorderStagesDto) {
    return this.eventsService.reorderStages(eventId, dto);
  }

  // Public Display Data
  @Get(':id/display')
  @Public()
  getDisplayData(@Param('id') id: string) {
    return this.eventsService.getDisplayData(id);
  }
}

