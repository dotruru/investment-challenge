import { Module } from '@nestjs/common';
import { JuryController } from './jury.controller';
import { JuryService } from './jury.service';
import { ScoringModule } from '../scoring/scoring.module';
import { LiveStateModule } from '../live-state/live-state.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [ScoringModule, LiveStateModule, WebsocketModule],
  controllers: [JuryController],
  providers: [JuryService],
})
export class JuryModule {}

