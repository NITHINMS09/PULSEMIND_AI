'use client';
import { motion } from 'framer-motion';
import { BarChart3, Users, AlertTriangle, Heart, TrendingUp, TrendingDown, Activity, Brain, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const deptData = [
  { name: 'Engineering', satisfaction: 72, stress: 45, complaints: 12 },
  { name: 'Sales', satisfaction: 68, stress: 52, complaints: 8 },
  { name: 'HR', satisfaction: 81, stress: 28, complaints: 3 },
  { name: 'Operations', satisfaction: 65, stress: 58, complaints: 15 },
];
const trendData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1, feedback: Math.floor(3 + Math.random() * 8), complaints: Math.floor(1 + Math.random() * 4),
}));
const sentimentData = [
  { name: 'Positive', value: 42, color: '#059669' },
  { name: 'Neutral', value: 28, color: '#64748B' },
  { name: 'Negative', value: 30, color: '#E11D48' },
];
const alerts = [
  { type: 'CRITICAL', title: 'High Burnout Risk — Engineering', time: '2 hours ago' },
  { type: 'WARNING', title: 'Toxicity Detected in Feedback #47', time: '5 hours ago' },
  { type: 'INFO', title: 'Weekly AI Summary Ready', time: '1 day ago' },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-sm text-text-secondary">Organization health overview for Innovex Technologies</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Health Score', value: '76', icon: Activity, color: 'text-brand-600', bg: 'bg-brand-50', trend: '+3%', up: true },
          { label: 'Total Feedback', value: '148', icon: BarChart3, color: 'text-teal-600', bg: 'bg-teal-50', trend: '+12', up: true },
          { label: 'Open Complaints', value: '13', icon: AlertTriangle, color: 'text-warning-500', bg: 'bg-warning-50', trend: '-2', up: false },
          { label: 'Avg Wellness', value: '72%', icon: Heart, color: 'text-success-500', bg: 'bg-success-50', trend: '+5%', up: true },
          { label: 'Burnout Risk', value: '4', icon: AlertTriangle, color: 'text-danger-500', bg: 'bg-danger-50', trend: '+1', up: true },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-elevated p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}><kpi.icon className={`w-4 h-4 ${kpi.color}`} /></div>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.up && kpi.label !== 'Burnout Risk' ? 'text-success-500' : 'text-danger-500'}`}>
                {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{kpi.trend}
              </span>
            </div>
            <div className="font-display text-xl font-bold text-text-primary">{kpi.value}</div>
            <div className="text-xs text-text-muted">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Feedback Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-elevated p-6 lg:col-span-2">
          <h3 className="font-display font-semibold text-text-primary mb-4">30-Day Feedback Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E8EBF0', fontSize: '12px' }} />
              <Line type="monotone" dataKey="feedback" stroke="#4F46E5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="complaints" stroke="#E11D48" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="text-xs text-text-muted flex items-center gap-1"><span className="w-3 h-0.5 bg-brand-600 rounded" /> Feedback</span>
            <span className="text-xs text-text-muted flex items-center gap-1"><span className="w-3 h-0.5 bg-danger-500 rounded" /> Complaints</span>
          </div>
        </motion.div>

        {/* Alerts Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-elevated p-6">
          <h3 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2"><Bell className="w-4 h-4" /> Recent Alerts</h3>
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-secondary">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === 'CRITICAL' ? 'bg-danger-500' : a.type === 'WARNING' ? 'bg-warning-500' : 'bg-brand-600'}`} />
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  <p className="text-xs text-text-muted">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-elevated p-6">
          <h3 className="font-display font-semibold text-text-primary mb-4">Department Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E8EBF0', fontSize: '12px' }} />
              <Bar dataKey="satisfaction" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="stress" fill="#E11D48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="text-xs text-text-muted flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-600" /> Satisfaction</span>
            <span className="text-xs text-text-muted flex items-center gap-1"><span className="w-3 h-3 rounded bg-danger-500" /> Stress</span>
          </div>
        </motion.div>

        {/* Sentiment Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-elevated p-6">
          <h3 className="font-display font-semibold text-text-primary mb-4">Sentiment Distribution</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {sentimentData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {sentimentData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-text-secondary">{d.name}</span>
                  <span className="text-sm font-semibold text-text-primary ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
