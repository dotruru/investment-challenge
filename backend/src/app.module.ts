import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { TeamsModule } from './teams/teams.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ScoringModule } from './scoring/scoring.module';
import { LiveStateModule } from './live-state/live-state.module';
import { WebsocketModule } from './websocket/websocket.module';
import { UploadModule } from './upload/upload.module';
import { OperatorModule } from './operator/operator.module';
import { JuryModule } from './jury/jury.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    EventsModule,
    TeamsModule,
    ProfilesModule,
    ScoringModule,
    LiveStateModule,
    WebsocketModule,
    UploadModule,
    OperatorModule,
    JuryModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}

