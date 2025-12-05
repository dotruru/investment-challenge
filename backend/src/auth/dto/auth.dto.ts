import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class AdminRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'operator'])
  role?: string;
}

export class JuryLoginDto {
  @IsString()
  @MinLength(6)
  accessCode: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class OperatorLoginDto {
  @IsString()
  @MinLength(4)
  pin: string;
}

