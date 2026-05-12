import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

// Status transition map — enforced server-side
const VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['AI_PROCESSING'],
  AI_PROCESSING: ['AI_RESPONDED'],
  AI_RESPONDED: ['HUMAN_TEAM_ASSIGNED'],
  HUMAN_TEAM_ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_FOR_EMPLOYEE', 'ESCALATED'],
  WAITING_FOR_EMPLOYEE: ['RESOLVED', 'REOPENED', 'CLOSED'],
  ESCALATED: ['IN_PROGRESS', 'HUMAN_TEAM_ASSIGNED'],
  REOPENED: ['IN_PROGRESS'],
  // Terminal states
  RESOLVED: [],
  CLOSED: [],
};

@Injectable()
export class ResolutionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate status transition
   */
  validateTransition(fromStatus: string, toStatus: string): boolean {
    const allowed = VALID_TRANSITIONS[fromStatus];
    if (!allowed) return false;
    return allowed.includes(toStatus);
  }

  /**
   * Team submits a solution — transitions to WAITING_FOR_EMPLOYEE
   */
  async submitSolution(complaintId: string, submittedById: string, solution: string, note?: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (!this.validateTransition(complaint.status, 'WAITING_FOR_EMPLOYEE')) {
      throw new BadRequestException(
        `Cannot submit solution: transition from "${complaint.status}" to "WAITING_FOR_EMPLOYEE" is not permitted`
      );
    }

    // Set confirmation deadline (72 hours from now)
    const confirmationDeadline = new Date(Date.now() + 72 * 3600000);

    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'WAITING_FOR_EMPLOYEE',
        aiResolution: solution,
        confirmationDeadline,
      },
    });

    // Log status change
    await this.prisma.resolutionHistory.create({
      data: {
        complaintId,
        fromStatus: complaint.status,
        toStatus: 'WAITING_FOR_EMPLOYEE',
        note: note || 'Solution submitted — awaiting employee confirmation',
        changedById: submittedById,
      },
    });

    // Create notification for employee
    await this.prisma.notification.create({
      data: {
        userId: complaint.authorId,
        type: 'RESOLUTION_PENDING',
        title: 'Solution Submitted for Your Complaint',
        body: 'A team member has submitted a solution. Please review and confirm within 72 hours.',
        link: `/dashboard/complaints/${complaintId}`,
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: submittedById,
        action: 'SOLUTION_SUBMITTED',
        entity: 'Complaint',
        entityId: complaintId,
        details: JSON.stringify({ solution: solution.slice(0, 200) }),
      },
    });

    return updated;
  }

  /**
   * Employee confirms/rejects resolution
   */
  async confirmResolution(
    complaintId: string,
    employeeId: string,
    decision: string,
    satisfactionRating?: number,
    professionalismRating?: string,
    comment?: string,
    reopenReason?: string,
  ) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (complaint.authorId !== employeeId) {
      throw new BadRequestException('Only the complaint author can confirm resolution');
    }

    if (complaint.status !== 'WAITING_FOR_EMPLOYEE') {
      throw new BadRequestException('Complaint is not waiting for employee confirmation');
    }

    // Count existing confirmations for attempt number
    const existingConfirmations = await this.prisma.resolutionConfirmation.count({
      where: { complaintId },
    });

    // Create confirmation record
    const confirmation = await this.prisma.resolutionConfirmation.create({
      data: {
        complaintId,
        employeeId,
        decision,
        satisfactionRating,
        professionalismRating,
        comment,
        reopenReason,
        attemptNumber: existingConfirmations + 1,
      },
    });

    let newStatus: string;
    let statusNote: string;

    switch (decision) {
      case 'ACCEPTED':
        newStatus = 'RESOLVED';
        statusNote = `Employee accepted resolution${satisfactionRating ? ` (${satisfactionRating}/5 stars)` : ''}`;
        break;
      case 'REJECTED':
        newStatus = 'REOPENED';
        statusNote = `Employee rejected resolution: ${reopenReason || 'No reason given'}`;
        break;
      case 'FURTHER_HELP':
        newStatus = 'REOPENED';
        statusNote = `Employee requested further help: ${comment || 'No details provided'}`;
        break;
      default:
        throw new BadRequestException('Invalid decision. Must be ACCEPTED, REJECTED, or FURTHER_HELP');
    }

    // Update complaint
    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: newStatus,
        reopenCount: decision !== 'ACCEPTED' ? complaint.reopenCount + 1 : complaint.reopenCount,
        resolvedAt: decision === 'ACCEPTED' ? new Date() : undefined,
        confirmationDeadline: null,
      },
    });

    // Log status change
    await this.prisma.resolutionHistory.create({
      data: {
        complaintId,
        fromStatus: 'WAITING_FOR_EMPLOYEE',
        toStatus: newStatus,
        note: statusNote,
        changedById: employeeId,
      },
    });

    // Auto-escalate if reopened 3+ times
    if (updated.reopenCount >= 3 && decision !== 'ACCEPTED') {
      await this.prisma.escalation.create({
        data: {
          complaintId,
          fromLevel: complaint.escalationLevel,
          toLevel: Math.min(complaint.escalationLevel + 1, 5),
          reason: `Complaint reopened ${updated.reopenCount} times — auto-escalated`,
          triggeredBy: 'REOPEN_LIMIT',
        },
      });

      await this.prisma.complaint.update({
        where: { id: complaintId },
        data: { escalationLevel: Math.min(complaint.escalationLevel + 1, 5) },
      });
    }

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: employeeId,
        action: 'RESOLUTION_CONFIRMED',
        entity: 'Complaint',
        entityId: complaintId,
        details: JSON.stringify({ decision, satisfactionRating, reopenReason }),
      },
    });

    return { complaint: updated, confirmation };
  }

  /**
   * Get confirmation history for a complaint
   */
  async getConfirmations(complaintId: string) {
    return this.prisma.resolutionConfirmation.findMany({
      where: { complaintId },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { decidedAt: 'desc' },
    });
  }

  /**
   * Resolution quality analytics
   */
  async getQualityMetrics() {
    const confirmations = await this.prisma.resolutionConfirmation.findMany({
      include: {
        complaint: {
          include: {
            assignments: { include: { team: { select: { name: true } } } },
            feedback: { select: { category: true } },
          },
        },
      },
    });

    const total = confirmations.length;
    const accepted = confirmations.filter((c) => c.decision === 'ACCEPTED');
    const rejected = confirmations.filter((c) => c.decision === 'REJECTED');

    // Average satisfaction
    const rated = accepted.filter((c) => c.satisfactionRating);
    const avgSatisfaction = rated.length > 0
      ? Math.round((rated.reduce((sum, c) => sum + (c.satisfactionRating || 0), 0) / rated.length) * 10) / 10
      : 0;

    // First-attempt acceptance rate
    const firstAttempt = confirmations.filter((c) => c.attemptNumber === 1);
    const firstAccepted = firstAttempt.filter((c) => c.decision === 'ACCEPTED');
    const firstAttemptRate = firstAttempt.length > 0
      ? Math.round((firstAccepted.length / firstAttempt.length) * 100) : 0;

    // Professionalism ratings
    const profRatings = accepted.filter((c) => c.professionalismRating);
    const profYes = profRatings.filter((c) => c.professionalismRating === 'YES').length;
    const profSomewhat = profRatings.filter((c) => c.professionalismRating === 'SOMEWHAT').length;
    const profNo = profRatings.filter((c) => c.professionalismRating === 'NO').length;

    // Reopen rate by team
    const reopenByTeam: Record<string, { total: number; reopened: number }> = {};
    confirmations.forEach((c) => {
      const teamName = c.complaint?.assignments?.[0]?.team?.name || 'Unassigned';
      if (!reopenByTeam[teamName]) reopenByTeam[teamName] = { total: 0, reopened: 0 };
      reopenByTeam[teamName].total++;
      if (c.decision === 'REJECTED' || c.decision === 'FURTHER_HELP') reopenByTeam[teamName].reopened++;
    });

    return {
      total,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      acceptanceRate: total > 0 ? Math.round((accepted.length / total) * 100) : 0,
      firstAttemptAcceptanceRate: firstAttemptRate,
      avgSatisfaction,
      professionalism: {
        yes: profYes,
        somewhat: profSomewhat,
        no: profNo,
        total: profRatings.length,
      },
      reopenByTeam: Object.entries(reopenByTeam).map(([team, data]) => ({
        team,
        total: data.total,
        reopened: data.reopened,
        reopenRate: Math.round((data.reopened / Math.max(data.total, 1)) * 100),
      })),
    };
  }
}
