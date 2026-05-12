'use client';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Brain, Download, TrendingUp } from 'lucide-react';

const emotionData = [
  { dept: 'Engineering', frustration: 25, satisfaction: 35, anxiety: 20, motivation: 20 },
  { dept: 'Sales', frustration: 30, satisfaction: 25, anxiety: 25, motivation: 20 },
  { dept: 'HR', frustration: 10, satisfaction: 50, anxiety: 15, motivation: 25 },
  { dept: 'Operations', frustration: 35, satisfaction: 20, anxiety: 30, motivation: 15 },
];
const sentimentTrend = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  positive: 40 + Math.floor(Math.random()*20), negative: 15 + Math.floor(Math.random()*15),
}));
const topIssues = [
  { keyword: 'workload', count: 94 }, { keyword: 'deadlines', count: 78 }, { keyword: 'communication', count: 65 },
  { keyword: 'management', count: 52 }, { keyword: 'recognition', count: 41 },
];

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-text-primary">AI Analytics</h1><p className="text-sm text-text-secondary">Organization-wide AI insights</p></div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-all">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6">
        <h3 className="font-display font-semibold text-text-primary mb-4">AI Executive Summary</h3>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-50">
          <Brain className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-text-secondary leading-relaxed">
            This week shows a 12% increase in feedback submissions with workload being the dominant theme across Engineering and Operations. 
            Burnout risk has increased for 4 employees in Engineering. Recommend immediate workload review and manager check-ins. 
            Overall sentiment remains slightly negative (-0.12) but improving from last week (-0.18).
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated p-6">
          <h3 className="font-display font-semibold text-text-primary mb-4">Emotion Heatmap by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={emotionData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="frustration" stackId="a" fill="#E11D48" />
              <Bar dataKey="anxiety" stackId="a" fill="#D97706" />
              <Bar dataKey="satisfaction" stackId="a" fill="#059669" />
              <Bar dataKey="motivation" stackId="a" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-elevated p-6">
          <h3 className="font-display font-semibold text-text-primary mb-4">Sentiment Trend (12 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sentimentTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="positive" stroke="#059669" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="negative" stroke="#E11D48" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-elevated p-6">
        <h3 className="font-display font-semibold text-text-primary mb-4">Top Issues (Word Cloud)</h3>
        <div className="flex flex-wrap gap-3">
          {topIssues.map((issue) => (
            <div key={issue.keyword} className="px-4 py-2 rounded-xl bg-surface-secondary border border-border" style={{ fontSize: `${Math.min(20, 12 + issue.count / 10)}px` }}>
              <span className="font-medium text-text-primary">{issue.keyword}</span>
              <span className="text-xs text-text-muted ml-2">({issue.count})</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
