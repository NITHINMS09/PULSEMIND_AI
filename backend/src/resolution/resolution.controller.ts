import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ResolutionService } from './resolution.service';
import { SubmitSolutionDto, ConfirmResolutionDto } from './dto/resolution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResolutionController {
  constructor(private resolutionService: ResolutionService) {}

  @Post(':id/solution')
  submitSolution(
    @Param('id') id: string,
    @Body() dto: SubmitSolutionDto,
    @CurrentUser() user: any,
  ) {
    return this.resolutionService.submitSolution(id, user.id, dto.solution, dto.note);
  }

  @Post(':id/confirm')
  confirmResolution(
    @Param('id') id: string,
    @Body() dto: ConfirmResolutionDto,
    @CurrentUser() user: any,
  ) {
    return this.resolutionService.confirmResolution(
      id, user.id, dto.decision, dto.satisfactionRating,
      dto.professionalismRating, dto.comment, dto.reopenReason,
    );
  }

  @Get(':id/confirmations')
  getConfirmations(@Param('id') id: string) {
    return this.resolutionService.getConfirmations(id);
  }
}
