import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface RoutingResult {
  teamId: string;
  teamName: string;
  teamType: string;
  confidence: number;
  matchedKeywords: string[];
  intent: string;
}

@Injectable()
export class RoutingService {
  constructor(private prisma: PrismaService) {}

  // Default keyword-to-intent mapping
  private readonly intentKeywords: Record<string, string[]> = {
    TECHNICAL: ['system error', 'login problem', 'software bug', 'website issue', 'api failure', 'server down', 'database', 'password reset', 'crash', 'code', 'deploy', 'server', 'devops', 'integration'],
    HR: ['salary', 'payroll', 'leave request', 'policy violation', 'manager complaint', 'hr grievance', 'promotion', 'appraisal', 'harassment', 'discrimination', 'benefits', 'termination', 'contract'],
    SERVICE: ['customer complaint', 'service failure', 'support ticket', 'billing issue', 'refund', 'onboarding', 'delivery', 'quality', 'response time', 'sla'],
    INFRASTRUCTURE: ['internet down', 'hardware issue', 'electricity', 'office facility', 'printer', 'infrastructure', 'vpn', 'wifi', 'desk', 'air conditioning', 'building'],
    MANAGEMENT: ['leadership', 'strategy', 'budget', 'headcount', 'performance review', 'inter-department', 'conflict', 'culture', 'vision', 'restructuring', 'merger'],
  };

  /**
   * Analyze complaint text and return routing recommendation
   */
  async analyzeRouting(text: string, category?: string, priority?: string): Promise<{
    recommendations: RoutingResult[];
    detectedIntent: string;
    extractedKeywords: string[];
    requiresHuman: boolean;
    humanReason?: string;
  }> {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    // 1. Extract keywords from text
    const extractedKeywords = this.extractKeywords(lowerText);

    // 2. Classify intent using keyword matching
    const intentScores = this.classifyIntent(lowerText);
    const detectedIntent = intentScores.length > 0 ? intentScores[0].intent : 'GENERAL';

    // 3. Get all active teams with routing rules
    const teams = await this.prisma.team.findMany({
      where: { isActive: true },
      include: { routingRules: { where: { isActive: true }, orderBy: { priority: 'asc' } } },
    });

    // 4. Score each team
    const recommendations: RoutingResult[] = [];
    for (const team of teams) {
      let confidence = 0;
      const matchedKeywords: string[] = [];

      // Score from team type match
      const typeScore = intentScores.find((s) => s.intent === team.type);
      if (typeScore) confidence += typeScore.score * 0.4;

      // Score from routing rules keywords
      for (const rule of team.routingRules) {
        const ruleKeywords: string[] = JSON.parse(rule.keywords || '[]');
        for (const kw of ruleKeywords) {
          if (lowerText.includes(kw.toLowerCase())) {
            confidence += rule.weight * 10;
            matchedKeywords.push(kw);
          }
        }
      }

      // Score from category match
      if (category) {
        const catMap: Record<string, string> = {
          TECHNICAL: 'TECHNICAL', HR_POLICY: 'HR', TOXICITY: 'HR',
          WORKPLACE_SAFETY: 'INFRASTRUCTURE', COMPLAINT: 'GENERAL',
        };
        if (catMap[category] === team.type) confidence += 20;
      }

      // Cap and normalize
      confidence = Math.min(100, Math.round(confidence));

      if (confidence > 0) {
        recommendations.push({
          teamId: team.id,
          teamName: team.name,
          teamType: team.type,
          confidence,
          matchedKeywords,
          intent: detectedIntent,
        });
      }
    }

    // Sort by confidence desc
    recommendations.sort((a, b) => b.confidence - a.confidence);

    // Determine if human routing needed
    const topConfidence = recommendations[0]?.confidence || 0;
    let requiresHuman = false;
    let humanReason: string | undefined;

    if (topConfidence < 50) {
      requiresHuman = true;
      humanReason = 'AI confidence below threshold (50%)';
    }
    if (priority === 'CRITICAL') {
      requiresHuman = true;
      humanReason = 'Critical priority complaint';
    }
    if (category === 'TOXICITY' || category === 'HR_POLICY') {
      requiresHuman = true;
      humanReason = `Category requires human review: ${category}`;
    }

    return {
      recommendations: recommendations.slice(0, 5),
      detectedIntent,
      extractedKeywords,
      requiresHuman,
      humanReason,
    };
  }

  /**
   * Test routing with sample text
   */
  async testRouting(text: string) {
    return this.analyzeRouting(text);
  }

  // Routing Rules CRUD
  async findAllRules() {
    return this.prisma.routingRule.findMany({
      include: { team: { select: { id: true, name: true, type: true } } },
      orderBy: [{ teamId: 'asc' }, { priority: 'asc' }],
    });
  }

  async createRule(dto: {
    teamId: string; name: string; keywords: string;
    semanticDesc?: string; weight?: number; priority?: number;
  }) {
    return this.prisma.routingRule.create({
      data: dto,
      include: { team: { select: { id: true, name: true } } },
    });
  }

  async updateRule(id: string, dto: Partial<{
    name: string; keywords: string; semanticDesc: string;
    weight: number; priority: number; isActive: boolean;
  }>) {
    return this.prisma.routingRule.update({
      where: { id },
      data: dto,
      include: { team: { select: { id: true, name: true } } },
    });
  }

  async deleteRule(id: string) {
    return this.prisma.routingRule.delete({ where: { id } });
  }

  // Private helpers
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'it', 'to', 'in', 'for', 'of', 'and', 'or', 'but', 'my', 'i', 'we', 'our', 'has', 'have', 'been', 'that', 'this', 'with', 'are', 'was', 'not', 'on', 'at', 'can', 'do', 'did']);
    const words = text.split(/\s+/).filter((w) => w.length > 3 && !stopWords.has(w));
    const freq: Record<string, number> = {};
    words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
  }

  private classifyIntent(text: string): { intent: string; score: number }[] {
    const scores: { intent: string; score: number }[] = [];

    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score += 15;
        // Partial word match
        const kwWords = kw.split(' ');
        for (const w of kwWords) {
          if (text.includes(w) && w.length > 3) score += 5;
        }
      }
      if (score > 0) scores.push({ intent, score: Math.min(100, score) });
    }

    return scores.sort((a, b) => b.score - a.score);
  }
}
