import { Module } from '@nestjs/common';
import { EventGateway } from './event.gateway';
import { LiveStateModule } from '../live-state/live-state.module';

@Module({
  imports: [LiveStateModule],
  providers: [EventGateway],
  exports: [EventGateway],
})
export class WebsocketModule {}

