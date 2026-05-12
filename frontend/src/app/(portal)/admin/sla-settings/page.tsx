'use client';
import { useEffect, useState } from 'react';
import { slaApi } from '@/lib/api';

export default function SLASettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [cRes, rRes] = await Promise.all([slaApi.config(), slaApi.report()]);
        setConfig(cRes.data?.data || cRes.data);
        setReport(rRes.data?.data || rRes.data);
      } catch { }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const priorityColors: Record<string, string> = { LOW: 'text-slate-600', MEDIUM: 'text-amber-600', HIGH: 'text-orange-600', CRITICAL: 'text-red-600' };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">⏱️ SLA Settings & Performance</h1>
        <p className="text-sm text-slate-500 mt-1">Configure SLA thresholds and monitor compliance</p>
      </div>

      {/* SLA Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">📋 SLA Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {config && priorities.map((p) => {
            const c = config[p];
            return (
              <div key={p} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    p === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    p === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    p === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{p}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Response</span>
                    <span className={`text-sm font-bold ${priorityColors[p]}`}>{c?.responseHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Resolution</span>
                    <span className={`text-sm font-bold ${priorityColors[p]}`}>{c?.resolutionHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Escalation at</span>
                    <span className="text-sm font-bold text-slate-600">{c?.escalationPercent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Report */}
      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total SLAs', value: report.total, icon: '📊', color: 'text-indigo-600' },
              { label: 'Resp. Breach Rate', value: `${report.responseBreachRate}%`, icon: '📩', color: report.responseBreachRate > 20 ? 'text-red-600' : 'text-teal-600' },
              { label: 'Resol. Breach Rate', value: `${report.resolutionBreachRate}%`, icon: '🔧', color: report.resolutionBreachRate > 20 ? 'text-red-600' : 'text-teal-600' },
              { label: 'Avg Response', value: `${report.avgResponseTimeHours}h`, icon: '⏱️', color: 'text-blue-600' },
              { label: 'Avg Resolution', value: `${report.avgResolutionTimeHours}h`, icon: '✅', color: 'text-amber-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{stat.icon}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{stat.label}</span>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* By Priority */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">📈 Performance by Priority</h3>
            <div className="space-y-3">
              {report.byPriority?.map((p: any) => {
                const breachRate = p.total > 0 ? Math.round((p.breached / p.total) * 100) : 0;
                return (
                  <div key={p.priority} className="flex items-center gap-4">
                    <span className={`w-20 text-xs font-bold ${priorityColors[p.priority]}`}>{p.priority}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${breachRate > 30 ? 'bg-red-400' : breachRate > 15 ? 'bg-amber-400' : 'bg-teal-400'}`}
                        style={{ width: `${Math.max(3, 100 - breachRate)}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-28 text-right">{p.total} total / {p.breached} breached</span>
                    <span className="text-xs text-slate-400 w-16 text-right">Target: {p.target}h</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
