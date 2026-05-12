'use client';
import { useAuthStore } from '@/stores';
export default function ProfilePage() {
  const { user } = useAuthStore();
  if (!user) return null;
  const badges = [{ name: 'First Submission', icon: '🎯' }, { name: '10-Day Streak', icon: '🔥' }];
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-text-primary">Profile</h1>
      <div className="card-elevated p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-display font-bold text-xl">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-text-secondary">{user.email}</p>
            <span className="badge badge-info mt-1">{user.role.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'Employee ID', value: user.employeeId || 'N/A' },
            { label: 'Job Title', value: user.jobTitle || 'N/A' },
            { label: 'Department', value: user.department?.name || 'Unassigned' },
            { label: 'Experience Level', value: user.experienceLevel || 'N/A' },
          ].map((f) => (
            <div key={f.label} className="p-3 rounded-lg bg-surface-secondary">
              <div className="text-xs text-text-muted mb-0.5">{f.label}</div>
              <div className="text-sm font-medium text-text-primary">{f.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card-elevated p-6">
        <h3 className="font-display font-semibold text-text-primary mb-4">Earned Badges</h3>
        <div className="flex gap-3">
          {badges.map((b) => (
            <div key={b.name} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 border border-brand-100">
              <span className="text-xl">{b.icon}</span>
              <span className="text-sm font-medium text-brand-600">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
