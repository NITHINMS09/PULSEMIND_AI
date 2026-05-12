import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { SlaService } from './sla.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sla')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SlaController {
  constructor(private slaService: SlaService) {}

  @Get('config')
  @Roles('SUPER_ADMIN')
  getConfig() {
    return this.slaService.getConfig();
  }

  @Get('report')
  @Roles('SUPER_ADMIN')
  getReport() {
    return this.slaService.getPerformanceReport();
  }
}
