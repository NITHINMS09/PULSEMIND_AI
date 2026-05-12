import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { DepartmentsModule } from './departments/departments.module';
import { GamificationModule } from './gamification/gamification.module';
import { GatewayModule } from './gateway/gateway.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { TeamsModule } from './teams/teams.module';
import { RoutingModule } from './routing/routing.module';
import { SlaModule } from './sla/sla.module';
import { EscalationModule } from './escalation/escalation.module';
import { ResolutionModule } from './resolution/resolution.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate limiting: 100 requests per 15 minutes
    ThrottlerModule.forRoot([{
      ttl: 900000,
      limit: 100,
    }]),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Core modules
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    FeedbackModule,
    ComplaintsModule,
    AnalyticsModule,
    AiModule,
    NotificationsModule,
    ChatModule,
    AdminModule,
    DepartmentsModule,
    GamificationModule,
    GatewayModule,

    // Phase 2 modules
    TeamsModule,
    RoutingModule,
    SlaModule,
    EscalationModule,
    ResolutionModule,
  ],
})
export class AppModule {}
