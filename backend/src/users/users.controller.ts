import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'List all users' })
  findAll(
    @Query('role') role?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ role, departmentId, search });
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get current user stats' })
  getMyStats(@CurrentUser('id') userId: string) {
    return this.usersService.getUserStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/role')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update user role' })
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/suspend')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Suspend a user' })
  suspend(@Param('id') id: string) {
    return this.usersService.suspend(id);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Activate a user' })
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a user' })
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
