import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('complaints')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatService.getMessages(id, limit ? parseInt(limit) : 50, cursor);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() body: { content?: string; messageType?: string; attachments?: string; replyToId?: string },
    @CurrentUser() user: any,
  ) {
    return this.chatService.sendMessage({
      complaintId: id,
      senderId: user.id,
      senderType: user.role === 'EMPLOYEE' ? 'EMPLOYEE' : 'TEAM',
      ...body,
    });
  }

  @Patch(':id/messages/:msgId/read')
  markRead(
    @Param('msgId') msgId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.markRead(msgId, user.id);
  }

  @Delete(':id/messages/:msgId')
  deleteMessage(@Param('msgId') msgId: string) {
    return this.chatService.deleteMessage(msgId);
  }

  @Get(':id/messages/unread')
  getUnread(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.getUnreadCount(id, user.id);
  }
}
