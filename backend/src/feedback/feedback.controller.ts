import {
  Controller, Get, Post, Patch, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit new feedback' })
  create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.feedbackService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List feedback' })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('departmentId') departmentId?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feedbackService.findAll(user.id, user.role, {
      status, category, departmentId, priority, page, limit,
    });
  }

  @Get('anonymous/:trackingId')
  @ApiOperation({ summary: 'Track anonymous feedback' })
  trackAnonymous(@Param('trackingId') trackingId: string) {
    return this.feedbackService.findByAnonymousId(trackingId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feedback detail' })
  findOne(@Param('id') id: string) {
    return this.feedbackService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update feedback status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.feedbackService.updateStatus(id, status);
  }

  @Post('ai-preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI analysis preview' })
  aiPreview(@Body('content') content: string) {
    return this.feedbackService.aiPreview(content);
  }
}
