'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MessageSquareText, CheckCircle2, Zap, Heart, Brain, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const moods = [
  { emoji: '😢', label: 'Very Unhappy', value: 1 },
  { emoji: '😟', label: 'Unhappy', value: 2 },
  { emoji: '😐', label: 'Neutral', value: 3 },
  { emoji: '🙂', label: 'Happy', value: 4 },
  { emoji: '😄', label: 'Very Happy', value: 5 },
];

const trend = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`, score: 60 + Math.floor(Math.sin(i / 3) * 15 + Math.random() * 10),
}));

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const [mood, setMood] = useState<number | null>(null);
  const ws = 72;
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">{greet}, {user?.firstName}! 👋</h1>
          <p className="text-brand-200 mb-6 max-w-lg">Your wellness score is {ws}/100 this week.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/feedback" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition-all text-sm">
              <MessageSquareText className="w-4 h-4" /> Submit Feedback
            </Link>
            <Link href="/dashboard/history" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm">
              View Status <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Wellness Score', value: `${ws}/100`, icon: Heart, color: 'text-success-500', bg: 'bg-success-50', trend: '+5%' },
          { label: 'Total Feedback', value: '12', icon: MessageSquareText, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Resolved', value: '8', icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Streak', value: '5 days', icon: Zap, color: 'text-warning-500', bg: 'bg-warning-50' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
              {s.trend && <span className="text-xs font-medium text-success-500 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{s.trend}</span>}
            </div>
            <div className="font-display text-2xl font-bold text-text-primary">{s.value}</div>
            <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-elevated p-6">
          <h3 className="font-display font-semibold text-text-primary mb-1">Daily Mood Check-in</h3>
          <p className="text-xs text-text-muted mb-4">How are you feeling today?</p>
          <div className="flex justify-between mb-4">
            {moods.map((m) => (
              <button key={m.value} onClick={() => setMood(m.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${mood === m.value ? 'bg-brand-50 scale-110 ring-2 ring-brand-200' : 'hover:bg-surface-secondary'}`}>
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] text-text-muted">{m.label}</span>
              </button>
            ))}
          </div>
          {mood && <div className="bg-brand-50 rounded-lg p-3 text-xs text-brand-600 flex items-center gap-2"><Brain className="w-4 h-4" />Thanks for sharing!</div>}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-elevated p-6 md:col-span-2">
          <h3 className="font-display font-semibold text-text-primary mb-4">Wellness Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trend}>
              <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F46E5" stopOpacity={0.2} /><stop offset="100%" stopColor="#4F46E5" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E8EBF0', fontSize: '12px' }} />
              <Area type="monotone" dataKey="score" stroke="#4F46E5" fill="url(#wg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-elevated p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0"><Brain className="w-5 h-5 text-teal-600" /></div>
        <div>
          <h3 className="font-display font-semibold text-text-primary mb-1">AI Wellness Tip</h3>
          <p className="text-sm text-text-secondary leading-relaxed">Your stress levels have been slightly elevated. Try the 52/17 method — 52 min work, 17 min break — shown to boost productivity by 23%.</p>
        </div>
      </motion.div>
    </div>
  );
}
