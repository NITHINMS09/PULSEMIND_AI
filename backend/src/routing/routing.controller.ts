import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { AnalyzeRoutingDto, CreateRoutingRuleDto, UpdateRoutingRuleDto } from './dto/routing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('routing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutingController {
  constructor(private routingService: RoutingService) {}

  @Post('analyze')
  analyze(@Body() dto: AnalyzeRoutingDto) {
    return this.routingService.analyzeRouting(dto.text, dto.category, dto.priority);
  }

  @Post('test')
  @Roles('SUPER_ADMIN')
  testRouting(@Body() dto: AnalyzeRoutingDto) {
    return this.routingService.testRouting(dto.text);
  }

  @Get('rules')
  @Roles('SUPER_ADMIN')
  findAllRules() {
    return this.routingService.findAllRules();
  }

  @Post('rules')
  @Roles('SUPER_ADMIN')
  createRule(@Body() dto: CreateRoutingRuleDto) {
    return this.routingService.createRule(dto);
  }

  @Put('rules/:id')
  @Roles('SUPER_ADMIN')
  updateRule(@Param('id') id: string, @Body() dto: UpdateRoutingRuleDto) {
    return this.routingService.updateRule(id, dto);
  }

  @Delete('rules/:id')
  @Roles('SUPER_ADMIN')
  deleteRule(@Param('id') id: string) {
    return this.routingService.deleteRule(id);
  }
}
