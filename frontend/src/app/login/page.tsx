'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      login(data.data.user, data.data.accessToken);
      const role = data.data.user.role;
      if (role === 'SUPER_ADMIN' || role === 'HR_MANAGER') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.response?.data?.data?.message;
      if (status === 403) {
        setError(message || 'Your account is not active. Please contact your administrator.');
      } else {
        setError(message || 'Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const creds: Record<string, { email: string; password: string }> = {
      employee: { email: 'employee@demo.pulsemind.ai', password: 'Demo@2024' },
      hr: { email: 'hr@demo.pulsemind.ai', password: 'Demo@2024' },
      admin: { email: 'admin@demo.pulsemind.ai', password: 'Demo@2024' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 flex-col justify-between relative overflow-hidden">
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
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            Organizational Intelligence<br />Meets Human Empathy
          </h2>
          <p className="text-brand-200 text-lg leading-relaxed max-w-md">
            Transform workplace culture with AI-powered feedback analysis, burnout detection, and smart recommendations.
          </p>
        </div>
        <div className="relative z-10 text-brand-300 text-sm">
          © 2024 PulseMind AI. Enterprise-grade security.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }} className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-teal-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">PulseMind<span className="text-brand-600">AI</span></span>
          </div>

          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">Welcome back</h1>
          <p className="text-text-secondary mb-8">Sign in to your PulseMind AI account</p>

          {/* Demo Credentials */}
          <div className="bg-surface-secondary rounded-xl p-4 mb-6 border border-border">
            <p className="text-xs font-medium text-text-secondary mb-3">Quick Demo Login:</p>
            <div className="flex gap-2">
              {[
                { label: 'Employee', key: 'employee' },
                { label: 'HR Manager', key: 'hr' },
                { label: 'Admin', key: 'admin' },
              ].map((d) => (
                <button key={d.key} type="button" onClick={() => fillDemo(d.key)}
                  className="flex-1 text-xs font-medium py-2 px-3 rounded-lg bg-white border border-border hover:border-brand-300 hover:text-brand-600 transition-all duration-200 text-text-secondary">
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-danger-50 text-danger-500 text-sm px-4 py-3 rounded-lg mb-4 border border-danger-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand-600 font-medium hover:text-brand-700">Create account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
