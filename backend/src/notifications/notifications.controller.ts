import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findByUser(userId, {
      unreadOnly: unreadOnly === 'true',
      type,
      limit,
    });
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Get grouped notifications (today/yesterday/older)' })
  getGrouped(@CurrentUser('id') userId: string) {
    return this.notificationsService.getGrouped(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  deleteOne(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all notifications' })
  clearAll(@CurrentUser('id') userId: string) {
    return this.notificationsService.clearAll(userId);
  }
}
