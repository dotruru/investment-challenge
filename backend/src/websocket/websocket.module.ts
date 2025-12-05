import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventGateway } from './event.gateway';
import { LiveStateModule } from '../live-state/live-state.module';

@Module({
  imports: [
    LiveStateModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EventGateway],
  exports: [EventGateway],
})
export class WebsocketModule {}

