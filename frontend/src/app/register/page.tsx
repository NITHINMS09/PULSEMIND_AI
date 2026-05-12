'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, Mail, Lock, User, Phone, Building2, MapPin, BadgeCheck, Eye, EyeOff, CheckCircle2, Shield } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    phone: '', employeeId: '', branch: '', jobTitle: '', organizationName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (field === 'password') setStrength(calcStrength(value));
  };

  function calcStrength(pw: string): number {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[a-z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-teal-400', 'bg-emerald-400'][strength];

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return 'First and last name are required';
    if (!form.email.trim()) return 'Email is required';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setLoading(true);
    try {
      await authApi.register(form);
      setSuccess(true);
    } catch (err: any) {
      const errBody = err.response?.data;
      // Backend may send: { message: string | string[], statusCode, error }
      const msg = errBody?.message || errBody?.data?.message;
      if (!err.response) {
        setError('Cannot reach the server. Please check your internet connection.');
      } else if (Array.isArray(msg)) {
        setError(msg.join('. '));
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-surface-secondary">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }} className="w-full max-w-md text-center">
          <div className="card-elevated p-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
              <Shield className="w-10 h-10 text-amber-500" />
            </motion.div>
            <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Account Created!</h1>
            <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <BadgeCheck className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">Pending Approval</span>
              </div>
              <p className="text-sm text-amber-700 leading-relaxed">
                Your account has been created and is waiting for organization approval.
                You will be notified once an administrator reviews your registration.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 mb-6 border border-slate-200">
              <p className="text-xs text-slate-500">Registered as</p>
              <p className="text-sm font-semibold text-slate-800">{form.firstName} {form.lastName}</p>
              <p className="text-xs text-slate-500">{form.email}</p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-all text-sm">
              Go to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-teal-400/20 blur-3xl" />
        </div>
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">PulseMind<span className="text-brand-200">AI</span></span>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold text-white mb-4 leading-tight">
            Join Your Organization&apos;s<br />Intelligence Platform
          </h2>
          <p className="text-brand-200 text-lg leading-relaxed max-w-md">
            Create your account to start sharing feedback, accessing wellness insights, and connecting with your team.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: '🔒', text: 'Enterprise-grade security' },
              { icon: '👤', text: 'Admin-approved accounts' },
              { icon: '🤖', text: 'AI-powered insights' },
              { icon: '💬', text: 'Anonymous feedback option' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-brand-200 text-sm">
                <span className="text-lg">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-brand-300 text-sm">© 2024 PulseMind AI</div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }} className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-teal-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">PulseMind<span className="text-brand-600">AI</span></span>
          </div>

          <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Create Account</h1>
          <p className="text-sm text-text-secondary mb-6">Fill in your details to register for PulseMind AI</p>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-danger-50 text-danger-500 text-sm px-4 py-3 rounded-lg mb-4 border border-danger-100">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">First Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required
                    placeholder="John" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">Last Name *</label>
                <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required
                  placeholder="Doe" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required
                  placeholder="john@company.com" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
              </div>
            </div>

            {/* Employee ID & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">Employee ID</label>
                <input value={form.employeeId} onChange={(e) => update('employeeId', e.target.value)}
                  placeholder="EMP-001 (auto if empty)" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input value={form.phone} onChange={(e) => update('phone', e.target.value)}
                    placeholder="+1 234 567 890" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
                </div>
              </div>
            </div>

            {/* Job Title & Branch */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">Job Title</label>
                <input value={form.jobTitle} onChange={(e) => update('jobTitle', e.target.value)}
                  placeholder="Software Engineer" className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">Branch</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input value={form.branch} onChange={(e) => update('branch', e.target.value)}
                    placeholder="HQ / Office Name" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
                </div>
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">Organization</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input value={form.organizationName} onChange={(e) => update('organizationName', e.target.value)}
                  placeholder="Your company name" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => update('password', e.target.value)} required minLength={8}
                  placeholder="Min 8 characters" className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-medium ${strength >= 4 ? 'text-teal-600' : strength >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="password" value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)} required
                  placeholder="Repeat password" className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
                )}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Info */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your account will require administrator approval before you can log in.
                  You&apos;ll receive a notification once your account is reviewed.
                </p>
              </div>
            </div>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
