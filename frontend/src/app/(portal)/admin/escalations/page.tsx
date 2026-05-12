'use client';
import { useEffect, useState } from 'react';
import { escalationApi } from '@/lib/api';

const LEVEL_LABELS: Record<number, string> = { 1: 'Team Member', 2: 'Team Lead', 3: 'Dept Head', 4: 'HR Manager', 5: 'Super Admin' };

export default function EscalationsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await escalationApi.analytics();
        setAnalytics(data?.data || data);
      } catch { }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">⬆️ Escalation Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Track escalation patterns and trends</p>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-3xl font-bold text-indigo-600">{analytics.total}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Escalations</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-3xl font-bold text-orange-600">{analytics.byTrigger?.find((t: any) => t.type === 'SLA_AUTO')?.count || 0}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Auto (SLA)</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-3xl font-bold text-blue-600">{analytics.byTrigger?.find((t: any) => t.type === 'MANUAL')?.count || 0}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Manual</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-3xl font-bold text-purple-600">{analytics.byTrigger?.find((t: any) => t.type === 'REOPEN_LIMIT')?.count || 0}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Reopen Limit</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Level */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">📊 By Escalation Level</h3>
              <div className="space-y-3">
                {analytics.byLevel?.map((level: any) => {
                  const maxCount = Math.max(...(analytics.byLevel?.map((l: any) => l.count) || [1]));
                  return (
                    <div key={level.level} className="flex items-center gap-3">
                      <div className="w-28">
                        <span className="text-xs font-medium text-slate-600">L{level.level}: {LEVEL_LABELS[level.level] || level.label}</span>
                      </div>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-700"
                          style={{ width: `${(level.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 w-8 text-right">{level.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Team */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">🏢 By Team</h3>
              <div className="space-y-3">
                {analytics.byTeam?.map((team: any) => {
                  const maxCount = Math.max(...(analytics.byTeam?.map((t: any) => t.count) || [1]));
                  return (
                    <div key={team.team} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 w-28 truncate">{team.team}</span>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all duration-700"
                          style={{ width: `${(team.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 w-8 text-right">{team.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">🏷️ Top Escalated Categories</h3>
              <div className="flex flex-wrap gap-2">
                {analytics.topCategories?.map((cat: any) => (
                  <div key={cat.category} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs font-semibold text-slate-700">{cat.category}</span>
                    <span className="ml-2 text-xs font-bold text-indigo-600">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
