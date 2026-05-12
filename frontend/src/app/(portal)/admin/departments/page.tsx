'use client';
export default function DepartmentsPage() {
  const depts = [
    { name: 'Engineering', employees: 6, satisfaction: 72, complaints: 12, head: 'Michael Brown' },
    { name: 'Sales', employees: 4, satisfaction: 68, complaints: 8, head: 'Tom Anderson' },
    { name: 'Human Resources', employees: 3, satisfaction: 81, complaints: 3, head: 'Sarah Chen' },
    { name: 'Operations', employees: 5, satisfaction: 65, complaints: 15, head: 'Daniel Garcia' },
  ];
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Departments</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {depts.map((d) => (
          <div key={d.name} className="card-elevated p-5">
            <h3 className="font-display text-lg font-semibold text-text-primary mb-1">{d.name}</h3>
            <p className="text-xs text-text-muted mb-4">Head: {d.head}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-surface-secondary"><div className="text-lg font-bold text-text-primary">{d.employees}</div><div className="text-xs text-text-muted">Employees</div></div>
              <div className="text-center p-2 rounded-lg bg-surface-secondary"><div className="text-lg font-bold text-brand-600">{d.satisfaction}%</div><div className="text-xs text-text-muted">Satisfaction</div></div>
              <div className="text-center p-2 rounded-lg bg-surface-secondary"><div className="text-lg font-bold text-warning-500">{d.complaints}</div><div className="text-xs text-text-muted">Complaints</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
