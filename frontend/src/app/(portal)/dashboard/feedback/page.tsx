'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, User, Tag, Star, FileText, Brain, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { feedbackApi } from '@/lib/api';

const categories = [
  { value: 'COMPLAINT', label: 'Complaint', icon: '⚠️', desc: 'Report an issue or concern' },
  { value: 'SUGGESTION', label: 'Suggestion', icon: '💡', desc: 'Share an improvement idea' },
  { value: 'SATISFACTION', label: 'Satisfaction', icon: '😊', desc: 'Express what\'s going well' },
  { value: 'WELLNESS', label: 'Wellness', icon: '💚', desc: 'Mental health & wellbeing' },
  { value: 'TOXICITY', label: 'Toxicity Report', icon: '🚨', desc: 'Report harmful behavior' },
  { value: 'WORKPLACE_SAFETY', label: 'Workplace Safety', icon: '🛡️', desc: 'Safety concerns' },
  { value: 'HR_POLICY', label: 'HR Policy', icon: '📋', desc: 'Policy-related feedback' },
  { value: 'TECHNICAL', label: 'Technical Issue', icon: '🔧', desc: 'Infrastructure or tools' },
];
const moods = ['😢', '😟', '😐', '🙂', '😄'];
const priorities = [
  { value: 'LOW', label: 'Low', color: 'bg-surface-secondary text-text-secondary' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-brand-50 text-brand-600' },
  { value: 'HIGH', label: 'High', color: 'bg-warning-50 text-warning-500' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-danger-50 text-danger-500' },
];

export default function FeedbackForm() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    category: '', priority: 'MEDIUM', title: '', content: '', starRating: 0,
    moodEmoji: '', stressLevel: 5, satisfactionScore: 50, isAnonymous: false,
  });
  const [aiPreview, setAiPreview] = useState<any>(null);

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await feedbackApi.submit({ ...form, departmentId: user?.departmentId });
      setSubmitted(true);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-success-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Feedback Submitted!</h2>
          <p className="text-text-secondary mb-6">Your feedback has been received and is being analyzed by our AI engine.</p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-all">
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Submit Feedback</h1>
      <p className="text-sm text-text-secondary mb-6">Help us improve your work experience</p>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-brand-600' : 'bg-surface-tertiary'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Identity</h2>
            <div className="card-elevated p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-text-primary mb-1 block">Full Name</label>
                  <input value={`${user?.firstName} ${user?.lastName}`} disabled className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-secondary text-sm text-text-primary" /></div>
                <div><label className="text-sm font-medium text-text-primary mb-1 block">Employee ID</label>
                  <input value={user?.employeeId || 'N/A'} disabled className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-secondary text-sm text-text-primary" /></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary">
                <input type="checkbox" checked={form.isAnonymous} onChange={(e) => update('isAnonymous', e.target.checked)}
                  className="w-4 h-4 rounded border-border text-brand-600" id="anon" />
                <label htmlFor="anon" className="text-sm text-text-secondary">Submit anonymously — your identity will be hidden</label>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><Tag className="w-5 h-5" /> Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((c) => (
                <button key={c.value} onClick={() => update('category', c.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${form.category === c.value ? 'border-brand-600 bg-brand-50' : 'border-border hover:border-brand-200'}`}>
                  <span className="text-2xl block mb-2">{c.icon}</span>
                  <span className="text-sm font-semibold text-text-primary block">{c.label}</span>
                  <span className="text-xs text-text-muted">{c.desc}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><Star className="w-5 h-5" /> Ratings & Mood</h2>
            <div className="card-elevated p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">Star Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => update('starRating', s)} className="transition-transform hover:scale-110">
                      <Star className={`w-8 h-8 ${s <= form.starRating ? 'fill-warning-500 text-warning-500' : 'text-border'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">How are you feeling?</label>
                <div className="flex gap-4">
                  {moods.map((m, i) => (
                    <button key={m} onClick={() => update('moodEmoji', m)}
                      className={`text-3xl p-2 rounded-xl transition-all ${form.moodEmoji === m ? 'bg-brand-50 scale-110 ring-2 ring-brand-200' : 'hover:bg-surface-secondary'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">Stress Level: {form.stressLevel}/10</label>
                <input type="range" min={0} max={10} value={form.stressLevel} onChange={(e) => update('stressLevel', +e.target.value)}
                  className="w-full accent-brand-600" />
                <div className="flex justify-between text-xs text-text-muted"><span>Low</span><span>High</span></div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">Priority</label>
                <div className="flex gap-2">
                  {priorities.map((p) => (
                    <button key={p.value} onClick={() => update('priority', p.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.priority === p.value ? p.color + ' ring-2 ring-offset-1' : 'bg-surface-secondary text-text-secondary'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Details</h2>
            <div className="card-elevated p-6 space-y-4">
              <div><label className="text-sm font-medium text-text-primary mb-1 block">Title</label>
                <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Brief summary..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" /></div>
              <div><label className="text-sm font-medium text-text-primary mb-1 block">Feedback Details</label>
                <textarea value={form.content} onChange={(e) => update('content', e.target.value)} rows={6}
                  placeholder="Describe your feedback in detail..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 resize-none" /></div>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><Brain className="w-5 h-5" /> AI Review</h2>
            <div className="card-elevated p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-primary">Summary</h4>
                  <div className="p-3 rounded-lg bg-surface-secondary text-sm text-text-secondary">{form.title || 'No title provided'}</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-info">{form.category || 'No category'}</span>
                    <span className="badge badge-warning">{form.priority}</span>
                    {form.moodEmoji && <span className="badge badge-neutral">{form.moodEmoji}</span>}
                    {form.isAnonymous && <span className="badge badge-neutral">🔒 Anonymous</span>}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-primary">AI Analysis Preview</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded bg-brand-50 text-brand-600"><Brain className="w-3 h-3" />Detected emotion: {form.stressLevel > 7 ? 'anxiety' : form.starRating >= 4 ? 'satisfaction' : 'neutral'}</div>
                    <div className="flex items-center gap-2 p-2 rounded bg-teal-50 text-teal-600">Urgency: {form.priority}</div>
                    <div className="flex items-center gap-2 p-2 rounded bg-surface-secondary text-text-secondary">Category confirmed: {form.category}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
          className="flex items-center gap-1 px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {step < 5 ? (
          <button onClick={() => setStep(Math.min(5, step + 1))}
            className="flex items-center gap-1 px-6 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-all">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit Feedback
          </button>
        )}
      </div>
    </div>
  );
}
