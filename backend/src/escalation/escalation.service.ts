import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Escalation levels:
 * 0 - Initial (unescalated)
 * 1 - Assigned Team Member
 * 2 - Team Lead
 * 3 - Department Head
 * 4 - HR Manager / Admin
 * 5 - Super Admin
 */
const ESCALATION_LEVELS: Record<number, string> = {
  1: 'Team Member',
  2: 'Team Lead',
  3: 'Department Head',
  4: 'HR Manager',
  5: 'Super Admin',
};

@Injectable()
export class EscalationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Manually escalate a complaint
   */
  async escalate(
    complaintId: string,
    triggeredById: string,
    reason: string,
    note?: string,
    triggeredBy: string = 'MANUAL',
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { assignments: { where: { isActive: true }, take: 1 } },
    });

    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.escalationLevel >= 5) throw new BadRequestException('Already at maximum escalation level');
    if (['RESOLVED', 'CLOSED'].includes(complaint.status)) {
      throw new BadRequestException('Cannot escalate a resolved or closed complaint');
    }

    const fromLevel = complaint.escalationLevel;
    const toLevel = fromLevel + 1;

    // Upgrade priority on escalation
    const priorityUpgrade: Record<string, string> = { LOW: 'MEDIUM', MEDIUM: 'HIGH', HIGH: 'CRITICAL' };
    const newPriority = priorityUpgrade[complaint.priority] || complaint.priority;

    // Update complaint
    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        escalationLevel: toLevel,
        status: 'ESCALATED',
        priority: newPriority,
      },
    });

    // Create escalation record
    const escalation = await this.prisma.escalation.create({
      data: {
        complaintId,
        fromLevel,
        toLevel,
        fromUserId: complaint.assigneeId,
        reason,
        triggeredBy,
        triggeredById,
        note,
      },
    });

    // Create resolution history entry
    await this.prisma.resolutionHistory.create({
      data: {
        complaintId,
        fromStatus: complaint.status,
        toStatus: 'ESCALATED',
        note: `Escalated to Level ${toLevel} (${ESCALATION_LEVELS[toLevel] || 'Unknown'}): ${reason}`,
        changedById: triggeredById,
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: triggeredById,
        action: 'ESCALATION_TRIGGERED',
        entity: 'Complaint',
        entityId: complaintId,
        details: JSON.stringify({ fromLevel, toLevel, reason, triggeredBy }),
      },
    });

    return { complaint: updated, escalation };
  }

  /**
   * Get escalation history for a complaint
   */
  async getByComplaint(complaintId: string) {
    return this.prisma.escalation.findMany({
      where: { complaintId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all escalations (admin view)
   */
  async findAll(params?: { fromDate?: Date; toDate?: Date; level?: number }) {
    const where: any = {};
    if (params?.level) where.toLevel = params.level;
    if (params?.fromDate || params?.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = params.fromDate;
      if (params.toDate) where.createdAt.lte = params.toDate;
    }

    return this.prisma.escalation.findMany({
      where,
      include: {
        complaint: {
          include: {
            feedback: { select: { title: true, category: true } },
            author: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get escalation analytics
   */
  async getAnalytics() {
    const escalations = await this.prisma.escalation.findMany({
      include: {
        complaint: {
          include: {
            feedback: { select: { category: true } },
            assignments: { include: { team: { select: { name: true } } } },
          },
        },
      },
    });

    const total = escalations.length;

    // By level
    const byLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    escalations.forEach((e) => { byLevel[e.toLevel] = (byLevel[e.toLevel] || 0) + 1; });

    // By trigger type
    const byTrigger: Record<string, number> = {};
    escalations.forEach((e) => { byTrigger[e.triggeredBy] = (byTrigger[e.triggeredBy] || 0) + 1; });

    // By team
    const byTeam: Record<string, number> = {};
    escalations.forEach((e) => {
      const teamName = e.complaint?.assignments?.[0]?.team?.name || 'Unassigned';
      byTeam[teamName] = (byTeam[teamName] || 0) + 1;
    });

    // Top categories
    const byCategory: Record<string, number> = {};
    escalations.forEach((e) => {
      const cat = e.complaint?.feedback?.category || 'Unknown';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    return {
      total,
      byLevel: Object.entries(byLevel).map(([level, count]) => ({
        level: parseInt(level), label: ESCALATION_LEVELS[parseInt(level)] || `Level ${level}`, count,
      })),
      byTrigger: Object.entries(byTrigger).map(([type, count]) => ({ type, count })),
      byTeam: Object.entries(byTeam).sort((a, b) => b[1] - a[1]).map(([team, count]) => ({ team, count })),
      topCategories: Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([category, count]) => ({ category, count })),
    };
  }
}
