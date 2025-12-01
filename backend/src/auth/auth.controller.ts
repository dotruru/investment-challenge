import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto, AdminRegisterDto, JuryLoginDto, RefreshTokenDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin/register')
  async registerAdmin(@Body() dto: AdminRegisterDto) {
    return this.authService.registerAdmin(dto);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(@Body() dto: AdminLoginDto) {
    return this.authService.loginAdmin(dto);
  }

  @Post('admin/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('jury/login')
  @HttpCode(HttpStatus.OK)
  async loginJury(@Body() dto: JuryLoginDto) {
    return this.authService.loginJury(dto);
  }
}

