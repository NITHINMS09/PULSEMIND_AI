import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, AddMemberDto } from './dto/teams.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Get('workload')
  @Roles('SUPER_ADMIN')
  getWorkload() {
    return this.teamsService.getWorkloadStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @Get(':id/complaints')
  getComplaints(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.teamsService.getTeamComplaints(id, { status, priority });
  }

  @Post(':id/members')
  @Roles('SUPER_ADMIN')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.teamsService.addMember(id, dto.userId, dto.role);
  }

  @Delete(':id/members/:userId')
  @Roles('SUPER_ADMIN')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.teamsService.removeMember(id, userId);
  }
}
