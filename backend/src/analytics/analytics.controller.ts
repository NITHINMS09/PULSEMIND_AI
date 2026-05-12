import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get organization health overview' })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('departments')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get department analytics' })
  getDepartments() {
    return this.analyticsService.getDepartments();
  }

  @Get('burnout')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get burnout risk report' })
  getBurnout() {
    return this.analyticsService.getBurnoutReport();
  }

  @Get('emotions')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get emotion analytics' })
  getEmotions() {
    return this.analyticsService.getEmotions();
  }

  @Get('patterns')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get pattern analysis' })
  getPatterns() {
    return this.analyticsService.getPatterns();
  }

  @Get('attrition')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get attrition risk report' })
  getAttrition() {
    return this.analyticsService.getAttritionRisk();
  }

  @Get('predictions')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get predictive insights' })
  getPredictions() {
    return this.analyticsService.getPredictions();
  }
}
