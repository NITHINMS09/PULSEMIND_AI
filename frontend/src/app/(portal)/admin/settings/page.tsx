'use client';
export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-text-primary">Organization Settings</h1>
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-display font-semibold text-text-primary">Branding</h3>
        <div><label className="text-sm font-medium text-text-primary mb-1 block">Company Name</label><input value="Innovex Technologies" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm" readOnly /></div>
        <div><label className="text-sm font-medium text-text-primary mb-1 block">Company Website</label><input value="https://innovex.tech" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm" readOnly /></div>
      </div>
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-display font-semibold text-text-primary">Notification Preferences</h3>
        {['Email notifications', 'In-app push notifications', 'Weekly digest emails'].map((s) => (
          <div key={s} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
            <span className="text-sm text-text-primary">{s}</span>
            <div className="w-10 h-6 bg-brand-600 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1" /></div>
          </div>
        ))}
      </div>
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-display font-semibold text-text-primary">Data & Privacy</h3>
        <div className="p-3 rounded-lg bg-surface-secondary text-sm text-text-secondary">Data retention: 2 years • GDPR compliant • AES-256 encryption</div>
      </div>
    </div>
  );
}
