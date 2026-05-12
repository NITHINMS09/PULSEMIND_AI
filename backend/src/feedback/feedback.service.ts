import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submit new feedback
   */
  async create(userId: string | null, dto: {
    category: string;
    priority?: string;
    title: string;
    content: string;
    departmentId?: string;
    branch?: string;
    starRating?: number;
    moodEmoji?: string;
    stressLevel?: number;
    satisfactionScore?: number;
    keywords?: string[];
    language?: string;
    isAnonymous?: boolean;
  }) {
    const anonymousTrackingId = dto.isAnonymous ? `ANON-${uuidv4().split('-')[0].toUpperCase()}` : null;

    // AI analysis simulation (would be OpenAI in production)
    const aiAnalysis = this.simulateAIAnalysis(dto.content, dto.category);

    const feedback = await this.prisma.feedback.create({
      data: {
        userId: userId, // Always store userId — masking happens at API level
        isAnonymous: dto.isAnonymous || false,
        anonymousTrackingId,
        category: dto.category,
        priority: dto.priority || aiAnalysis.urgency,
        title: dto.title,
        content: dto.content,
        departmentId: dto.departmentId,
        branch: dto.branch,
        starRating: dto.starRating,
        moodEmoji: dto.moodEmoji,
        stressLevel: dto.stressLevel,
        satisfactionScore: dto.satisfactionScore,
        keywords: JSON.stringify(aiAnalysis.keywords),
        language: dto.language || 'en',
        status: 'SUBMITTED',
      },
    });

    // Create AI analysis record
    await this.prisma.aIAnalysis.create({
      data: {
        feedbackId: feedback.id,
        emotion: aiAnalysis.emotion,
        sentiment: aiAnalysis.sentiment,
        toxicityScore: aiAnalysis.toxicityScore,
        urgency: aiAnalysis.urgency,
        summary: aiAnalysis.summary,
        keywords: JSON.stringify(aiAnalysis.keywords),
        rootCause: aiAnalysis.rootCause,
        recommendations: JSON.stringify(aiAnalysis.recommendations),
      },
    });

    // Create emotion score
    await this.prisma.emotionScore.create({
      data: {
        userId: dto.isAnonymous ? null : userId,
        feedbackId: feedback.id,
        emotion: aiAnalysis.emotion,
        score: Math.abs(aiAnalysis.sentiment),
        confidence: 0.85 + Math.random() * 0.1,
      },
    });

    // Auto-create complaint for actionable categories
    if (['COMPLAINT', 'TOXICITY', 'WORKPLACE_SAFETY', 'HR_POLICY'].includes(dto.category)) {
      await this.prisma.complaint.create({
        data: {
          feedbackId: feedback.id,
          authorId: userId!,
          status: 'SUBMITTED',
          priority: dto.priority || aiAnalysis.urgency,
        },
      });
    }

    // Notify admins about new feedback
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'HR_MANAGER'] }, accountStatus: 'APPROVED' },
      select: { id: true },
    });
    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'COMPLAINT_SUBMITTED',
          title: `📬 New ${dto.category.toLowerCase().replace('_', ' ')} submitted`,
          body: dto.isAnonymous
            ? `An anonymous user submitted: ${dto.title}`
            : `${dto.title}`,
          link: '/admin/complaints',
        },
      });
    }

    return {
      ...feedback,
      anonymousTrackingId,
      aiAnalysis,
    };
  }

  /**
   * List feedback (admin sees all, employee sees own)
   */
  async findAll(userId: string, role: string, params?: {
    status?: string;
    category?: string;
    departmentId?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    // Employees see only their own feedback
    if (role === 'EMPLOYEE') {
      where.userId = userId;
    }

    if (params?.status) where.status = params.status;
    if (params?.category) where.category = params.category;
    if (params?.departmentId) where.departmentId = params.departmentId;
    if (params?.priority) where.priority = params.priority;

    const page = params?.page || 1;
    const limit = params?.limit || 20;

    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          department: { select: { id: true, name: true } },
          aiAnalysis: true,
          complaint: { select: { id: true, status: true, assigneeId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      items: items.map((f: any) => {
        const parsed = {
          ...f,
          keywords: JSON.parse(f.keywords || '[]'),
          attachments: JSON.parse(f.attachments || '[]'),
        };
        // Mask identity for anonymous feedback when viewed by non-owner
        if (f.isAnonymous && f.userId !== userId) {
          return {
            ...parsed,
            user: { id: 'anonymous', firstName: 'Anonymous', lastName: 'User', avatar: null },
          };
        }
        return parsed;
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get feedback by ID
   */
  async findById(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true, departmentId: true } },
        department: true,
        aiAnalysis: true,
        complaint: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
            resolutionHistory: { orderBy: { createdAt: 'desc' } },
          },
        },
        emotionScores: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!feedback) throw new NotFoundException('Feedback not found');

    return {
      ...feedback,
      keywords: JSON.parse(feedback.keywords || '[]'),
      attachments: JSON.parse(feedback.attachments || '[]'),
    };
  }

  /**
   * Track anonymous feedback by tracking ID
   */
  async findByAnonymousId(trackingId: string) {
    const feedback = await this.prisma.feedback.findFirst({
      where: { anonymousTrackingId: trackingId },
      include: {
        aiAnalysis: true,
        complaint: { select: { status: true, resolvedAt: true } },
      },
    });

    if (!feedback) throw new NotFoundException('Tracking ID not found');

    return {
      id: feedback.id,
      category: feedback.category,
      status: feedback.status,
      priority: feedback.priority,
      aiSummary: feedback.aiAnalysis?.summary,
      complaintStatus: feedback.complaint?.status,
      resolvedAt: feedback.complaint?.resolvedAt,
      createdAt: feedback.createdAt,
    };
  }

  /**
   * Update feedback status
   */
  async updateStatus(id: string, status: string) {
    return this.prisma.feedback.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * AI Preview — analyze text in real-time
   */
  async aiPreview(content: string) {
    return this.simulateAIAnalysis(content, 'GENERAL');
  }

  /**
   * Simulated AI analysis (works without OpenAI key)
   */
  private simulateAIAnalysis(content: string, category: string) {
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = words.length;

    // Emotion detection keywords
    const emotionMap: Record<string, string[]> = {
      frustration: ['frustrated', 'annoying', 'tired', 'stuck', 'difficult', 'problem', 'issue', 'fail'],
      anger: ['angry', 'furious', 'unacceptable', 'terrible', 'worst', 'hate', 'disgusting'],
      satisfaction: ['happy', 'great', 'excellent', 'wonderful', 'satisfied', 'good', 'love', 'enjoy'],
      motivation: ['excited', 'motivated', 'inspired', 'eager', 'passionate', 'growth', 'opportunity'],
      anxiety: ['worried', 'anxious', 'stress', 'nervous', 'overwhelmed', 'pressure', 'deadline', 'burnout'],
      neutral: [],
    };

    let detectedEmotion = 'neutral';
    let maxMatch = 0;
    for (const [emotion, keywords] of Object.entries(emotionMap)) {
      const matches = words.filter((w) => keywords.some((k) => w.includes(k))).length;
      if (matches > maxMatch) {
        maxMatch = matches;
        detectedEmotion = emotion;
      }
    }

    // Sentiment score (-1 to 1)
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'wonderful', 'amazing', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'fail', 'poor', 'problem'];
    const posCount = words.filter((w) => positiveWords.some((p) => w.includes(p))).length;
    const negCount = words.filter((w) => negativeWords.some((n) => w.includes(n))).length;
    const sentiment = wordCount > 0 ? (posCount - negCount) / Math.max(wordCount * 0.1, 1) : 0;

    // Toxicity detection
    const toxicWords = ['idiot', 'stupid', 'harassment', 'bully', 'threat', 'abuse', 'discriminat'];
    const toxicCount = words.filter((w) => toxicWords.some((t) => w.includes(t))).length;
    const toxicityScore = Math.min(toxicCount * 0.3, 1);

    // Urgency prediction
    const urgentWords = ['urgent', 'immediate', 'critical', 'emergency', 'asap', 'now', 'safety'];
    const urgentCount = words.filter((w) => urgentWords.some((u) => w.includes(u))).length;
    let urgency = 'MEDIUM';
    if (urgentCount >= 2 || toxicityScore > 0.5) urgency = 'CRITICAL';
    else if (urgentCount >= 1 || category === 'TOXICITY') urgency = 'HIGH';
    else if (sentiment > 0.3) urgency = 'LOW';

    // Keyword extraction (top terms)
    const commonWords = new Set(['the', 'a', 'an', 'is', 'it', 'to', 'in', 'for', 'of', 'and', 'or', 'but', 'my', 'i', 'we', 'our', 'has', 'have', 'been', 'that', 'this', 'with', 'are', 'was', 'not', 'on', 'at']);
    const meaningfulWords = words.filter((w) => w.length > 3 && !commonWords.has(w));
    const wordFreq: Record<string, number> = {};
    meaningfulWords.forEach((w) => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    // Summary generation
    const summary = content.length > 100
      ? content.slice(0, 100).trim() + '...'
      : content;

    return {
      emotion: detectedEmotion,
      sentiment: Math.round(sentiment * 100) / 100,
      toxicityScore: Math.round(toxicityScore * 100) / 100,
      urgency,
      summary: `Feedback expressing ${detectedEmotion} about ${category.toLowerCase().replace('_', ' ')}. ${summary}`,
      keywords,
      rootCause: keywords.length > 0 ? `Potential issue related to: ${keywords.slice(0, 3).join(', ')}` : null,
      recommendations: [
        urgency === 'CRITICAL' ? 'Immediate attention required — escalate to department head' : null,
        toxicityScore > 0.3 ? 'Review for policy violations — flag for HR review' : null,
        detectedEmotion === 'anxiety' ? 'Consider wellness check-in with the employee' : null,
        'Follow up within 48 hours to acknowledge receipt',
      ].filter(Boolean) as string[],
      suggestedCategory: category,
    };
  }
}
