import { IsString, IsInt, IsOptional, IsIn, IsObject, Min, Max } from 'class-validator';

export class SetStageDto {
  @IsString()
  stageId: string;
}

export class SetTeamDto {
  @IsString()
  teamId: string;
}

export class StartTimerDto {
  @IsIn(['presentation', 'qa', 'break', 'custom'])
  type: 'presentation' | 'qa' | 'break' | 'custom';

  @IsInt()
  @Min(1)
  @Max(3600)
  durationSeconds: number;

  @IsOptional()
  @IsString()
  label?: string;
}

export class RandomizeRoundDto {
  @IsInt()
  @Min(1)
  @Max(3)
  roundNumber: number;
}

export class TriggerAnimationDto {
  @IsString()
  animation: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}

