import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../common/prisma/prisma.service';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

const ACCOUNT_STATUS = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user — account starts as PENDING_APPROVAL
   */
  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    departmentId?: string;
    jobTitle?: string;
    experienceLevel?: string;
    phone?: string;
    employeeId?: string;
    branch?: string;
    organizationName?: string;
  }) {
    this.logger.log(`Registration attempt: ${dto.email}`);

    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      this.logger.warn(`Duplicate email: ${dto.email}`);
      throw new ConflictException('Email already registered');
    }

    // Check duplicate employee ID if provided
    if (dto.employeeId) {
      const existingEmp = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId },
      });
      if (existingEmp) {
        throw new ConflictException('Employee ID already in use');
      }
    }

    // Hash password
    const hashedPassword = await argon2.hash(dto.password);

    // Generate employee ID if not provided
    const employeeId = dto.employeeId || `EMP-${uuidv4().split('-')[0].toUpperCase()}`;

    // Get default organization
    const org = await this.prisma.organization.findFirst();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        employeeId,
        role: 'EMPLOYEE', // Always EMPLOYEE on registration — admin assigns actual role
        accountStatus: ACCOUNT_STATUS.PENDING_APPROVAL,
        departmentId: dto.departmentId || undefined,
        organizationId: org?.id || undefined,
        jobTitle: dto.jobTitle,
        experienceLevel: dto.experienceLevel,
        phone: dto.phone,
        branch: dto.branch,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        role: true,
        accountStatus: true,
        jobTitle: true,
        branch: true,
        departmentId: true,
        organizationId: true,
        createdAt: true,
      },
    });

    this.logger.log(`User registered (pending approval): ${user.email} [${user.id}]`);

    // Notify all admins about pending user
    await this.notifyAdminsOfPendingUser(user);

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entity: 'auth',
        details: `New account registered: ${user.firstName} ${user.lastName} (${user.email})`,
      },
    });

    return {
      user,
      accountStatus: ACCOUNT_STATUS.PENDING_APPROVAL,
      message: 'Your account has been created and is waiting for organization approval.',
    };
  }

  /**
   * Login with email and password — only APPROVED accounts can login
   */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        department: true,
        organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check account status BEFORE password check (security best practice)
    if (user.accountStatus === ACCOUNT_STATUS.PENDING_APPROVAL) {
      throw new ForbiddenException('Your account is waiting for approval. Please contact your administrator.');
    }
    if (user.accountStatus === ACCOUNT_STATUS.REJECTED) {
      throw new ForbiddenException('Your account has been rejected. Please contact your administrator.');
    }
    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended. Please contact your administrator.');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated. Please contact your administrator.');
    }

    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store refresh token hash
    const refreshHash = await argon2.hash(tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshHash },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'auth',
        details: 'User logged in',
      },
    });

    const { password: _, refreshToken: __, ...safeUser } = user;

    return {
      user: safeUser,
      ...tokens,
    };
  }

  /**
   * Approve a pending user (admin only)
   */
  async approveUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.accountStatus !== ACCOUNT_STATUS.PENDING_APPROVAL) {
      throw new BadRequestException(`User is already ${user.accountStatus}`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: ACCOUNT_STATUS.APPROVED,
        isActive: true,
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    });

    // Notify the user
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'ACCOUNT_APPROVED',
        title: 'Account Approved! 🎉',
        body: 'Your PulseMind AI account has been approved. You can now log in.',
        link: '/login',
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'APPROVE_USER',
        entity: 'admin',
        entityId: userId,
        details: `Approved user: ${user.firstName} ${user.lastName}`,
      },
    });

    this.logger.log(`User approved: ${user.email} by admin ${adminId}`);
    return { message: 'User approved successfully' };
  }

  /**
   * Reject a pending user (admin only)
   */
  async rejectUser(userId: string, adminId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: ACCOUNT_STATUS.REJECTED,
        isActive: false,
        rejectedReason: reason,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'ACCOUNT_REJECTED',
        title: 'Account Rejected',
        body: reason || 'Your account registration has been rejected.',
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'REJECT_USER',
        entity: 'admin',
        entityId: userId,
        details: `Rejected user: ${user.firstName} ${user.lastName}. Reason: ${reason || 'N/A'}`,
      },
    });

    return { message: 'User rejected' };
  }

  /**
   * Suspend an active user (admin only)
   */
  async suspendUser(userId: string, adminId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: ACCOUNT_STATUS.SUSPENDED,
        isActive: false,
        rejectedReason: reason,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'ACCOUNT_SUSPENDED',
        title: 'Account Suspended',
        body: reason || 'Your account has been suspended by an administrator.',
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'SUSPEND_USER',
        entity: 'admin',
        entityId: userId,
        details: `Suspended user: ${user.email}. Reason: ${reason || 'N/A'}`,
      },
    });

    return { message: 'User suspended' };
  }

  /**
   * Reactivate a suspended/rejected user
   */
  async activateUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: ACCOUNT_STATUS.APPROVED,
        isActive: true,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectedReason: null,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'ACCOUNT_APPROVED',
        title: 'Account Reactivated',
        body: 'Your PulseMind AI account has been reactivated. You can now log in.',
        link: '/login',
      },
    });

    return { message: 'User activated' };
  }

  /**
   * Get all pending users (for admin dashboard)
   */
  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: { accountStatus: ACCOUNT_STATUS.PENDING_APPROVAL },
      select: {
        id: true, email: true, firstName: true, lastName: true, employeeId: true,
        phone: true, role: true, accountStatus: true, jobTitle: true, branch: true,
        departmentId: true, department: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all users with their account status (admin view)
   */
  async getAllUsersWithStatus(params?: { status?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (params?.status) where.accountStatus = params.status;

    const page = params?.page || 1;
    const limit = params?.limit || 50;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true, employeeId: true,
          phone: true, avatar: true, role: true, accountStatus: true, jobTitle: true,
          branch: true, isActive: true, lastLogin: true, approvedAt: true,
          departmentId: true, department: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Notify admins of a new pending user
   */
  private async notifyAdminsOfPendingUser(user: { id: string; firstName: string; lastName: string; email: string }) {
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          role: 'SUPER_ADMIN',
          accountStatus: ACCOUNT_STATUS.APPROVED,
        },
        select: { id: true },
      });

      for (const admin of admins) {
        await this.prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PENDING_APPROVAL',
            title: '👤 New User Registration',
            body: `${user.firstName} ${user.lastName} (${user.email}) has registered and is waiting for approval.`,
            link: '/admin/approvals',
          },
        });
      }
    } catch (err) {
      this.logger.error('Failed to notify admins of pending user', err);
    }
  }

  /**
   * Refresh access token
   */
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const tokenValid = await argon2.verify(user.refreshToken, refreshToken);
    if (!tokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Rotate refresh token
    const refreshHash = await argon2.hash(tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshHash },
    });

    return tokens;
  }

  /**
   * Logout — invalidate refresh token
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        entity: 'auth',
        details: 'User logged out',
      },
    });
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        organization: true,
        userBadges: {
          include: { badge: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Generate access + refresh token pair
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload: TokenPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
