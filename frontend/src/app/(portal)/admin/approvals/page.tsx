'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '@/lib/api';
import { UserCheck, UserX, Shield, Clock, Search, Filter, AlertTriangle, CheckCircle2, XCircle, Ban } from 'lucide-react';

interface PendingUser {
  id: string; email: string; firstName: string; lastName: string; employeeId: string;
  phone?: string; role: string; accountStatus: string; jobTitle?: string; branch?: string;
  departmentId?: string; department?: { name: string }; createdAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  PENDING_APPROVAL: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock, label: 'Pending' },
  APPROVED: { color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: CheckCircle2, label: 'Approved' },
  REJECTED: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle, label: 'Rejected' },
  SUSPENDED: { color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300', icon: Ban, label: 'Suspended' },
};

export default function ApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        authApi.getPendingUsers(),
        authApi.getAllUsers(),
      ]);
      setPendingUsers(pRes.data?.data || pRes.data || []);
      const allData = aRes.data?.data;
      setAllUsers(allData?.users || allData || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId);
    try {
      await authApi.approveUser(userId);
      await loadData();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }

  async function handleReject(userId: string) {
    setActionLoading(userId);
    try {
      await authApi.rejectUser(userId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      await loadData();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }

  async function handleSuspend(userId: string) {
    setActionLoading(userId);
    try {
      await authApi.suspendUser(userId);
      await loadData();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }

  async function handleActivate(userId: string) {
    setActionLoading(userId);
    try {
      await authApi.activateUser(userId);
      await loadData();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }

  const filteredUsers = (activeTab === 'pending' ? pendingUsers : allUsers).filter((u) => {
    if (search) {
      const q = search.toLowerCase();
      if (!`${u.firstName} ${u.lastName} ${u.email} ${u.employeeId}`.toLowerCase().includes(q)) return false;
    }
    if (statusFilter && u.accountStatus !== statusFilter) return false;
    return true;
  });

  const pendingCount = pendingUsers.length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-600" />
            User Approvals
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-sm font-bold rounded-full animate-pulse">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-1">Review and manage user registrations</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex gap-1 bg-surface-secondary rounded-lg p-0.5">
          <button onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-white shadow-sm text-brand-600' : 'text-text-secondary hover:text-text-primary'}`}>
            Pending {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{pendingCount}</span>}
          </button>
          <button onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-brand-600' : 'text-text-secondary hover:text-text-primary'}`}>
            All Users
          </button>
        </div>

        {/* Search */}
        <div className="flex-1 relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" />
        </div>

        {/* Status Filter (for All tab) */}
        {activeTab === 'all' && (
          <div className="flex gap-1">
            {['', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-brand-100 text-brand-700' : 'text-text-secondary hover:bg-surface-secondary'}`}>
                {s ? STATUS_CONFIG[s]?.label || s : 'All'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary border-b border-border">
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Employee</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Details</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Registered</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-text-muted">
                  {activeTab === 'pending' ? 'No pending registrations' : 'No users found'}
                </td></tr>
              ) : (
                filteredUsers.map((user) => {
                  const sc = STATUS_CONFIG[user.accountStatus] || STATUS_CONFIG.PENDING_APPROVAL;
                  const StatusIcon = sc.icon;
                  const isProcessing = actionLoading === user.id;
                  return (
                    <motion.tr key={user.id} layout className="border-b border-border/50 hover:bg-surface-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="text-xs text-text-secondary">
                            <span className="text-text-muted">ID:</span> {user.employeeId}
                          </p>
                          {user.jobTitle && <p className="text-xs text-text-secondary">{user.jobTitle}</p>}
                          {user.branch && <p className="text-xs text-text-muted">{user.branch}</p>}
                          {user.department?.name && <p className="text-xs text-text-muted">{user.department.name}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {sc.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <br />
                        <span className="text-[10px]">{new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.accountStatus === 'PENDING_APPROVAL' && (
                            <>
                              <button onClick={() => handleApprove(user.id)} disabled={isProcessing}
                                className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5" /> Approve
                              </button>
                              {rejectingId === user.id ? (
                                <div className="flex items-center gap-1">
                                  <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Reason..." className="w-28 px-2 py-1 text-xs border rounded-lg" />
                                  <button onClick={() => handleReject(user.id)} disabled={isProcessing}
                                    className="px-2 py-1 bg-red-600 text-white text-[10px] font-semibold rounded-lg hover:bg-red-700">
                                    Confirm
                                  </button>
                                  <button onClick={() => setRejectingId(null)} className="px-2 py-1 text-[10px] text-text-muted hover:bg-surface-secondary rounded-lg">
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setRejectingId(user.id)} disabled={isProcessing}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors flex items-center gap-1 border border-red-200">
                                  <UserX className="w-3.5 h-3.5" /> Reject
                                </button>
                              )}
                            </>
                          )}
                          {user.accountStatus === 'APPROVED' && (
                            <button onClick={() => handleSuspend(user.id)} disabled={isProcessing}
                              className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors border border-slate-200">
                              Suspend
                            </button>
                          )}
                          {(user.accountStatus === 'REJECTED' || user.accountStatus === 'SUSPENDED') && (
                            <button onClick={() => handleActivate(user.id)} disabled={isProcessing}
                              className="px-3 py-1.5 bg-brand-50 text-brand-600 text-xs font-semibold rounded-lg hover:bg-brand-100 disabled:opacity-50 transition-colors border border-brand-200">
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
