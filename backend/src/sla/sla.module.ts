import { Module } from '@nestjs/common';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { SlaCronService } from './sla.cron';

@Module({
  providers: [SlaService, SlaCronService],
  controllers: [SlaController],
  exports: [SlaService],
})
export class SlaModule {}
