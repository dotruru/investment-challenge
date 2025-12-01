import { IsString, IsOptional, IsInt, IsObject, IsEnum, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TeamStatus } from '@prisma/client';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsString()
  university: string;

  @IsOptional()
  @IsInt()
  rankGlobal?: number;

  @IsOptional()
  @IsString()
  rankBadge?: string;

  @IsOptional()
  @IsObject()
  stats?: Record<string, any>;

  @IsOptional()
  @IsString()
  strategyTagline?: string;

  @IsOptional()
  @IsString()
  strategyTearsheetUrl?: string;

  @IsOptional()
  @IsString()
  avatarCardImageUrl?: string;

  @IsInt()
  @Min(1)
  @Max(3)
  roundAssignment: number;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsInt()
  rankGlobal?: number;

  @IsOptional()
  @IsString()
  rankBadge?: string;

  @IsOptional()
  @IsObject()
  stats?: Record<string, any>;

  @IsOptional()
  @IsString()
  strategyTagline?: string;

  @IsOptional()
  @IsString()
  strategyTearsheetUrl?: string;

  @IsOptional()
  @IsString()
  avatarCardImageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  roundAssignment?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  presentationOrder?: number;

  @IsOptional()
  @IsEnum(TeamStatus)
  status?: TeamStatus;
}

export class CreateTeamMemberDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  quote?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  quote?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// For CSV import
export class ImportTeamDto {
  @IsString()
  name: string;

  @IsString()
  university: string;

  @IsInt()
  @Min(1)
  @Max(3)
  roundAssignment: number;

  @IsOptional()
  @IsString()
  strategyTagline?: string;

  @IsOptional()
  @IsString()
  rankBadge?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberNames?: string[];
}

export class ImportTeamsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportTeamDto)
  teams: ImportTeamDto[];
}

