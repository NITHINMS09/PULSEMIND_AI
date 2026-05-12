import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SlaService } from './sla.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SlaCronService {
  private readonly logger = new Logger(SlaCronService.name);

  constructor(
    private slaService: SlaService,
    private prisma: PrismaService,
  ) {}

  /**
   * Run every 5 minutes: check for SLA breaches and trigger auto-escalation
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSLACheck() {
    this.logger.log('Running SLA breach check...');

    try {
      const { breached, warnings } = await this.slaService.checkBreaches();

      // Handle breaches — trigger auto-escalation
      for (const breach of breached) {
        this.logger.warn(`SLA ${breach.type} breached for complaint ${breach.complaintId} (${breach.priority})`);

        // Auto-escalate on breach
        const complaint = await this.prisma.complaint.findUnique({
          where: { id: breach.complaintId },
          select: { id: true, escalationLevel: true, assigneeId: true, priority: true },
        });

        if (complaint && complaint.escalationLevel < 5) {
          // Upgrade priority on escalation
          const priorityUpgrade: Record<string, string> = { LOW: 'MEDIUM', MEDIUM: 'HIGH', HIGH: 'CRITICAL' };
          const newPriority = priorityUpgrade[complaint.priority] || complaint.priority;

          await this.prisma.complaint.update({
            where: { id: breach.complaintId },
            data: {
              escalationLevel: complaint.escalationLevel + 1,
              status: 'ESCALATED',
              priority: newPriority,
            },
          });

          // Log escalation
          await this.prisma.escalation.create({
            data: {
              complaintId: breach.complaintId,
              fromLevel: complaint.escalationLevel,
              toLevel: complaint.escalationLevel + 1,
              reason: `SLA ${breach.type} breach — auto-escalated`,
              triggeredBy: 'SLA_AUTO',
              fromUserId: complaint.assigneeId,
            },
          });

          // Create notification for admin
          await this.prisma.notification.create({
            data: {
              userId: complaint.assigneeId || 'system',
              type: 'SLA_BREACH',
              title: 'SLA Breach — Auto-Escalated',
              body: `Complaint has been auto-escalated to level ${complaint.escalationLevel + 1} due to ${breach.type} SLA breach.`,
              link: `/admin/complaints`,
            },
          });
        }
      }

      // Handle warnings — send notifications
      for (const warning of warnings) {
        this.logger.log(`SLA warning for complaint ${warning.complaintId}: ${warning.percentRemaining}% remaining`);
      }

      // Check for auto-close (72h confirmation deadline expired)
      await this.checkConfirmationDeadlines();

      if (breached.length > 0 || warnings.length > 0) {
        this.logger.log(`SLA check complete: ${breached.length} breaches, ${warnings.length} warnings`);
      }
    } catch (error) {
      this.logger.error('SLA check failed:', error);
    }
  }

  /**
   * Auto-close complaints where confirmation deadline has expired (72h)
   */
  private async checkConfirmationDeadlines() {
    const now = new Date();
    const expired = await this.prisma.complaint.findMany({
      where: {
        status: 'WAITING_FOR_EMPLOYEE',
        confirmationDeadline: { lt: now },
      },
    });

    for (const complaint of expired) {
      await this.prisma.complaint.update({
        where: { id: complaint.id },
        data: {
          status: 'CLOSED',
          closedAt: now,
        },
      });

      await this.prisma.resolutionHistory.create({
        data: {
          complaintId: complaint.id,
          fromStatus: 'WAITING_FOR_EMPLOYEE',
          toStatus: 'CLOSED',
          note: 'Auto-closed — no employee response within 72 hours',
          changedById: 'system',
        },
      });

      this.logger.log(`Auto-closed complaint ${complaint.id} — confirmation deadline expired`);
    }
  }
}
