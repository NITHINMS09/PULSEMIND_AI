import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalFeedback,
      openComplaints,
      resolvedComplaints,
      totalUsers,
      departments,
      recentFeedback,
      burnoutScores,
    ] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.complaint.count({ where: { status: { in: ['SUBMITTED', 'IN_REVIEW', 'ESCALATED'] } } }),
      this.prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.department.findMany({ select: { id: true, name: true } }),
      this.prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { createdAt: true, status: true, category: true },
      }),
      this.prisma.burnoutScore.findMany({
        orderBy: { createdAt: 'desc' },
        distinct: ['userId'],
        select: { score: true, riskLevel: true },
      }),
    ]);

    const burnoutRiskCount = burnoutScores.filter(
      (b) => b.riskLevel === 'HIGH' || b.riskLevel === 'CRITICAL'
    ).length;

    const avgWellness = burnoutScores.length > 0
      ? Math.round(100 - (burnoutScores.reduce((sum, b) => sum + b.score, 0) / burnoutScores.length))
      : 75;

    // Generate trend data (last 30 days)
    const feedbackTrend = this.generateTrendData(recentFeedback);

    // Department comparison
    const departmentComparison = await Promise.all(
      departments.map(async (dept) => {
        const deptFeedback = await this.prisma.feedback.count({
          where: { departmentId: dept.id },
        });
        const deptComplaints = await this.prisma.complaint.count({
          where: { feedback: { departmentId: dept.id } },
        });
        const deptBurnout = await this.prisma.burnoutScore.findMany({
          where: { user: { departmentId: dept.id } },
          orderBy: { createdAt: 'desc' },
          distinct: ['userId'],
        });
        const avgStress = deptBurnout.length > 0
          ? Math.round(deptBurnout.reduce((s, b) => s + b.score, 0) / deptBurnout.length)
          : 30;

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          satisfactionScore: Math.max(20, 100 - avgStress),
          stressScore: avgStress,
          engagementScore: Math.min(100, 50 + deptFeedback * 2),
          complaintCount: deptComplaints,
        };
      })
    );

    const healthScore = Math.round(
      (avgWellness * 0.4) +
      ((1 - burnoutRiskCount / Math.max(totalUsers, 1)) * 100 * 0.3) +
      ((resolvedComplaints / Math.max(resolvedComplaints + openComplaints, 1)) * 100 * 0.3)
    );

    return {
      healthScore: Math.min(100, Math.max(0, healthScore)),
      totalFeedback,
      openComplaints,
      avgWellnessScore: avgWellness,
      burnoutRiskCount,
      totalUsers,
      resolvedComplaints,
      feedbackTrend,
      departmentComparison,
    };
  }

  async getDepartments() {
    const departments = await this.prisma.department.findMany({
      include: {
        users: { select: { id: true } },
        feedbacks: {
          select: { category: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    return departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      employeeCount: dept.users.length,
      feedbackCount: dept.feedbacks.length,
      categoryBreakdown: this.getCategoryBreakdown(dept.feedbacks),
    }));
  }

  async getBurnoutReport() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        departmentId: true,
        department: { select: { name: true } },
        burnoutScores: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return users.map((user) => ({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      department: user.department?.name || 'Unassigned',
      currentScore: user.burnoutScores[0]?.score || 0,
      riskLevel: user.burnoutScores[0]?.riskLevel || 'LOW',
      trend: user.burnoutScores.map((b) => ({
        score: b.score,
        date: b.createdAt,
      })),
    }));
  }

  async getEmotions() {
    const emotions = await this.prisma.emotionScore.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: { select: { departmentId: true, department: { select: { name: true } } } },
      },
    });

    const departments = await this.prisma.department.findMany();
    const heatmap = departments.map((dept) => {
      const deptEmotions = emotions.filter(
        (e) => e.user?.departmentId === dept.id
      );
      const emotionCounts: Record<string, number> = {
        frustration: 0, anger: 0, satisfaction: 0,
        motivation: 0, anxiety: 0, neutral: 0, positive: 0,
      };
      deptEmotions.forEach((e) => {
        if (emotionCounts[e.emotion] !== undefined) {
          emotionCounts[e.emotion]++;
        }
      });
      const total = Math.max(deptEmotions.length, 1);
      return {
        department: dept.name,
        ...Object.fromEntries(
          Object.entries(emotionCounts).map(([k, v]) => [k, Math.round((v / total) * 100)])
        ),
      };
    });

    return { heatmap, totalRecords: emotions.length };
  }

  async getPatterns() {
    const analyses = await this.prisma.aIAnalysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { keywords: true, emotion: true, urgency: true, createdAt: true },
    });

    const keywordFreq: Record<string, number> = {};
    analyses.forEach((a) => {
      const keywords = JSON.parse(a.keywords || '[]') as string[];
      keywords.forEach((k) => {
        keywordFreq[k] = (keywordFreq[k] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    return {
      topKeywords,
      totalAnalyses: analyses.length,
      emotionBreakdown: this.getEmotionBreakdown(analyses),
    };
  }

  async getAttritionRisk() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true, role: 'EMPLOYEE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: { select: { name: true } },
        burnoutScores: { orderBy: { createdAt: 'desc' }, take: 1 },
        feedbacks: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { starRating: true, moodEmoji: true, stressLevel: true, createdAt: true },
        },
      },
    });

    return users.map((user) => {
      const burnout = user.burnoutScores[0]?.score || 0;
      const avgRating = user.feedbacks.length > 0
        ? user.feedbacks.reduce((s, f) => s + (f.starRating || 3), 0) / user.feedbacks.length
        : 3;
      const avgStress = user.feedbacks.length > 0
        ? user.feedbacks.reduce((s, f) => s + (f.stressLevel || 5), 0) / user.feedbacks.length
        : 5;

      // Weighted attrition risk score
      const risk = Math.min(100, Math.round(
        (burnout * 0.4) +
        ((5 - avgRating) * 10 * 0.3) +
        (avgStress * 3 * 0.3)
      ));

      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        department: user.department?.name || 'Unassigned',
        riskScore: risk,
        riskLevel: risk > 70 ? 'HIGH' : risk > 40 ? 'MODERATE' : 'LOW',
        indicators: {
          burnoutScore: burnout,
          avgRating,
          avgStress,
          feedbackCount: user.feedbacks.length,
        },
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }

  async getPredictions() {
    // Simulated 30-day forecasts
    const baseDate = new Date();
    const predictions = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        stressLevel: Math.round(35 + Math.sin(i / 5) * 15 + Math.random() * 10),
        burnoutCases: Math.round(3 + Math.sin(i / 7) * 2 + Math.random() * 2),
        productivity: Math.round(72 + Math.cos(i / 6) * 8 + Math.random() * 5),
        attritionProb: Math.round(8 + Math.sin(i / 10) * 3 + Math.random() * 2),
      };
    });

    return { predictions, confidenceInterval: 0.82 };
  }

  // Helper methods
  private generateTrendData(feedbacks: { createdAt: Date }[]) {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days[date.toISOString().split('T')[0]] = 0;
    }
    feedbacks.forEach((f) => {
      const key = f.createdAt.toISOString().split('T')[0];
      if (days[key] !== undefined) days[key]++;
    });
    return Object.entries(days).map(([date, value]) => ({ date, value }));
  }

  private getCategoryBreakdown(feedbacks: { category: string }[]) {
    const counts: Record<string, number> = {};
    feedbacks.forEach((f) => { counts[f.category] = (counts[f.category] || 0) + 1; });
    return counts;
  }

  private getEmotionBreakdown(analyses: { emotion: string }[]) {
    const counts: Record<string, number> = {};
    analyses.forEach((a) => { counts[a.emotion] = (counts[a.emotion] || 0) + 1; });
    return counts;
  }
}
