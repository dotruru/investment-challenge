import { Module } from '@nestjs/common';
import { OperatorController } from './operator.controller';
import { OperatorService } from './operator.service';
import { LiveStateModule } from '../live-state/live-state.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { TeamsModule } from '../teams/teams.module';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [LiveStateModule, WebsocketModule, TeamsModule, ScoringModule],
  controllers: [OperatorController],
  providers: [OperatorService],
})
export class OperatorModule {}

