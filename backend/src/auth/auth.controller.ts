import {
  Controller, Post, Get, Body, Res, Req,
  UseGuards, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDto, LoginDto, ApproveUserDto, RejectUserDto, SuspendUserDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (pending approval)' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.email, dto.password);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const { JwtService } = await import('@nestjs/jwt');
    const jwtService = new JwtService();

    try {
      const payload = jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'pulsemind-dev-refresh-secret-change-in-production',
      });

      const tokens = await this.authService.refreshTokens(payload.sub, refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return { accessToken: tokens.accessToken };
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  async logout(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(userId);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  // ============================================
  // Admin Approval Endpoints
  // ============================================

  @Get('pending-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending users' })
  async getPendingUsers() {
    return this.authService.getPendingUsers();
  }

  @Get('all-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with status' })
  async getAllUsers(@Query('status') status?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.authService.getAllUsersWithStatus({ status, page, limit });
  }

  @Post('approve-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a pending user' })
  async approveUser(@Body() dto: ApproveUserDto, @CurrentUser('id') adminId: string) {
    return this.authService.approveUser(dto.userId, adminId);
  }

  @Post('reject-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a pending user' })
  async rejectUser(@Body() dto: RejectUserDto, @CurrentUser('id') adminId: string) {
    return this.authService.rejectUser(dto.userId, adminId, dto.reason);
  }

  @Post('suspend-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend an active user' })
  async suspendUser(@Body() dto: SuspendUserDto, @CurrentUser('id') adminId: string) {
    return this.authService.suspendUser(dto.userId, adminId, dto.reason);
  }

  @Post('activate-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'HR_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate a suspended/rejected user' })
  async activateUser(@Body() dto: ApproveUserDto, @CurrentUser('id') adminId: string) {
    return this.authService.activateUser(dto.userId, adminId);
  }
}
