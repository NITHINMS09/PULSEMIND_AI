'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { complaintsApi } from '@/lib/api';
import { Loader2, RefreshCw, Users, AlertTriangle, Clock, CheckCircle2, Timer, MessageSquare, ArrowUpCircle } from 'lucide-react';

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-50 text-blue-600',
  HIGH: 'bg-orange-50 text-orange-600',
  CRITICAL: 'bg-red-50 text-red-600',
};

const colConfig: Record<string, { label: string; color: string; icon: any }> = {
  SUBMITTED: { label: 'New', color: 'bg-brand-600', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-indigo-500', icon: Timer },
  WAITING_FOR_EMPLOYEE: { label: 'Awaiting Confirmation', color: 'bg-amber-500', icon: MessageSquare },
  ESCALATED: { label: 'Escalated', color: 'bg-red-500', icon: ArrowUpCircle },
  REOPENED: { label: 'Reopened', color: 'bg-orange-500', icon: AlertTriangle },
  RESOLVED: { label: 'Resolved', color: 'bg-teal-500', icon: CheckCircle2 },
};

export default function ComplaintsPage() {
  const [kanban, setKanban] = useState<Record<string, any[]>>({});
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [kRes, sRes] = await Promise.all([
        complaintsApi.kanban(),
        complaintsApi.stats(),
      ]);
      setKanban(kRes.data?.data || kRes.data || {});
      setStats(sRes.data?.data || sRes.data);
    } catch (e) { console.error('Failed to load complaints:', e); }
    setLoading(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Complaint Management</h1>
          <p className="text-sm text-text-secondary">
            Kanban view — {stats?.total || 0} total complaints
          </p>
        </div>
        <button onClick={loadData} className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-brand-600 bg-surface-secondary hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-text-primary' },
            { label: 'New', value: stats.submitted, color: 'text-blue-600' },
            { label: 'Active', value: stats.inProgress, color: 'text-indigo-600' },
            { label: 'Awaiting', value: stats.waiting, color: 'text-amber-600' },
            { label: 'Escalated', value: stats.escalated, color: 'text-red-600' },
            { label: 'Resolved', value: stats.resolved, color: 'text-teal-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-3 border border-border text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
        {Object.entries(colConfig).map(([status, cfg]) => {
          const items = kanban[status] || [];
          const Icon = cfg.icon;
          return (
            <div key={status} className="bg-surface-secondary rounded-xl p-3 min-w-[240px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                <Icon className="w-3.5 h-3.5 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-primary">{cfg.label}</h3>
                <span className="ml-auto text-xs font-medium text-text-muted bg-white px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-muted">No items</div>
                ) : (
                  items.map((item: any, i: number) => {
                    const title = item.feedback?.title || 'Untitled';
                    const priority = item.priority || item.feedback?.priority || 'MEDIUM';
                    const dept = item.feedback?.department?.name || '';
                    const teamName = item.assignments?.[0]?.team?.name;
                    const authorName = item.author?.firstName === 'Anonymous'
                      ? '🔒 Anonymous'
                      : `${item.author?.firstName || ''} ${item.author?.lastName || ''}`.trim();

                    return (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-white rounded-lg p-3 border border-border shadow-sm hover:shadow-md transition-all cursor-pointer">
                        <h4 className="text-sm font-medium text-text-primary mb-2 leading-snug line-clamp-2">{title}</h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${priorityColors[priority]}`}>{priority}</span>
                          {dept && <span className="text-[10px] text-text-muted">{dept}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                          <span className="text-[10px] text-text-muted truncate max-w-[100px]">{authorName}</span>
                          {teamName && (
                            <span className="flex items-center gap-0.5 text-[10px] text-indigo-600">
                              <Users className="w-2.5 h-2.5" /> {teamName}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
