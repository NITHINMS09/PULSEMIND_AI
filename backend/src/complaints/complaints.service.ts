import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List complaints — admin/team sees all, employee sees own
   */
  async findAll(userId: string, role: string, params?: {
    status?: string;
    priority?: string;
    departmentId?: string;
    assigneeId?: string;
  }) {
    const where: any = {};

    // Employees only see their own complaints
    if (role === 'EMPLOYEE') {
      where.authorId = userId;
    }

    if (params?.status) where.status = params.status;
    if (params?.priority) where.priority = params.priority;
    if (params?.assigneeId) where.assigneeId = params.assigneeId;
    if (params?.departmentId) {
      where.feedback = { departmentId: params.departmentId };
    }

    const complaints = await this.prisma.complaint.findMany({
      where,
      include: {
        feedback: {
          select: {
            id: true, title: true, category: true, content: true,
            departmentId: true, isAnonymous: true, priority: true,
            department: { select: { id: true, name: true } },
            aiAnalysis: true,
          },
        },
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        slaRecord: { select: { responseDeadline: true, resolutionDeadline: true, isResolutionBreached: true } },
        assignments: {
          where: { isActive: true },
          include: { team: { select: { name: true, type: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask author identity for anonymous complaints when viewed by non-owner
    return complaints.map(c => {
      if (c.feedback?.isAnonymous && c.authorId !== userId) {
        return {
          ...c,
          author: { id: 'anonymous', firstName: 'Anonymous', lastName: 'User', avatar: null, email: null },
        };
      }
      return c;
    });
  }

  /**
   * Get complaint by ID with full details
   */
  async findById(id: string, userId?: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        feedback: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            department: true,
            aiAnalysis: true,
            emotionScores: true,
            confidenceScore: true,
          },
        },
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        resolutionHistory: { orderBy: { createdAt: 'desc' }, include: { changedBy: { select: { firstName: true, lastName: true } } } },
        slaRecord: true,
        escalations: { orderBy: { createdAt: 'desc' } },
        confirmations: { orderBy: { decidedAt: 'desc' } },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, firstName: true, lastName: true } } },
          take: 50,
        },
        assignments: {
          include: { team: { select: { name: true, type: true } }, assignee: { select: { firstName: true, lastName: true } } },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');

    // Mask anonymous user info
    if (complaint.feedback?.isAnonymous && userId && complaint.authorId !== userId) {
      return {
        ...complaint,
        author: { id: 'anonymous', firstName: 'Anonymous', lastName: 'User', avatar: null },
        feedback: {
          ...complaint.feedback,
          user: null, // hide real user from anonymous feedback
        },
      };
    }

    return complaint;
  }

  /**
   * Get user's own complaints (for employee dashboard)
   */
  async findByUser(userId: string) {
    const complaints = await this.prisma.complaint.findMany({
      where: { authorId: userId },
      include: {
        feedback: {
          select: {
            id: true, title: true, category: true, content: true, isAnonymous: true,
            anonymousTrackingId: true, priority: true,
            aiAnalysis: { select: { summary: true, emotion: true, urgency: true } },
            department: { select: { name: true } },
          },
        },
        assignee: { select: { firstName: true, lastName: true } },
        slaRecord: { select: { responseDeadline: true, resolutionDeadline: true, isResolutionBreached: true } },
        assignments: {
          where: { isActive: true },
          include: { team: { select: { name: true, type: true } } },
          take: 1,
        },
        resolutionHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
        confirmations: { orderBy: { decidedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return complaints;
  }

  /**
   * Assign complaint to team member
   */
  async assign(id: string, assigneeId: string, changedById: string) {
    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        assigneeId,
        status: 'IN_PROGRESS',
      },
    });

    await this.prisma.resolutionHistory.create({
      data: {
        complaintId: id,
        fromStatus: 'SUBMITTED',
        toStatus: 'IN_PROGRESS',
        note: 'Assigned to team member',
        changedById,
      },
    });

    // Notify the employee
    const fullComplaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { feedback: { select: { title: true, isAnonymous: true } } },
    });
    if (fullComplaint && !fullComplaint.feedback?.isAnonymous) {
      await this.prisma.notification.create({
        data: {
          userId: fullComplaint.authorId,
          type: 'COMPLAINT_ASSIGNED',
          title: '🔄 Complaint Assigned',
          body: `Your complaint "${fullComplaint.feedback?.title}" has been assigned to a team.`,
          link: `/dashboard/complaints/${id}`,
        },
      });
    }

    this.logger.log(`Complaint ${id} assigned to ${assigneeId}`);
    return complaint;
  }

  /**
   * Submit solution — status becomes WAITING_FOR_EMPLOYEE (NOT resolved directly)
   */
  async submitSolution(id: string, solution: string, changedById: string) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Complaint not found');

    // Set confirmation deadline (72 hours from now)
    const confirmationDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'WAITING_FOR_EMPLOYEE',
        aiResolution: solution,
        confirmationDeadline,
      },
    });

    await this.prisma.feedback.update({
      where: { id: complaint.feedbackId },
      data: { status: 'WAITING_FOR_EMPLOYEE' },
    });

    await this.prisma.resolutionHistory.create({
      data: {
        complaintId: id,
        fromStatus: existing.status,
        toStatus: 'WAITING_FOR_EMPLOYEE',
        note: `Solution submitted: ${solution.substring(0, 200)}`,
        changedById,
      },
    });

    // Notify the employee
    if (existing.authorId && existing.authorId !== 'system') {
      await this.prisma.notification.create({
        data: {
          userId: existing.authorId,
          type: 'RESOLUTION_PENDING',
          title: '📋 Solution Ready for Review',
          body: 'A solution has been submitted for your complaint. Please review and confirm.',
          link: `/dashboard/complaints/${id}`,
        },
      });
    }

    this.logger.log(`Solution submitted for complaint ${id}`);
    return complaint;
  }

  /**
   * Employee confirms resolution (accept/reject)
   */
  async confirmResolution(id: string, userId: string, decision: 'ACCEPTED' | 'REJECTED' | 'FURTHER_HELP', comment?: string) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Complaint not found');

    if (decision === 'ACCEPTED') {
      await this.prisma.complaint.update({
        where: { id },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
      await this.prisma.feedback.update({
        where: { id: existing.feedbackId },
        data: { status: 'RESOLVED' },
      });
    } else {
      // Rejected or needs further help — reopen
      const newReopenCount = existing.reopenCount + 1;
      const newStatus = newReopenCount >= 3 ? 'ESCALATED' : 'REOPENED';
      await this.prisma.complaint.update({
        where: { id },
        data: {
          status: newStatus,
          reopenCount: newReopenCount,
          confirmationDeadline: null,
          escalationLevel: newReopenCount >= 3 ? existing.escalationLevel + 1 : existing.escalationLevel,
        },
      });
    }

    // Save confirmation record
    await this.prisma.resolutionConfirmation.create({
      data: {
        complaintId: id,
        employeeId: userId,
        decision,
        comment,
        attemptNumber: existing.reopenCount + 1,
      },
    });

    await this.prisma.resolutionHistory.create({
      data: {
        complaintId: id,
        fromStatus: existing.status,
        toStatus: decision === 'ACCEPTED' ? 'RESOLVED' : 'REOPENED',
        note: `Employee ${decision}: ${comment || ''}`,
        changedById: userId,
      },
    });

    return { message: `Complaint ${decision.toLowerCase()}` };
  }

  /**
   * Escalate complaint
   */
  async escalate(id: string, changedById: string) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Complaint not found');

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'ESCALATED',
        escalationLevel: existing.escalationLevel + 1,
      },
    });

    await this.prisma.feedback.update({
      where: { id: complaint.feedbackId },
      data: { status: 'ESCALATED' },
    });

    await this.prisma.resolutionHistory.create({
      data: {
        complaintId: id,
        fromStatus: existing.status,
        toStatus: 'ESCALATED',
        note: `Escalated to level ${complaint.escalationLevel}`,
        changedById,
      },
    });

    return complaint;
  }

  /**
   * Kanban view for admin
   */
  async getKanbanView() {
    const statuses = ['SUBMITTED', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'ESCALATED', 'REOPENED', 'RESOLVED'];
    const result: Record<string, any[]> = {};

    for (const status of statuses) {
      const complaints = await this.prisma.complaint.findMany({
        where: { status },
        include: {
          feedback: {
            select: { id: true, title: true, category: true, priority: true, isAnonymous: true,
              department: { select: { name: true } },
              aiAnalysis: { select: { summary: true } },
            },
          },
          author: { select: { firstName: true, lastName: true, avatar: true } },
          assignee: { select: { firstName: true, lastName: true, avatar: true } },
          assignments: { where: { isActive: true }, include: { team: { select: { name: true } } }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Mask anonymous authors
      result[status] = complaints.map(c => {
        if (c.feedback?.isAnonymous) {
          return { ...c, author: { firstName: 'Anonymous', lastName: 'User', avatar: null } };
        }
        return c;
      });
    }

    return result;
  }

  /**
   * Get dashboard stats
   */
  async getStats() {
    const [total, submitted, inProgress, waiting, escalated, resolved] = await Promise.all([
      this.prisma.complaint.count(),
      this.prisma.complaint.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.complaint.count({ where: { status: 'WAITING_FOR_EMPLOYEE' } }),
      this.prisma.complaint.count({ where: { status: 'ESCALATED' } }),
      this.prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    ]);

    return { total, submitted, inProgress, waiting, escalated, resolved };
  }
}
