export type UserRole = 'EMPLOYEE' | 'TEAM_MEMBER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  jobTitle?: string;
  experienceLevel?: string;
  organizationId?: string;
  departmentId?: string;
  teamId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
  department?: Department;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
  size?: string;
  address?: string;
  website?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  organizationId: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  userId?: string;
  isAnonymous: boolean;
  anonymousToken?: string;
  category: FeedbackCategory;
  priority: Priority;
  title: string;
  content: string;
  summary?: string;
  departmentId?: string;
  branch?: string;
  starRating?: number;
  moodEmoji?: string;
  stressLevel?: number;
  satisfactionScore?: number;
  keywords: string[];
  attachments: string[];
  voiceRecording?: string;
  language: string;
  translatedContent?: string;
  sentimentScore?: number;
  emotionDetected?: string;
  toxicityScore?: number;
  urgencyScore?: number;
  aiSummary?: string;
  aiCategory?: string;
  aiSuggestions: string[];
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
  complaint?: Complaint;
  user?: User;
  department?: Department;
  confidenceScore?: AIConfidenceScore;
  aiAnalysis?: AIAnalysis;
}

export type FeedbackCategory =
  | 'COMPLAINT' | 'SUGGESTION' | 'SATISFACTION' | 'WELLNESS'
  | 'TOXICITY' | 'WORKPLACE_SAFETY' | 'HR_POLICY' | 'TECHNICAL';

export type FeedbackStatus =
  | 'SUBMITTED' | 'PENDING' | 'IN_REVIEW' | 'IN_PROGRESS'
  | 'RESOLVED' | 'ESCALATED' | 'CLOSED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintStatus =
  | 'SUBMITTED' | 'AI_PROCESSING' | 'AI_RESPONDED'
  | 'HUMAN_TEAM_ASSIGNED' | 'IN_PROGRESS'
  | 'WAITING_FOR_EMPLOYEE' | 'ESCALATED'
  | 'REOPENED' | 'RESOLVED' | 'CLOSED';

export interface Complaint {
  id: string;
  feedbackId: string;
  authorId: string;
  assigneeId?: string;
  status: ComplaintStatus;
  priority: Priority;
  aiResolution?: string;
  aiConfidence?: number;
  escalationLevel: number;
  reopenCount: number;
  confirmationDeadline?: string;
  currentAssignmentId?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  feedback?: Feedback;
  author?: User;
  assignee?: User;
  resolutionHistory?: ResolutionHistory[];
  slaRecord?: SLARecord;
  escalations?: Escalation[];
  messages?: ComplaintMessage[];
  confirmations?: ResolutionConfirmation[];
  assignments?: ComplaintAssignment[];
}

export interface ResolutionHistory {
  id: string;
  complaintId: string;
  fromStatus: string;
  toStatus: string;
  note?: string;
  changedById: string;
  changedBy?: User;
  createdAt: string;
}

export interface AIAnalysis {
  emotion: string;
  sentiment: number;
  toxicityScore: number;
  urgency: Priority;
  summary: string;
  keywords: string[];
  rootCause?: string;
  recommendations: string[];
  suggestedCategory?: FeedbackCategory;
}

// ============================================
// Phase 2: Teams & Routing
// ============================================

export type TeamType = 'TECHNICAL' | 'HR' | 'SERVICE' | 'INFRASTRUCTURE' | 'MANAGEMENT' | 'GENERAL';

export interface Team {
  id: string;
  name: string;
  type: TeamType;
  organizationId: string;
  leadId?: string;
  lead?: User;
  members: TeamMember[];
  maxCapacity: number;
  isActive: boolean;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  timezone: string;
  memberCount?: number;
  activeComplaints?: number;
  routingRuleCount?: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  user?: User;
  role: string;
  isAvailable: boolean;
  assignedCount: number;
  joinedAt: string;
}

export interface ComplaintAssignment {
  id: string;
  complaintId: string;
  teamId: string;
  team?: Team;
  assigneeId?: string;
  assignee?: User;
  assignedAt: string;
  assignedBy: string;
  note?: string;
  isActive: boolean;
  complaint?: Complaint;
}

export interface RoutingRule {
  id: string;
  teamId: string;
  team?: Team;
  name: string;
  keywords: string;
  semanticDesc?: string;
  weight: number;
  priority: number;
  isActive: boolean;
}

export interface RoutingResult {
  teamId: string;
  teamName: string;
  teamType: string;
  confidence: number;
  matchedKeywords: string[];
  intent: string;
}

export interface RoutingAnalysis {
  recommendations: RoutingResult[];
  detectedIntent: string;
  extractedKeywords: string[];
  requiresHuman: boolean;
  humanReason?: string;
}

// ============================================
// Phase 2: SLA
// ============================================

export interface SLARecord {
  id: string;
  complaintId: string;
  priority: string;
  responseDeadline: string;
  resolutionDeadline: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  isResponseBreached: boolean;
  isResolutionBreached: boolean;
  responseBreachedAt?: string;
  resolutionBreachedAt?: string;
  pausedAt?: string;
  pausedDurationSeconds: number;
  responseRemainingMs?: number;
  resolutionRemainingMs?: number;
  responsePercentRemaining?: number;
  resolutionPercentRemaining?: number;
  createdAt: string;
}

export interface SLAConfig {
  LOW: { responseHours: number; resolutionHours: number; escalationPercent: number };
  MEDIUM: { responseHours: number; resolutionHours: number; escalationPercent: number };
  HIGH: { responseHours: number; resolutionHours: number; escalationPercent: number };
  CRITICAL: { responseHours: number; resolutionHours: number; escalationPercent: number };
}

// ============================================
// Phase 2: Escalation
// ============================================

export interface Escalation {
  id: string;
  complaintId: string;
  fromLevel: number;
  toLevel: number;
  fromUserId?: string;
  toUserId?: string;
  reason: string;
  triggeredBy: string;
  triggeredById?: string;
  note?: string;
  createdAt: string;
  complaint?: Complaint;
}

// ============================================
// Phase 2: Resolution Confirmation
// ============================================

export interface ResolutionConfirmation {
  id: string;
  complaintId: string;
  employeeId: string;
  employee?: User;
  decision: 'ACCEPTED' | 'REJECTED' | 'FURTHER_HELP';
  satisfactionRating?: number;
  professionalismRating?: string;
  comment?: string;
  reopenReason?: string;
  attemptNumber: number;
  decidedAt: string;
}

// ============================================
// Phase 2: AI Confidence
// ============================================

export interface AIConfidenceScore {
  id: string;
  feedbackId: string;
  overallScore: number;
  classificationScore: number;
  sentimentScore: number;
  routingScore: number;
  resolutionScore: number;
  routingRecommendation?: string;
  classificationResult?: string;
  requiresHuman: boolean;
  humanEscalationReason?: string;
  createdAt: string;
}

// ============================================
// Phase 2: Complaint Messages (Chat)
// ============================================

export interface ComplaintMessage {
  id: string;
  complaintId: string;
  senderId: string;
  sender?: User;
  senderType: 'EMPLOYEE' | 'TEAM' | 'AI' | 'SYSTEM';
  content?: string;
  messageType: 'TEXT' | 'VOICE_NOTE' | 'FILE' | 'SYSTEM_EVENT';
  attachments?: string;
  voiceNoteUrl?: string;
  replyToId?: string;
  replyTo?: ComplaintMessage;
  readAt?: string;
  readBy?: string;
  isDeleted: boolean;
  createdAt: string;
}

// ============================================
// Existing types (unchanged)
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type NotificationType =
  | 'AI_INSIGHT' | 'STATUS_UPDATE' | 'HR_MESSAGE'
  | 'SYSTEM_ALERT' | 'BADGE_EARNED' | 'WELLNESS_TIP'
  | 'SLA_BREACH' | 'RESOLUTION_PENDING' | 'ESCALATION';

export interface BurnoutScore {
  id: string;
  userId: string;
  score: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  factors: string[];
  recommendations: string[];
  createdAt: string;
}

export interface EmotionScore {
  id: string;
  userId?: string;
  feedbackId?: string;
  emotion: string;
  score: number;
  confidence: number;
  createdAt: string;
}

export interface WellnessReport {
  id: string;
  userId: string;
  overallScore: number;
  stressScore: number;
  satisfactionScore: number;
  engagementScore: number;
  moodTrend?: string;
  recommendations: string[];
  period: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  roomId?: string;
  content: string;
  isAI: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  sender?: User;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  votes?: Record<string, number>;
  isActive: boolean;
  createdBy: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: User;
}

// Analytics types
export interface OrgHealthMetrics {
  healthScore: number;
  totalFeedback: number;
  openComplaints: number;
  avgWellnessScore: number;
  burnoutRiskCount: number;
  feedbackTrend: TrendPoint[];
  departmentComparison: DepartmentMetric[];
  recentAlerts: AIAlert[];
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface DepartmentMetric {
  departmentId: string;
  departmentName: string;
  satisfactionScore: number;
  stressScore: number;
  engagementScore: number;
  complaintCount: number;
}

export interface AIAlert {
  id: string;
  type: 'HIGH_STRESS' | 'BURNOUT_RISK' | 'TOXICITY' | 'CRITICAL_COMPLAINT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  departmentId?: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface EmotionHeatmapData {
  department: string;
  frustration: number;
  anger: number;
  satisfaction: number;
  motivation: number;
  anxiety: number;
  neutral: number;
  positive: number;
}

// Status color mapping for Phase 2 complaint statuses
export const COMPLAINT_STATUS_CONFIG: Record<ComplaintStatus, { color: string; bgColor: string; label: string }> = {
  SUBMITTED: { color: 'text-slate-700', bgColor: 'bg-slate-50', label: 'Submitted' },
  AI_PROCESSING: { color: 'text-indigo-700', bgColor: 'bg-indigo-50', label: 'AI Processing' },
  AI_RESPONDED: { color: 'text-indigo-700', bgColor: 'bg-indigo-50', label: 'AI Responded' },
  HUMAN_TEAM_ASSIGNED: { color: 'text-blue-700', bgColor: 'bg-blue-50', label: 'Team Assigned' },
  IN_PROGRESS: { color: 'text-amber-700', bgColor: 'bg-amber-50', label: 'In Progress' },
  WAITING_FOR_EMPLOYEE: { color: 'text-purple-700', bgColor: 'bg-purple-50', label: 'Awaiting You' },
  ESCALATED: { color: 'text-orange-700', bgColor: 'bg-orange-50', label: 'Escalated' },
  REOPENED: { color: 'text-rose-700', bgColor: 'bg-rose-50', label: 'Reopened' },
  RESOLVED: { color: 'text-teal-700', bgColor: 'bg-teal-50', label: 'Resolved' },
  CLOSED: { color: 'text-slate-500', bgColor: 'bg-slate-50', label: 'Closed' },
};
