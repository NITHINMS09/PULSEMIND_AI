'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { teamsApi } from '@/lib/api';
import { Team, ComplaintAssignment, Complaint, COMPLAINT_STATUS_CONFIG, ComplaintStatus } from '@/types';
import ComplaintDrawer from '@/components/ComplaintDrawer';
import SLACountdown from '@/components/SLACountdown';

const TEAM_TYPE_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  TECHNICAL: { emoji: '🛠️', color: 'text-blue-700', bg: 'bg-blue-50' },
  HR: { emoji: '👥', color: 'text-purple-700', bg: 'bg-purple-50' },
  SERVICE: { emoji: '🎯', color: 'text-teal-700', bg: 'bg-teal-50' },
  INFRASTRUCTURE: { emoji: '🏗️', color: 'text-orange-700', bg: 'bg-orange-50' },
  MANAGEMENT: { emoji: '📊', color: 'text-indigo-700', bg: 'bg-indigo-50' },
  GENERAL: { emoji: '📋', color: 'text-slate-700', bg: 'bg-slate-50' },
};

export default function TeamDashboardPage() {
  const params = useParams();
  const teamType = ((params?.type as string) || '').toUpperCase();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [assignments, setAssignments] = useState<ComplaintAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) loadComplaints(selectedTeam.id);
  }, [selectedTeam, statusFilter]);

  async function loadTeams() {
    setLoading(true);
    try {
      const { data } = await teamsApi.list();
      const teamList = data?.data || data || [];
      setTeams(Array.isArray(teamList) ? teamList : []);
      // Auto-select by route type or first team
      const match = teamList.find((t: Team) => t.type === teamType) || teamList[0];
      if (match) setSelectedTeam(match);
    } catch { setTeams([]); }
    setLoading(false);
  }

  async function loadComplaints(teamId: string) {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await teamsApi.getComplaints(teamId, params);
      setAssignments(data?.data || data || []);
    } catch { setAssignments([]); }
  }

  function openDrawer(complaint: Complaint) {
    setSelectedComplaint(complaint);
    setDrawerOpen(true);
  }

  const typeConfig = TEAM_TYPE_CONFIG[selectedTeam?.type || 'GENERAL'] || TEAM_TYPE_CONFIG.GENERAL;
  const activeCount = assignments.filter((a) => a.complaint && !['RESOLVED', 'CLOSED'].includes(a.complaint.status)).length;
  const criticalCount = assignments.filter((a) => a.complaint?.priority === 'CRITICAL').length;
  const breachedCount = assignments.filter((a) => a.complaint?.slaRecord?.isResolutionBreached).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Team selector */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {teams.map((team) => {
          const tc = TEAM_TYPE_CONFIG[team.type] || TEAM_TYPE_CONFIG.GENERAL;
          return (
            <button key={team.id} onClick={() => setSelectedTeam(team)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                selectedTeam?.id === team.id
                  ? `${tc.bg} ${tc.color} border-current shadow-sm`
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>
              <span>{tc.emoji}</span>
              <span>{team.name}</span>
              <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded-full">{team.activeComplaints || 0}</span>
            </button>
          );
        })}
      </div>

      {selectedTeam && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Members', value: selectedTeam.memberCount || selectedTeam.members?.length || 0, icon: '👥', color: 'text-indigo-600' },
              { label: 'Active Queue', value: activeCount, icon: '📋', color: 'text-blue-600' },
              { label: 'Critical', value: criticalCount, icon: '🔴', color: 'text-red-600' },
              { label: 'SLA Breached', value: breachedCount, icon: '⚠️', color: 'text-orange-600' },
              { label: 'Capacity', value: `${Math.min(100, Math.round((activeCount / Math.max(selectedTeam.maxCapacity, 1)) * 100))}%`, icon: '📊', color: 'text-teal-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                <span className="text-xl">{stat.icon}</span>
                <div>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-500 font-medium">Filter:</span>
            {['', 'SUBMITTED', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'ESCALATED'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                }`}>
                {s ? (COMPLAINT_STATUS_CONFIG[s as ComplaintStatus]?.label || s) : 'All'}
              </button>
            ))}
          </div>

          {/* Complaints table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Complaint</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">SLA</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Assignee</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">No complaints in queue</td></tr>
                  ) : (
                    assignments.map((assignment) => {
                      const c = assignment.complaint;
                      if (!c) return null;
                      const sc = COMPLAINT_STATUS_CONFIG[c.status as ComplaintStatus] || COMPLAINT_STATUS_CONFIG.SUBMITTED;
                      return (
                        <tr key={assignment.id} className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                          onClick={() => openDrawer(c)}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800 line-clamp-1">{c.feedback?.title || 'Untitled'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">#{c.id.slice(0, 8)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                              c.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                              c.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>{c.priority}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bgColor} ${sc.color}`}>{sc.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            {c.slaRecord ? (
                              <SLACountdown deadline={c.slaRecord.resolutionDeadline} isBreached={c.slaRecord.isResolutionBreached} compact />
                            ) : <span className="text-[10px] text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {assignment.assignee ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center">
                                  {assignment.assignee.firstName?.[0]}{assignment.assignee.lastName?.[0]}
                                </div>
                                <span className="text-xs text-slate-600">{assignment.assignee.firstName}</span>
                              </div>
                            ) : <span className="text-[10px] text-slate-400">Unassigned</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-semibold hover:bg-indigo-100 transition-colors">
                              Open →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Complaint Drawer */}
      <ComplaintDrawer complaint={selectedComplaint} onClose={() => setDrawerOpen(false)} isOpen={drawerOpen} userRole="TEAM_MEMBER" />
    </div>
  );
}
