'use client';
import { useEffect, useState } from 'react';
import { teamsApi } from '@/lib/api';

export default function TeamsPage() {
  const [workload, setWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await teamsApi.workload();
        setWorkload(data?.data || data || []);
      } catch { setWorkload([]); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  const typeEmojis: Record<string, string> = { TECHNICAL: '🛠️', HR: '👥', SERVICE: '🎯', INFRASTRUCTURE: '🏗️', MANAGEMENT: '📊' };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">🏢 Team Workload</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor team capacity and complaint distribution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workload.map((team) => {
          const utilColor = team.utilizationPercent > 80 ? 'text-red-600' : team.utilizationPercent > 60 ? 'text-amber-600' : 'text-teal-600';
          const utilBg = team.utilizationPercent > 80 ? 'bg-red-400' : team.utilizationPercent > 60 ? 'bg-amber-400' : 'bg-teal-400';
          return (
            <div key={team.teamId} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{typeEmojis[team.type] || '📋'}</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{team.teamName}</h3>
                    <p className="text-[10px] text-slate-400 uppercase">{team.type}</p>
                  </div>
                </div>
                <span className={`text-xl font-bold ${utilColor}`}>{team.utilizationPercent}%</span>
              </div>

              {/* Utilization bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div className={`h-full rounded-full ${utilBg} transition-all duration-700`} style={{ width: `${Math.min(100, team.utilizationPercent)}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-indigo-600">{team.memberCount}</p>
                  <p className="text-[9px] text-slate-400 uppercase">Members</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{team.activeComplaints}</p>
                  <p className="text-[9px] text-slate-400 uppercase">Active</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-red-600">{team.criticalCount}</p>
                  <p className="text-[9px] text-slate-400 uppercase">Critical</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-orange-600">{team.highCount}</p>
                  <p className="text-[9px] text-slate-400 uppercase">High</p>
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="text-[10px] text-slate-400">Capacity: {team.activeComplaints} / {team.maxCapacity}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
