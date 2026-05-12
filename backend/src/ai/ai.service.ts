import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('openai.apiKey') || '';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  /** Analyze feedback text and return structured AI insights */
  async analyzeFeedback(content: string, category: string) {
    if (this.isConfigured) {
      return this.analyzeWithOpenAI(content, category);
    }
    return this.simulateAnalysis(content, category);
  }

  /** Generate executive summary of recent feedback */
  async generateSummary(feedbackItems: { content: string; category: string; emotion: string }[]) {
    const categories = feedbackItems.map(f => f.category);
    const emotions = feedbackItems.map(f => f.emotion);
    const dominantEmotion = this.mode(emotions);
    const dominantCategory = this.mode(categories);

    return {
      summary: `Analysis of ${feedbackItems.length} feedback items reveals a predominantly ${dominantEmotion} sentiment, with ${dominantCategory} being the most common category. Key areas requiring attention include workload management and team communication.`,
      keyThemes: ['workload', 'communication', 'management', 'growth'],
      riskAreas: feedbackItems.filter(f => ['anger', 'frustration', 'anxiety'].includes(f.emotion)).length > feedbackItems.length * 0.3
        ? ['High negative sentiment detected', 'Potential team burnout risk']
        : ['Minor communication gaps'],
      recommendations: [
        'Schedule team wellness check-ins',
        'Review workload distribution',
        'Establish regular feedback sessions',
      ],
    };
  }

  /** Predict burnout risk based on historical data */
  async predictBurnout(stressLevels: number[], feedbackSentiments: number[]) {
    const avgStress = stressLevels.reduce((a, b) => a + b, 0) / Math.max(stressLevels.length, 1);
    const avgSentiment = feedbackSentiments.reduce((a, b) => a + b, 0) / Math.max(feedbackSentiments.length, 1);
    const trend = stressLevels.length >= 2 ? stressLevels[stressLevels.length - 1] - stressLevels[0] : 0;

    const score = Math.min(100, Math.max(0, Math.round(
      avgStress * 5 + (1 - avgSentiment) * 30 + trend * 10
    )));

    return {
      score,
      riskLevel: score > 75 ? 'CRITICAL' : score > 55 ? 'HIGH' : score > 35 ? 'MODERATE' : 'LOW',
      factors: [
        avgStress > 6 ? 'Consistently high stress levels' : null,
        avgSentiment < 0 ? 'Negative feedback sentiment trend' : null,
        trend > 2 ? 'Increasing stress trajectory' : null,
      ].filter(Boolean),
      recommendations: [
        score > 55 ? 'Immediate wellness intervention recommended' : null,
        avgStress > 7 ? 'Workload review needed' : null,
        'Regular check-ins with manager',
      ].filter(Boolean),
    };
  }

  /** Generate wellness suggestions */
  async getWellnessSuggestions(burnoutScore: number, emotion: string) {
    const suggestions = [
      { condition: burnoutScore > 60, text: 'Consider scheduling a meeting with your manager to discuss workload distribution.' },
      { condition: burnoutScore > 40, text: 'Take regular breaks throughout the day — try the 52/17 method (52 min work, 17 min break).' },
      { condition: emotion === 'anxiety', text: 'Practice mindfulness techniques — even 5 minutes of deep breathing can help.' },
      { condition: emotion === 'frustration', text: 'Document specific frustration points to discuss constructively with your team.' },
      { condition: true, text: 'Stay connected with colleagues — social support is key to workplace wellness.' },
      { condition: true, text: 'Celebrate small wins daily — acknowledging progress boosts motivation.' },
    ];

    return suggestions.filter(s => s.condition).map(s => s.text);
  }

  // Private methods
  private async analyzeWithOpenAI(content: string, category: string) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: this.apiKey });

      const response = await openai.chat.completions.create({
        model: this.configService.get('openai.model') || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an AI analyst for employee feedback. Analyze the following feedback and return a JSON object with: emotion (one of: frustration, anger, satisfaction, motivation, anxiety, neutral, positive), sentiment (float -1 to 1), toxicityScore (float 0 to 1), urgency (LOW/MEDIUM/HIGH/CRITICAL), summary (2-3 sentences), keywords (array of 5 keywords), rootCause (string), recommendations (array of 3 action items).`
          },
          { role: 'user', content: `Category: ${category}\n\nFeedback: ${content}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI API error, falling back to simulation:', error);
      return this.simulateAnalysis(content, category);
    }
  }

  private simulateAnalysis(content: string, category: string) {
    const words = content.toLowerCase().split(/\s+/);
    const negWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'fail', 'poor', 'angry', 'frustrated'];
    const posWords = ['good', 'great', 'excellent', 'happy', 'love', 'wonderful', 'amazing'];
    const neg = words.filter(w => negWords.some(n => w.includes(n))).length;
    const pos = words.filter(w => posWords.some(p => w.includes(p))).length;
    const sentiment = (pos - neg) / Math.max(words.length * 0.1, 1);

    return {
      emotion: neg > pos ? 'frustration' : pos > neg ? 'satisfaction' : 'neutral',
      sentiment: Math.max(-1, Math.min(1, sentiment)),
      toxicityScore: Math.min(1, neg * 0.2),
      urgency: neg > 2 ? 'HIGH' : neg > 0 ? 'MEDIUM' : 'LOW',
      summary: `Feedback about ${category.toLowerCase()}: ${content.slice(0, 120)}...`,
      keywords: words.filter(w => w.length > 4).slice(0, 5),
      rootCause: neg > 0 ? 'Potential dissatisfaction with current processes' : null,
      recommendations: ['Review and acknowledge feedback', 'Follow up within 48 hours'],
    };
  }

  private mode(arr: string[]): string {
    const freq: Record<string, number> = {};
    arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }
}
