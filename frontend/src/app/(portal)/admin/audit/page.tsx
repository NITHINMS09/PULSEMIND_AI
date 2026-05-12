'use client';
export default function AuditPage() {
  const logs = [
    { user: 'Alex Morgan', action: 'LOGIN', entity: 'auth', time: '10 min ago' },
    { user: 'Sarah Chen', action: 'UPDATE_ROLE', entity: 'users', time: '1 hour ago' },
    { user: 'System', action: 'AI_ANALYSIS', entity: 'feedback', time: '2 hours ago' },
    { user: 'Alex Morgan', action: 'EXPORT_REPORT', entity: 'analytics', time: '5 hours ago' },
    { user: 'Sarah Chen', action: 'RESOLVE_COMPLAINT', entity: 'complaints', time: '1 day ago' },
  ];
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Audit Logs</h1>
      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface-secondary">
            <th className="text-left px-4 py-3 font-medium text-text-secondary">User</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Action</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Entity</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Time</th>
          </tr></thead>
          <tbody>
            {logs.map((l,i) => (
              <tr key={i} className="border-b border-border hover:bg-surface-secondary transition-colors">
                <td className="px-4 py-3 font-medium text-text-primary">{l.user}</td>
                <td className="px-4 py-3"><span className="font-mono text-xs bg-surface-secondary px-2 py-1 rounded">{l.action}</span></td>
                <td className="px-4 py-3 text-text-secondary">{l.entity}</td>
                <td className="px-4 py-3 text-text-muted">{l.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
