'use client';
export default function AiSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-text-primary">AI Configuration</h1>
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-display font-semibold text-text-primary">Analysis Settings</h3>
        <div><label className="text-sm font-medium text-text-primary mb-1 block">Analysis Frequency</label>
          <select className="w-full px-3 py-2.5 rounded-lg border border-border text-sm"><option>Real-time</option><option>Hourly</option><option>Daily</option></select></div>
        <div><label className="text-sm font-medium text-text-primary mb-1 block">Toxicity Sensitivity Threshold</label>
          <input type="range" min={0} max={100} defaultValue={70} className="w-full accent-brand-600" /><div className="flex justify-between text-xs text-text-muted"><span>Lenient</span><span>Strict</span></div></div>
        <div><label className="text-sm font-medium text-text-primary mb-1 block">Burnout Alert Threshold</label>
          <input type="range" min={0} max={100} defaultValue={60} className="w-full accent-brand-600" /><div className="flex justify-between text-xs text-text-muted"><span>Conservative</span><span>Aggressive</span></div></div>
      </div>
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-display font-semibold text-text-primary">Model & Usage</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-surface-secondary"><div className="text-xs text-text-muted">Model</div><div className="text-sm font-medium text-text-primary font-mono">GPT-4o</div></div>
          <div className="p-3 rounded-lg bg-surface-secondary"><div className="text-xs text-text-muted">Token Usage (This Month)</div><div className="text-sm font-medium text-text-primary">142,387 tokens</div></div>
        </div>
      </div>
    </div>
  );
}
