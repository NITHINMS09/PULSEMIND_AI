import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string, params?: { unreadOnly?: boolean; type?: string; limit?: number }) {
    const where: any = { userId };
    if (params?.unreadOnly) where.isRead = false;
    if (params?.type) where.type = params.type;

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 50,
    });
  }

  async create(userId: string, data: { type: string; title: string; body: string; link?: string; metadata?: string }) {
    const notification = await this.prisma.notification.create({
      data: { userId, ...data },
    });
    this.logger.log(`Notification created: [${data.type}] "${data.title}" → user ${userId}`);
    return notification;
  }

  async createForRole(role: string, data: { type: string; title: string; body: string; link?: string }) {
    const users = await this.prisma.user.findMany({
      where: { role, accountStatus: 'APPROVED', isActive: true },
      select: { id: true },
    });

    const notifications = [];
    for (const user of users) {
      const n = await this.prisma.notification.create({
        data: { userId: user.id, ...data },
      });
      notifications.push(n);
    }
    return notifications;
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async clearAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async getGrouped(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    return {
      today: notifications.filter(n => new Date(n.createdAt) >= today),
      yesterday: notifications.filter(n => new Date(n.createdAt) >= yesterday && new Date(n.createdAt) < today),
      older: notifications.filter(n => new Date(n.createdAt) < yesterday),
      unreadCount: notifications.filter(n => !n.isRead).length,
    };
  }
}
