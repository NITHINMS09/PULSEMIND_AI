'use client';
export default function ToxicityPage() {
  const reports = [
    { id: '1', severity: 'SEVERE', excerpt: 'Inappropriate language during meeting...', dept: 'Sales', status: 'Under Review', time: '2h ago' },
    { id: '2', severity: 'MODERATE', excerpt: 'Hostile communication in team chat...', dept: 'Engineering', status: 'Reviewed', time: '1d ago' },
    { id: '3', severity: 'MILD', excerpt: 'Disrespectful comment about colleague...', dept: 'Operations', status: 'Resolved', time: '3d ago' },
  ];
  const sevColors: Record<string,string> = { SEVERE: 'badge-danger', MODERATE: 'badge-warning', MILD: 'badge-neutral' };
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Toxicity Reports</h1>
      <p className="text-sm text-text-secondary mb-6">AI-flagged submissions with harmful content</p>
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="card-elevated p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.severity === 'SEVERE' ? 'bg-danger-50' : 'bg-warning-50'}`}>
              <span className="text-lg">{r.severity === 'SEVERE' ? '🚨' : '⚠️'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{r.excerpt}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${sevColors[r.severity]}`}>{r.severity}</span>
                <span className="text-xs text-text-muted">{r.dept}</span>
                <span className="text-xs text-text-muted">• {r.status}</span>
              </div>
            </div>
            <span className="text-xs text-text-muted">{r.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
