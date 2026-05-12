'use client';
import { motion } from 'framer-motion';
import { Heart, Brain, TrendingUp, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

const gauge = [{ name: 'Wellness', value: 72, fill: '#4F46E5' }];
const stressTrend = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, stress: 30 + Math.floor(Math.sin(i / 4) * 20 + Math.random() * 10) }));

const suggestions = [
  'Take regular breaks — try the 52/17 method for better focus.',
  'Your stress has been increasing. Consider discussing workload with your manager.',
  'Stay connected with colleagues. Social support improves resilience.',
  'Celebrate small wins daily — acknowledging progress boosts motivation.',
];

export default function WellnessPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Wellness Report</h1>
      <p className="text-sm text-text-secondary mb-6">AI-powered wellness analysis based on your feedback</p>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 text-center">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Overall Wellness Score</h3>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={gauge} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#F1F5F9' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="font-display text-3xl font-bold text-brand-600 -mt-12">72<span className="text-lg text-text-muted">/100</span></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated p-6 md:col-span-2">
          <h3 className="text-sm font-medium text-text-secondary mb-4">30-Day Stress Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={stressTrend}>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E11D48" stopOpacity={0.2} /><stop offset="100%" stopColor="#E11D48" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="stress" stroke="#E11D48" fill="url(#sg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'Stress Score', value: '42', icon: Activity, color: 'text-warning-500', bg: 'bg-warning-50' },
          { label: 'Satisfaction', value: '78%', icon: Heart, color: 'text-success-500', bg: 'bg-success-50' },
          { label: 'Engagement', value: '85%', icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Burnout Risk', value: 'Low', icon: Brain, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="card-elevated p-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
            <div className="font-display text-xl font-bold text-text-primary">{s.value}</div>
            <div className="text-xs text-text-muted">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-elevated p-6">
        <h3 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-teal-600" /> AI Wellness Suggestions</h3>
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-secondary">
              <span className="text-teal-600 mt-0.5">💡</span>
              <p className="text-sm text-text-secondary">{s}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
