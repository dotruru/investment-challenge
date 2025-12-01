import { IsString, IsOptional, IsDateString, IsEnum, IsInt, IsObject, IsArray, Min } from 'class-validator';
import { EventStatus, StageType } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  venue?: string;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class CreateStageDto {
  @IsString()
  title: string;

  @IsEnum(StageType)
  stageType: StageType;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsDateString()
  startTimePlanned?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;
}

export class UpdateStageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(StageType)
  stageType?: StageType;

  @IsOptional()
  @IsDateString()
  startTimePlanned?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;
}

export class ReorderStagesDto {
  @IsArray()
  @IsString({ each: true })
  stageIds: string[];
}

