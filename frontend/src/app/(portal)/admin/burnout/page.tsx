'use client';
export default function BurnoutPage() {
  const users = [
    { name: 'Raj Patel', dept: 'Engineering', score: 82, risk: 'CRITICAL', trend: [60,65,70,75,82] },
    { name: 'Lisa Wang', dept: 'Engineering', score: 68, risk: 'HIGH', trend: [50,55,60,65,68] },
    { name: 'Tom Anderson', dept: 'Sales', score: 55, risk: 'MODERATE', trend: [45,48,50,52,55] },
    { name: 'Emily Davis', dept: 'Engineering', score: 42, risk: 'MODERATE', trend: [35,38,40,41,42] },
    { name: 'Nicole Johnson', dept: 'HR', score: 25, risk: 'LOW', trend: [30,28,26,25,25] },
  ];
  const riskColors: Record<string, string> = { CRITICAL: 'text-danger-500 bg-danger-50', HIGH: 'text-warning-500 bg-warning-50', MODERATE: 'text-brand-600 bg-brand-50', LOW: 'text-success-500 bg-success-50' };
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Burnout Monitoring</h1>
      <p className="text-sm text-text-secondary mb-6">Employee burnout risk scores and trends</p>
      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface-secondary">
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Employee</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Department</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Score</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Risk Level</th>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">Trend</th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.name} className="border-b border-border hover:bg-surface-secondary transition-colors">
                <td className="px-4 py-3 font-medium text-text-primary">{u.name}</td>
                <td className="px-4 py-3 text-text-secondary">{u.dept}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-2 bg-surface-tertiary rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${u.score}%`, backgroundColor: u.score > 70 ? '#E11D48' : u.score > 50 ? '#D97706' : '#059669' }} /></div><span className="text-text-primary font-medium">{u.score}</span></div></td>
                <td className="px-4 py-3"><span className={`badge ${riskColors[u.risk]}`}>{u.risk}</span></td>
                <td className="px-4 py-3"><div className="flex items-end gap-0.5 h-5">{u.trend.map((v,i)=>(<div key={i} className="w-1.5 rounded-full" style={{ height: `${v/100*20}px`, backgroundColor: v > 70 ? '#E11D48' : v > 50 ? '#D97706' : '#059669' }} />))}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
