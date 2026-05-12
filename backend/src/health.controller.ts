import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './common/prisma/prisma.service';
import * as argon2 from 'argon2';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    };
  }

  @Post('bootstrap')
  @ApiOperation({ summary: 'Bootstrap demo admin (one-time setup)' })
  async bootstrap() {
    const email = 'admin@demo.pulsemind.ai';
    const password = await argon2.hash('Demo@2024!');

    // Check if org exists, create if not
    let org = await this.prisma.organization.findFirst();
    if (!org) {
      org = await this.prisma.organization.create({
        data: {
          name: 'Innovex Technologies',
          slug: 'innovex',
          industry: 'Technology',
          size: '200-500',
        },
      });
    }

    // Check if department exists, create if not
    let dept = await this.prisma.department.findFirst();
    if (!dept) {
      dept = await this.prisma.department.create({
        data: {
          name: 'Administration',
          organizationId: org.id,
        },
      });
    }

    // Upsert the admin user
    const admin = await this.prisma.user.upsert({
      where: { email },
      update: {
        password,
        role: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE',
        organizationId: org.id,
        departmentId: dept.id,
      },
      create: {
        email,
        password,
        firstName: 'Admin',
        lastName: 'Test',
        employeeId: 'EMP-ADMIN-001',
        role: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE',
        organizationId: org.id,
        departmentId: dept.id,
      },
    });

    // Create default teams if they don't exist
    const teamTypes = [
      { name: 'Technical Support', type: 'TECHNICAL' },
      { name: 'HR Resolution', type: 'HR' },
      { name: 'Service Desk', type: 'SERVICE' },
      { name: 'Infrastructure Ops', type: 'INFRASTRUCTURE' },
      { name: 'Management Review', type: 'MANAGEMENT' },
    ];

    const teams = [];
    for (const teamData of teamTypes) {
      let team = await this.prisma.team.findFirst({
        where: { type: teamData.type, organizationId: org.id }
      });
      if (!team) {
        team = await this.prisma.team.create({
          data: {
            ...teamData,
            organizationId: org.id,
            maxCapacity: 20,
            isActive: true,
          }
        });
      }
      teams.push(team);
    }

    return {
      message: 'Bootstrap complete',
      admin: { id: admin.id, email: admin.email, role: admin.role, status: admin.accountStatus },
      teamsCreated: teams.length,
    };
  }
}
