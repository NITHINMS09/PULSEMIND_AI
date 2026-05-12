import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { EscalationService } from './escalation.service';
import { ManualEscalateDto } from './dto/escalation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class EscalationController {
  constructor(private escalationService: EscalationService) {}

  @Post('complaints/:id/escalate')
  escalate(
    @Param('id') id: string,
    @Body() dto: ManualEscalateDto,
    @CurrentUser() user: any,
  ) {
    return this.escalationService.escalate(id, user.id, dto.reason, dto.note, 'MANUAL');
  }

  @Get('complaints/:id/escalations')
  getByComplaint(@Param('id') id: string) {
    return this.escalationService.getByComplaint(id);
  }

  @Get('escalations')
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  findAll(@Query('level') level?: string) {
    return this.escalationService.findAll({ level: level ? parseInt(level) : undefined });
  }

  @Get('escalations/analytics')
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  getAnalytics() {
    return this.escalationService.getAnalytics();
  }
}
