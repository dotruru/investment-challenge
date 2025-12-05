import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto, AdminRegisterDto, JuryLoginDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email?: string;
  role: string;
  type: 'admin' | 'jury';
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Admin Authentication
  async registerAdmin(dto: AdminRegisterDto) {
    const existingUser = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.adminUser.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role || 'admin',
      },
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'admin',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async loginAdmin(dto: AdminLoginDto) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'admin',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const tokens = await this.generateTokens({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        type: payload.type,
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Operator Authentication (PIN-based)
  async loginOperator(pin: string) {
    const operatorPin = this.configService.get<string>('OPERATOR_PIN') || '847291';
    
    if (pin !== operatorPin) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // Find or use operator account
    let user = await this.prisma.adminUser.findFirst({
      where: { role: 'operator' },
    });

    if (!user) {
      // Create operator user if doesn't exist
      const passwordHash = await bcrypt.hash('operator' + operatorPin, 10);
      user = await this.prisma.adminUser.create({
        data: {
          email: 'operator@system.local',
          passwordHash,
          name: 'Operator',
          role: 'operator',
        },
      });
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: 'operator',
      type: 'admin',
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  // Jury Authentication
  async loginJury(dto: JuryLoginDto) {
    const juryAuth = await this.prisma.juryAuth.findUnique({
      where: { accessCode: dto.accessCode },
      include: {
        jury: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!juryAuth) {
      throw new UnauthorizedException('Invalid access code');
    }

    const tokens = await this.generateTokens({
      sub: juryAuth.juryId,
      role: 'jury',
      type: 'jury',
    });

    // Update last login
    await this.prisma.juryAuth.update({
      where: { id: juryAuth.id },
      data: {
        lastLoginAt: new Date(),
        accessToken: tokens.accessToken,
      },
    });

    return {
      jury: {
        id: juryAuth.jury.id,
        name: juryAuth.jury.name,
        role: juryAuth.jury.role,
        photoUrl: juryAuth.jury.photoUrl,
      },
      event: {
        id: juryAuth.jury.event.id,
        name: juryAuth.jury.event.name,
        date: juryAuth.jury.event.date,
      },
      ...tokens,
    };
  }

  // Token Generation
  private async generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d',
    });

    return { accessToken, refreshToken };
  }

  // Validate User
  async validateUser(payload: JwtPayload) {
    if (payload.type === 'admin') {
      return await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
      });
    } else if (payload.type === 'jury') {
      return await this.prisma.personProfile.findUnique({
        where: { id: payload.sub },
      });
    }
    return null;
  }
}

