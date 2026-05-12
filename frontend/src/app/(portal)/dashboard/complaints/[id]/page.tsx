'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, CheckCircle2, AlertTriangle, ArrowUpCircle, Timer,
  MessageSquare, RefreshCw, Users, Brain, Shield, Loader2, Send, ThumbsUp, ThumbsDown, HelpCircle
} from 'lucide-react';
import { complaintsApi } from '@/lib/api';

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  SUBMITTED: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Submitted' },
  AI_PROCESSING: { icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50', label: 'AI Processing' },
  IN_PROGRESS: { icon: Timer, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'In Progress' },
  WAITING_FOR_EMPLOYEE: { icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Awaiting Your Review' },
  ESCALATED: { icon: ArrowUpCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Escalated' },
  REOPENED: { icon: RefreshCw, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Reopened' },
  RESOLVED: { icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50', label: 'Resolved' },
  CLOSED: { icon: CheckCircle2, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Closed' },
};

const statusOrder = ['SUBMITTED', 'AI_PROCESSING', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'RESOLVED'];

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmComment, setConfirmComment] = useState('');

  useEffect(() => { if (id) loadComplaint(); }, [id]);

  async function loadComplaint() {
    setLoading(true);
    try {
      const { data } = await complaintsApi.getById(id as string);
      setComplaint(data?.data || data);
    } catch (e) { console.error('Failed to load complaint:', e); }
    setLoading(false);
  }

  async function handleConfirm(decision: 'ACCEPTED' | 'REJECTED' | 'FURTHER_HELP') {
    setConfirmLoading(true);
    try {
      await complaintsApi.confirmResolution(id as string, decision, confirmComment);
      await loadComplaint();
      setConfirmComment('');
    } catch (e) { console.error(e); }
    setConfirmLoading(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
    </div>
  );

  if (!complaint) return (
    <div className="text-center py-20">
      <AlertTriangle className="w-12 h-12 text-text-muted mx-auto mb-3" />
      <p className="text-lg font-semibold text-text-primary">Complaint not found</p>
      <button onClick={() => router.back()} className="mt-4 text-sm text-brand-600 hover:text-brand-700">Go back</button>
    </div>
  );

  const status = complaint.status || 'SUBMITTED';
  const sc = statusConfig[status] || statusConfig.SUBMITTED;
  const StatusIcon = sc.icon;
  const feedback = complaint.feedback || {};
  const ai = feedback.aiAnalysis;
  const team = complaint.assignments?.[0]?.team;
  const history = complaint.resolutionHistory || [];
  const currentStep = statusOrder.indexOf(status);

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-text-secondary hover:text-brand-600 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to History
      </button>

      {/* Header */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary mb-1">{feedback.title || 'Untitled Complaint'}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color} flex items-center gap-1`}>
                <StatusIcon className="w-3.5 h-3.5" /> {sc.label}
              </span>
              {complaint.priority && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  complaint.priority === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                  complaint.priority === 'HIGH' ? 'bg-orange-50 text-orange-600' :
                  complaint.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}>{complaint.priority}</span>
              )}
              {feedback.category && <span className="text-xs text-text-muted">{feedback.category}</span>}
              {feedback.isAnonymous && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">🔒 Anonymous</span>}
            </div>
          </div>
          <div className="text-xs text-text-muted text-right">
            <p>ID: {complaint.id?.substring(0, 8)}</p>
            <p>{new Date(complaint.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="flex items-center gap-0 mt-4">
          {statusOrder.map((s, i) => {
            const isPast = i <= currentStep;
            const isCurrent = i === currentStep;
            const cfg = statusConfig[s];
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isCurrent ? `${cfg.bg} ring-2 ring-offset-1 ring-current ${cfg.color}` :
                  isPast ? 'bg-teal-100 text-teal-600' : 'bg-surface-secondary text-text-muted'
                }`}>
                  {isPast && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> :
                   React.createElement(cfg.icon, { className: 'w-4 h-4' })}
                </div>
                {i < statusOrder.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded ${isPast ? 'bg-teal-300' : 'bg-surface-tertiary'}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          {statusOrder.map(s => (
            <span key={s} className="text-[9px] text-text-muted text-center flex-1">{statusConfig[s].label}</span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main */}
        <div className="md:col-span-2 space-y-6">
          <div className="card-elevated p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Feedback Details</h3>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{feedback.content}</p>
          </div>

          {/* Solution Review */}
          {status === 'WAITING_FOR_EMPLOYEE' && complaint.aiResolution && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="card-elevated p-6 ring-2 ring-amber-200 bg-amber-50/30">
              <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Solution Submitted — Your Response Required
              </h3>
              <div className="bg-white rounded-lg p-4 border border-amber-200 mb-4">
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{complaint.aiResolution}</p>
              </div>
              <div className="space-y-3">
                <textarea value={confirmComment} onChange={(e) => setConfirmComment(e.target.value)}
                  placeholder="Optional comment..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  rows={2} />
                <div className="flex gap-2">
                  <button onClick={() => handleConfirm('ACCEPTED')} disabled={confirmLoading}
                    className="flex-1 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <ThumbsUp className="w-4 h-4" /> Accept Solution
                  </button>
                  <button onClick={() => handleConfirm('REJECTED')} disabled={confirmLoading}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <ThumbsDown className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={() => handleConfirm('FURTHER_HELP')} disabled={confirmLoading}
                    className="py-2.5 px-4 bg-surface-secondary text-text-secondary text-sm font-medium rounded-lg hover:bg-surface-tertiary transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <HelpCircle className="w-4 h-4" /> More Help
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Resolved */}
          {status === 'RESOLVED' && (
            <div className="card-elevated p-6 bg-teal-50/50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
                <div>
                  <h3 className="text-sm font-semibold text-teal-800">Complaint Resolved</h3>
                  <p className="text-xs text-teal-600">
                    Resolved on {complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              {complaint.aiResolution && (
                <div className="mt-3 bg-white rounded-lg p-3 border border-teal-200">
                  <p className="text-xs font-medium text-text-muted mb-1">Resolution</p>
                  <p className="text-sm text-text-secondary">{complaint.aiResolution}</p>
                </div>
              )}
            </div>
          )}

          {/* Activity History */}
          {history.length > 0 && (
            <div className="card-elevated p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Activity History</h3>
              <div className="space-y-3">
                {history.map((h: any, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-brand-300 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-text-secondary">{h.note}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-muted">{h.fromStatus} → {h.toStatus}</span>
                        {h.changedBy && <span className="text-[10px] text-text-muted">by {h.changedBy.firstName} {h.changedBy.lastName}</span>}
                        <span className="text-[10px] text-text-muted">{new Date(h.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {ai && (
            <div className="card-elevated p-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" /> AI Analysis
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-text-muted">Emotion</span><span className="font-medium text-text-primary capitalize">{ai.emotion}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Sentiment</span>
                  <span className={`font-medium ${ai.sentiment > 0 ? 'text-teal-600' : ai.sentiment < 0 ? 'text-red-600' : 'text-text-primary'}`}>
                    {ai.sentiment > 0 ? 'Positive' : ai.sentiment < 0 ? 'Negative' : 'Neutral'}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-text-muted">Urgency</span><span className="font-medium text-text-primary">{ai.urgency}</span></div>
                {ai.toxicityScore > 0 && (
                  <div className="flex justify-between"><span className="text-text-muted">Toxicity</span>
                    <span className={`font-medium ${ai.toxicityScore > 0.5 ? 'text-red-600' : 'text-amber-600'}`}>{(ai.toxicityScore * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
              {ai.summary && <div className="mt-3 pt-3 border-t border-border"><p className="text-xs text-text-secondary">{ai.summary}</p></div>}
            </div>
          )}

          {team && (
            <div className="card-elevated p-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Assigned Team
              </h4>
              <p className="text-sm font-semibold text-text-primary">{team.name}</p>
              <p className="text-xs text-text-muted">{team.type}</p>
            </div>
          )}

          {complaint.slaRecord && (
            <div className="card-elevated p-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">SLA Status</h4>
              <div className="space-y-1 text-xs">
                {complaint.slaRecord.responseDeadline && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Response by</span>
                    <span className="text-text-primary">{new Date(complaint.slaRecord.responseDeadline).toLocaleDateString()}</span>
                  </div>
                )}
                {complaint.slaRecord.resolutionDeadline && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Resolve by</span>
                    <span className={complaint.slaRecord.isResolutionBreached ? 'text-red-600 font-semibold' : 'text-text-primary'}>
                      {new Date(complaint.slaRecord.resolutionDeadline).toLocaleDateString()}
                      {complaint.slaRecord.isResolutionBreached && ' ⚠️ Breached'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card-elevated p-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Details</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-text-muted">Department</span><span className="text-text-primary">{feedback.department?.name || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Escalation</span><span className="text-text-primary">Level {complaint.escalationLevel || 0}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Reopened</span><span className="text-text-primary">{complaint.reopenCount || 0} times</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Created</span><span className="text-text-primary">{new Date(complaint.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
