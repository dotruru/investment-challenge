import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
})
export class AppModule {}

