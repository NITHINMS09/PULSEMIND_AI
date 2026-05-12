'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle2, AlertTriangle, ArrowUpCircle, Eye, Loader2,
  MessageSquare, Timer, Users, RefreshCw
} from 'lucide-react';
import { complaintsApi, feedbackApi } from '@/lib/api';

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  SUBMITTED: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Submitted' },
  AI_PROCESSING: { icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50', label: 'AI Processing' },
  IN_PROGRESS: { icon: Timer, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'In Progress' },
  WAITING_FOR_EMPLOYEE: { icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Awaiting Your Review' },
  ESCALATED: { icon: ArrowUpCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Escalated' },
  REOPENED: { icon: RefreshCw, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Reopened' },
  RESOLVED: { icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50', label: 'Resolved' },
  CLOSED: { icon: CheckCircle2, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Closed' },
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-50 text-blue-600',
  HIGH: 'bg-orange-50 text-orange-600',
  CRITICAL: 'bg-red-50 text-red-600',
};

export default function FeedbackHistory() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'complaints' | 'feedback'>('complaints');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, fRes] = await Promise.all([
        complaintsApi.myComplaints(),
        feedbackApi.list(),
      ]);
      setComplaints(cRes.data?.data || cRes.data || []);
      const fData = fRes.data?.data;
      setFeedbacks(fData?.items || fData || []);
    } catch (e) { console.error('Failed to load history:', e); }
    setLoading(false);
  }

  function getRelativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto">
      <div className="h-8 bg-surface-secondary rounded w-48 mb-2 animate-pulse" />
      <div className="h-4 bg-surface-secondary rounded w-64 mb-6 animate-pulse" />
      <div className="space-y-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="card-elevated p-5 flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-surface-secondary rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-secondary rounded w-3/4" />
              <div className="h-3 bg-surface-secondary rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Feedback History</h1>
          <p className="text-sm text-text-secondary">Track all your submissions and their status</p>
        </div>
        <button onClick={loadData} className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-brand-600 bg-surface-secondary hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-secondary rounded-lg p-0.5 w-fit mb-6">
        <button onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'complaints' ? 'bg-white shadow-sm text-brand-600' : 'text-text-secondary'}`}>
          Complaints {complaints.length > 0 && <span className="ml-1 text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">{complaints.length}</span>}
        </button>
        <button onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'feedback' ? 'bg-white shadow-sm text-brand-600' : 'text-text-secondary'}`}>
          All Feedback {feedbacks.length > 0 && <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{feedbacks.length}</span>}
        </button>
      </div>

      {activeTab === 'complaints' && (
        <div className="space-y-3">
          {complaints.length === 0 ? (
            <div className="card-elevated p-12 text-center">
              <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
              <h3 className="font-display text-lg font-semibold text-text-primary mb-1">No complaints yet</h3>
              <p className="text-sm text-text-secondary">Submit feedback with category "Complaint" to create one</p>
            </div>
          ) : (
            complaints.map((item: any, i: number) => {
              const status = item.status || 'SUBMITTED';
              const sc = statusConfig[status] || statusConfig.SUBMITTED;
              const Icon = sc.icon;
              const title = item.feedback?.title || 'Untitled';
              const category = item.feedback?.category || '';
              const priority = item.priority || item.feedback?.priority || 'MEDIUM';
              const teamName = item.assignments?.[0]?.team?.name;
              const hasConfirmation = status === 'WAITING_FOR_EMPLOYEE';

              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/dashboard/complaints/${item.id}`)}
                  className={`card-elevated p-5 flex items-center gap-4 group cursor-pointer transition-all hover:shadow-md ${hasConfirmation ? 'ring-2 ring-amber-200' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                    <Icon className={`w-5 h-5 ${sc.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-brand-600 transition-colors truncate">
                      {title}
                      {item.feedback?.isAnonymous && <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">🔒 Anonymous</span>}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.color}`}>{sc.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityColors[priority]}`}>{priority}</span>
                      {category && <span className="text-xs text-text-muted">{category}</span>}
                      {teamName && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Users className="w-3 h-3" /> {teamName}
                        </span>
                      )}
                    </div>
                    {hasConfirmation && (
                      <div className="mt-1.5 text-xs text-amber-600 font-medium animate-pulse">
                        ⚡ Action required — Please review the solution
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-text-muted text-right flex-shrink-0">
                    {getRelativeTime(item.createdAt)}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-3">
          {feedbacks.length === 0 ? (
            <div className="card-elevated p-12 text-center">
              <Eye className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
              <h3 className="font-display text-lg font-semibold text-text-primary mb-1">No feedback yet</h3>
              <p className="text-sm text-text-secondary">Start by submitting your first feedback</p>
            </div>
          ) : (
            feedbacks.map((item: any, i: number) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-elevated p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-50">
                  <Eye className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge badge-info text-[10px]">{item.category}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityColors[item.priority]}`}>{item.priority}</span>
                    {item.isAnonymous && <span className="text-[10px] text-slate-500">🔒 Anonymous</span>}
                  </div>
                </div>
                <div className="text-xs text-text-muted">{getRelativeTime(item.createdAt)}</div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
