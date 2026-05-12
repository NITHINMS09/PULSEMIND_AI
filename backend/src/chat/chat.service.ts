import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get message thread for a complaint
   */
  async getMessages(complaintId: string, limit: number = 50, cursor?: string) {
    const where: any = { complaintId, isDeleted: false };
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    return this.prisma.complaintMessage.findMany({
      where,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
        replyTo: {
          select: { id: true, content: true, sender: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Send a message
   */
  async sendMessage(data: {
    complaintId: string;
    senderId: string;
    senderType: string;
    content?: string;
    messageType?: string;
    attachments?: string;
    voiceNoteUrl?: string;
    replyToId?: string;
  }) {
    // Verify complaint exists
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: data.complaintId },
      select: { id: true, status: true },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');

    const message = await this.prisma.complaintMessage.create({
      data: {
        complaintId: data.complaintId,
        senderId: data.senderId,
        senderType: data.senderType,
        content: data.content,
        messageType: data.messageType || 'TEXT',
        attachments: data.attachments,
        voiceNoteUrl: data.voiceNoteUrl,
        replyToId: data.replyToId,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: data.senderId,
        action: 'MESSAGE_SENT',
        entity: 'ComplaintMessage',
        entityId: message.id,
        details: JSON.stringify({ complaintId: data.complaintId, messageType: data.messageType || 'TEXT' }),
      },
    });

    return message;
  }

  /**
   * Mark message as read
   */
  async markRead(messageId: string, readByUserId: string) {
    const message = await this.prisma.complaintMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    // Update readBy JSON
    const existingReadBy = message.readBy ? JSON.parse(message.readBy) : {};
    existingReadBy[readByUserId] = new Date().toISOString();

    return this.prisma.complaintMessage.update({
      where: { id: messageId },
      data: {
        readAt: message.readAt || new Date(),
        readBy: JSON.stringify(existingReadBy),
      },
    });
  }

  /**
   * Soft delete a message
   */
  async deleteMessage(messageId: string) {
    return this.prisma.complaintMessage.update({
      where: { id: messageId },
      data: { isDeleted: true, content: '[Message deleted]' },
    });
  }

  /**
   * Get unread count for a user in a complaint thread
   */
  async getUnreadCount(complaintId: string, userId: string) {
    const messages = await this.prisma.complaintMessage.findMany({
      where: {
        complaintId,
        isDeleted: false,
        senderId: { not: userId },
      },
      select: { id: true, readBy: true },
    });

    let unread = 0;
    for (const msg of messages) {
      const readBy = msg.readBy ? JSON.parse(msg.readBy) : {};
      if (!readBy[userId]) unread++;
    }

    return { unread };
  }
}
