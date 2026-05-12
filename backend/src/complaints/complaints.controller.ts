import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('complaints')
@Controller('complaints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @ApiOperation({ summary: 'List complaints (role-based)' })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.complaintsService.findAll(user.id, user.role, { status, priority, departmentId });
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user complaints' })
  findMyComplaints(@CurrentUser('id') userId: string) {
    return this.complaintsService.findByUser(userId);
  }

  @Get('kanban')
  @UseGuards(RolesGuard)
  @Roles('TEAM_MEMBER', 'HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get Kanban board view' })
  getKanban() {
    return this.complaintsService.getKanbanView();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('TEAM_MEMBER', 'HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get complaint stats' })
  getStats() {
    return this.complaintsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complaint detail' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.complaintsService.findById(id, userId);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Assign complaint to team member' })
  assign(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.complaintsService.assign(id, assigneeId, userId);
  }

  @Post(':id/solution')
  @UseGuards(RolesGuard)
  @Roles('TEAM_MEMBER', 'HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Submit solution (status → WAITING_FOR_EMPLOYEE)' })
  submitSolution(
    @Param('id') id: string,
    @Body('solution') solution: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.complaintsService.submitSolution(id, solution, userId);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Employee confirms resolution (accept/reject)' })
  confirmResolution(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('decision') decision: 'ACCEPTED' | 'REJECTED' | 'FURTHER_HELP',
    @Body('comment') comment?: string,
  ) {
    return this.complaintsService.confirmResolution(id, userId, decision, comment);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('TEAM_MEMBER', 'HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Directly resolve a complaint (admin override)' })
  resolve(
    @Param('id') id: string,
    @Body('note') note: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.complaintsService.submitSolution(id, note, userId);
  }

  @Post(':id/escalate')
  @UseGuards(RolesGuard)
  @Roles('TEAM_MEMBER', 'HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Escalate a complaint' })
  escalate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.complaintsService.escalate(id, userId);
  }
}
