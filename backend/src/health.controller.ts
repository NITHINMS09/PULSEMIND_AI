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
        lastName: 'Demo',
        employeeId: 'EMP-ADMIN-001',
        role: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE',
        organizationId: org.id,
        departmentId: dept.id,
      },
    });

    // Create default teams if none exist
    const teamCount = await this.prisma.team.count();
    if (teamCount === 0) {
      await this.prisma.team.createMany({
        data: [
          { name: 'Technical Support', type: 'TECHNICAL', organizationId: org.id, leadId: admin.id, maxCapacity: 10 },
          { name: 'Human Resources', type: 'HR', organizationId: org.id, leadId: admin.id, maxCapacity: 5 },
          { name: 'Customer Service', type: 'SERVICE', organizationId: org.id, leadId: admin.id, maxCapacity: 15 },
        ],
      });
    }

    return {
      message: 'Bootstrap complete',
      admin: { id: admin.id, email: admin.email, role: admin.role, status: admin.accountStatus },
      teamsCreated: teamCount === 0 ? 3 : 0,
    };
  }
}
