import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCriteriaDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateCriteriaDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class CriteriaScoreDto {
  @IsString()
  criteriaId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  score: number;
}

export class SubmitScoreDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriteriaScoreDto)
  criteriaScores: CriteriaScoreDto[];
}

