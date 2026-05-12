import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const teams = await this.prisma.team.findMany({
      where: { isActive: true },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } },
        },
        assignments: { where: { isActive: true }, select: { id: true } },
        routingRules: { where: { isActive: true }, select: { id: true, name: true, keywords: true } },
      },
    });

    return teams.map((t) => ({
      ...t,
      memberCount: t.members.length,
      activeComplaints: t.assignments.length,
      routingRuleCount: t.routingRules.length,
    }));
  }

  async findById(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true, email: true, role: true },
            },
          },
        },
        assignments: {
          where: { isActive: true },
          include: {
            complaint: {
              include: {
                feedback: { select: { id: true, title: true, category: true, priority: true } },
                author: { select: { id: true, firstName: true, lastName: true } },
                slaRecord: true,
              },
            },
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
        routingRules: { orderBy: { priority: 'asc' } },
      },
    });

    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async create(dto: {
    name: string; type: string; organizationId: string;
    leadId?: string; maxCapacity?: number;
    operatingHoursStart?: string; operatingHoursEnd?: string; timezone?: string;
  }) {
    return this.prisma.team.create({ data: dto });
  }

  async update(id: string, dto: Partial<{
    name: string; type: string; leadId: string; maxCapacity: number;
    isActive: boolean; operatingHoursStart: string; operatingHoursEnd: string; timezone: string;
  }>) {
    return this.prisma.team.update({ where: { id }, data: dto });
  }

  async getTeamComplaints(teamId: string, params?: { status?: string; priority?: string }) {
    const where: any = { teamId, isActive: true };

    const assignments = await this.prisma.complaintAssignment.findMany({
      where,
      include: {
        complaint: {
          include: {
            feedback: {
              select: {
                id: true, title: true, category: true, content: true,
                department: { select: { name: true } },
                aiAnalysis: true,
              },
            },
            author: { select: { id: true, firstName: true, lastName: true, avatar: true, employeeId: true, departmentId: true } },
            assignee: { select: { id: true, firstName: true, lastName: true } },
            slaRecord: true,
            escalations: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });

    // Filter by complaint status/priority in JS (Prisma can't filter on included relations)
    return assignments.filter((a) => {
      if (!a.complaint) return false;
      if (params?.status && a.complaint.status !== params.status) return false;
      if (params?.priority && a.complaint.priority !== params.priority) return false;
      return true;
    });
  }

  async addMember(teamId: string, userId: string, role: string = 'MEMBER') {
    const exists = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (exists) throw new ConflictException('User is already a member of this team');

    return this.prisma.teamMember.create({
      data: { teamId, userId, role },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async removeMember(teamId: string, userId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!member) throw new NotFoundException('Member not found in team');

    return this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
  }

  async setAvailability(teamId: string, memberId: string, status: string) {
    return this.prisma.teamAvailability.upsert({
      where: { teamId_memberId: { teamId, memberId } },
      update: { status },
      create: { teamId, memberId, status },
    });
  }

  async getWorkloadStats() {
    const teams = await this.prisma.team.findMany({
      where: { isActive: true },
      include: {
        members: { select: { id: true, userId: true, assignedCount: true } },
        assignments: {
          where: { isActive: true },
          include: {
            complaint: { select: { status: true, priority: true, createdAt: true } },
          },
        },
      },
    });

    return teams.map((team) => {
      const active = team.assignments.filter((a) => a.complaint &&
        !['RESOLVED', 'CLOSED'].includes(a.complaint.status));
      const critical = active.filter((a) => a.complaint?.priority === 'CRITICAL').length;
      const high = active.filter((a) => a.complaint?.priority === 'HIGH').length;

      return {
        teamId: team.id,
        teamName: team.name,
        type: team.type,
        memberCount: team.members.length,
        maxCapacity: team.maxCapacity,
        activeComplaints: active.length,
        criticalCount: critical,
        highCount: high,
        utilizationPercent: Math.round((active.length / Math.max(team.maxCapacity, 1)) * 100),
      };
    });
  }
}
