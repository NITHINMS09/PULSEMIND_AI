import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { role?: string; departmentId?: string; search?: string }) {
    const where: any = {};
    if (params?.role) where.role = params.role;
    if (params?.departmentId) where.departmentId = params.departmentId;
    if (params?.search) {
      where.OR = [
        { firstName: { contains: params.search } },
        { lastName: { contains: params.search } },
        { email: { contains: params.search } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        role: true,
        jobTitle: true,
        experienceLevel: true,
        departmentId: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        organization: true,
        userBadges: { include: { badge: true } },
        burnoutScores: { orderBy: { createdAt: 'desc' }, take: 1 },
        wellnessReports: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  async updateRole(id: string, role: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
  }

  async suspend(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async getUserStats(userId: string) {
    const [feedbackCount, resolvedCount, pendingCount, burnout] = await Promise.all([
      this.prisma.feedback.count({ where: { userId } }),
      this.prisma.feedback.count({ where: { userId, status: 'RESOLVED' } }),
      this.prisma.feedback.count({ where: { userId, status: { in: ['SUBMITTED', 'PENDING', 'IN_REVIEW'] } } }),
      this.prisma.burnoutScore.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      totalFeedback: feedbackCount,
      resolved: resolvedCount,
      pending: pendingCount,
      burnoutScore: burnout?.score || 0,
      burnoutRiskLevel: burnout?.riskLevel || 'LOW',
    };
  }
}
