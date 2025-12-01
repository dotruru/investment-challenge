import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ProfileType } from '@prisma/client';

export class CreateProfileDto {
  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  bioShort?: string;

  @IsEnum(ProfileType)
  profileType: ProfileType;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  bioShort?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

