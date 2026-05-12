import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAuditLogs(params?: { userId?: string; action?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.action) where.action = params.action;

    const page = params?.page || 1;
    const limit = params?.limit || 50;

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getAiSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { startsWith: 'ai.' } },
    });
    return Object.fromEntries(settings.map(s => [s.key, s.value]));
  }

  async updateAiSettings(data: Record<string, string>) {
    for (const [key, value] of Object.entries(data)) {
      await this.prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, type: 'string' },
      });
    }
    return this.getAiSettings();
  }
}
