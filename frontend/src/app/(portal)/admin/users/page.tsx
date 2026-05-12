'use client';
export default function UsersPage() {
  const users = [
    { name: 'Alex Morgan', email: 'admin@demo.pulsemind.ai', role: 'SUPER_ADMIN', dept: 'HR', status: 'Active' },
    { name: 'Sarah Chen', email: 'hr@demo.pulsemind.ai', role: 'HR_MANAGER', dept: 'HR', status: 'Active' },
    { name: 'James Wilson', email: 'employee@demo.pulsemind.ai', role: 'EMPLOYEE', dept: 'Engineering', status: 'Active' },
    { name: 'Priya Sharma', email: 'dev1@innovex.tech', role: 'EMPLOYEE', dept: 'Engineering', status: 'Active' },
    { name: 'Michael Brown', email: 'dev2@innovex.tech', role: 'TEAM_MEMBER', dept: 'Engineering', status: 'Active' },
    { name: 'Tom Anderson', email: 'sales1@innovex.tech', role: 'TEAM_MEMBER', dept: 'Sales', status: 'Active' },
  ];
  const roleColors: Record<string,string> = { SUPER_ADMIN: 'badge-danger', HR_MANAGER: 'badge-warning', TEAM_MEMBER: 'badge-info', EMPLOYEE: 'badge-neutral' };
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-2xl font-bold text-text-primary">User Management</h1><p className="text-sm text-text-secondary">Manage roles and permissions</p></div>
        <button className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-all">+ Invite User</button>
      </div>
      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface-secondary">
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Name</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Email</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Role</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Department</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email} className="border-b border-border hover:bg-surface-secondary transition-colors">
                <td className="px-4 py-3 font-medium text-text-primary">{u.name}</td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3"><span className={`badge ${roleColors[u.role]}`}>{u.role.replace('_',' ')}</span></td>
                <td className="px-4 py-3 text-text-secondary">{u.dept}</td>
                <td className="px-4 py-3"><span className="badge badge-success">{u.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
