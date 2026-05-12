import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('audit-logs')
  getAuditLogs(@Query('userId') userId?: string, @Query('action') action?: string, @Query('page') page?: number) {
    return this.adminService.getAuditLogs({ userId, action, page });
  }

  @Get('ai-settings')
  getAiSettings() {
    return this.adminService.getAiSettings();
  }

  @Patch('ai-settings')
  updateAiSettings(@Body() data: Record<string, string>) {
    return this.adminService.updateAiSettings(data);
  }
}
