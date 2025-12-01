import { Module } from '@nestjs/common';
import { LiveStateService } from './live-state.service';

@Module({
  providers: [LiveStateService],
  exports: [LiveStateService],
})
export class LiveStateModule {}

