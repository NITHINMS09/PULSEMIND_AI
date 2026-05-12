import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

// Default SLA configuration (in hours)
const DEFAULT_SLA_CONFIG: Record<string, { responseHours: number; resolutionHours: number; escalationPercent: number }> = {
  LOW: { responseHours: 24, resolutionHours: 72, escalationPercent: 80 },
  MEDIUM: { responseHours: 8, resolutionHours: 48, escalationPercent: 75 },
  HIGH: { responseHours: 4, resolutionHours: 24, escalationPercent: 70 },
  CRITICAL: { responseHours: 1, resolutionHours: 4, escalationPercent: 60 },
};

@Injectable()
export class SlaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create SLA record for a complaint
   */
  async createSLARecord(complaintId: string, priority: string) {
    const config = DEFAULT_SLA_CONFIG[priority] || DEFAULT_SLA_CONFIG.MEDIUM;
    const now = new Date();

    const responseDeadline = new Date(now.getTime() + config.responseHours * 3600000);
    const resolutionDeadline = new Date(now.getTime() + config.resolutionHours * 3600000);

    return this.prisma.sLARecord.create({
      data: {
        complaintId,
        priority,
        responseDeadline,
        resolutionDeadline,
      },
    });
  }

  /**
   * Record first response
   */
  async recordFirstResponse(complaintId: string) {
    const sla = await this.prisma.sLARecord.findUnique({ where: { complaintId } });
    if (!sla || sla.firstResponseAt) return sla;

    const now = new Date();
    const isBreached = now > sla.responseDeadline;

    return this.prisma.sLARecord.update({
      where: { complaintId },
      data: {
        firstResponseAt: now,
        isResponseBreached: isBreached,
        responseBreachedAt: isBreached ? now : undefined,
      },
    });
  }

  /**
   * Record resolution
   */
  async recordResolution(complaintId: string) {
    const sla = await this.prisma.sLARecord.findUnique({ where: { complaintId } });
    if (!sla) return null;

    const now = new Date();
    const effectiveDeadline = new Date(sla.resolutionDeadline.getTime() + sla.pausedDurationSeconds * 1000);
    const isBreached = now > effectiveDeadline;

    return this.prisma.sLARecord.update({
      where: { complaintId },
      data: {
        resolvedAt: now,
        isResolutionBreached: isBreached,
        resolutionBreachedAt: isBreached ? now : undefined,
      },
    });
  }

  /**
   * Pause SLA timer (when waiting for employee)
   */
  async pauseTimer(complaintId: string) {
    return this.prisma.sLARecord.update({
      where: { complaintId },
      data: { pausedAt: new Date() },
    });
  }

  /**
   * Resume SLA timer (on reopen)
   */
  async resumeTimer(complaintId: string) {
    const sla = await this.prisma.sLARecord.findUnique({ where: { complaintId } });
    if (!sla || !sla.pausedAt) return sla;

    const pausedDuration = Math.floor((Date.now() - sla.pausedAt.getTime()) / 1000);

    return this.prisma.sLARecord.update({
      where: { complaintId },
      data: {
        pausedAt: null,
        pausedDurationSeconds: sla.pausedDurationSeconds + pausedDuration,
        // Extend deadlines by paused duration
        resolutionDeadline: new Date(sla.resolutionDeadline.getTime() + pausedDuration * 1000),
      },
    });
  }

  /**
   * Get SLA record for a complaint
   */
  async getSLAByComplaint(complaintId: string) {
    const sla = await this.prisma.sLARecord.findUnique({
      where: { complaintId },
      include: { complaint: { select: { id: true, status: true, priority: true } } },
    });
    if (!sla) throw new NotFoundException('SLA record not found');

    // Calculate remaining time
    const now = Date.now();
    const responseRemaining = Math.max(0, sla.responseDeadline.getTime() - now);
    const resolutionRemaining = Math.max(0, sla.resolutionDeadline.getTime() - now);
    const config = DEFAULT_SLA_CONFIG[sla.priority] || DEFAULT_SLA_CONFIG.MEDIUM;

    return {
      ...sla,
      responseRemainingMs: sla.firstResponseAt ? 0 : responseRemaining,
      resolutionRemainingMs: sla.resolvedAt ? 0 : resolutionRemaining,
      responsePercentRemaining: sla.firstResponseAt ? 100 : Math.round((responseRemaining / (config.responseHours * 3600000)) * 100),
      resolutionPercentRemaining: sla.resolvedAt ? 100 : Math.round((resolutionRemaining / (config.resolutionHours * 3600000)) * 100),
    };
  }

  /**
   * Get SLA configuration
   */
  getConfig() {
    return DEFAULT_SLA_CONFIG;
  }

  /**
   * Check for SLA breaches and approaching deadlines
   */
  async checkBreaches(): Promise<{
    breached: { complaintId: string; type: string; priority: string }[];
    warnings: { complaintId: string; type: string; percentRemaining: number; priority: string }[];
  }> {
    const now = new Date();
    const activeSLAs = await this.prisma.sLARecord.findMany({
      where: {
        resolvedAt: null,
        pausedAt: null,
        complaint: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
      },
      include: { complaint: { select: { id: true, status: true, priority: true, escalationLevel: true } } },
    });

    const breached: { complaintId: string; type: string; priority: string }[] = [];
    const warnings: { complaintId: string; type: string; percentRemaining: number; priority: string }[] = [];

    for (const sla of activeSLAs) {
      const config = DEFAULT_SLA_CONFIG[sla.priority] || DEFAULT_SLA_CONFIG.MEDIUM;

      // Response breach check
      if (!sla.firstResponseAt && !sla.isResponseBreached && now > sla.responseDeadline) {
        breached.push({ complaintId: sla.complaintId, type: 'RESPONSE', priority: sla.priority });
        await this.prisma.sLARecord.update({
          where: { id: sla.id },
          data: { isResponseBreached: true, responseBreachedAt: now },
        });
      }

      // Resolution breach check
      if (!sla.isResolutionBreached && now > sla.resolutionDeadline) {
        breached.push({ complaintId: sla.complaintId, type: 'RESOLUTION', priority: sla.priority });
        await this.prisma.sLARecord.update({
          where: { id: sla.id },
          data: { isResolutionBreached: true, resolutionBreachedAt: now },
        });
      }

      // Warning check (approaching escalation threshold)
      if (!sla.isResolutionBreached) {
        const totalMs = config.resolutionHours * 3600000;
        const remaining = sla.resolutionDeadline.getTime() - now.getTime();
        const percentRemaining = Math.round((remaining / totalMs) * 100);

        if (percentRemaining <= (100 - config.escalationPercent) && percentRemaining > 0) {
          warnings.push({ complaintId: sla.complaintId, type: 'RESOLUTION_WARNING', percentRemaining, priority: sla.priority });
        }
      }
    }

    return { breached, warnings };
  }

  /**
   * SLA Performance Report
   */
  async getPerformanceReport() {
    const allSLAs = await this.prisma.sLARecord.findMany({
      include: {
        complaint: {
          select: { id: true, status: true, priority: true },
          include: {
            assignments: { where: { isActive: true }, include: { team: { select: { name: true } } } },
          },
        },
      },
    });

    const total = allSLAs.length;
    const responseBreaches = allSLAs.filter((s) => s.isResponseBreached).length;
    const resolutionBreaches = allSLAs.filter((s) => s.isResolutionBreached).length;

    // Avg response time
    const responded = allSLAs.filter((s) => s.firstResponseAt);
    const avgResponseMs = responded.length > 0
      ? responded.reduce((sum, s) => sum + (s.firstResponseAt!.getTime() - s.createdAt.getTime()), 0) / responded.length
      : 0;

    // Avg resolution time
    const resolved = allSLAs.filter((s) => s.resolvedAt);
    const avgResolutionMs = resolved.length > 0
      ? resolved.reduce((sum, s) => sum + (s.resolvedAt!.getTime() - s.createdAt.getTime()), 0) / resolved.length
      : 0;

    return {
      total,
      responseBreachRate: total > 0 ? Math.round((responseBreaches / total) * 100) : 0,
      resolutionBreachRate: total > 0 ? Math.round((resolutionBreaches / total) * 100) : 0,
      avgResponseTimeHours: Math.round(avgResponseMs / 3600000 * 10) / 10,
      avgResolutionTimeHours: Math.round(avgResolutionMs / 3600000 * 10) / 10,
      byPriority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => {
        const pSLAs = allSLAs.filter((s) => s.priority === p);
        return {
          priority: p,
          total: pSLAs.length,
          breached: pSLAs.filter((s) => s.isResolutionBreached).length,
          target: DEFAULT_SLA_CONFIG[p]?.resolutionHours || 0,
        };
      }),
    };
  }
}
