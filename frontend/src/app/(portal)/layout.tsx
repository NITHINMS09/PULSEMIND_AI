'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, LayoutDashboard, MessageSquareText, History, Heart, Bell, User,
  BarChart3, AlertTriangle, ShieldAlert, Users, Building2, Settings,
  FileText, Cpu, ChevronRight, LogOut, Menu, X,
  GitBranch, Clock, ArrowUpCircle, CheckCircle2, Sparkles, UsersRound, ShieldCheck
} from 'lucide-react';
import { useAuthStore, useSidebarStore } from '@/stores';
import NotificationDropdown from '@/components/NotificationDropdown';

const employeeNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/feedback', label: 'Submit Feedback', icon: MessageSquareText },
  { href: '/dashboard/history', label: 'Feedback History', icon: History },
  { href: '/dashboard/wellness', label: 'Wellness', icon: Heart },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const teamNav = [
  { href: '/team/technical', label: 'Team Dashboard', icon: UsersRound },
];

const adminNav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'AI Analytics', icon: BarChart3 },
  { href: '/admin/complaints', label: 'Complaints', icon: AlertTriangle },
  { href: '/admin/burnout', label: 'Burnout Monitor', icon: ShieldAlert },
  { href: '/admin/toxicity', label: 'Toxicity Reports', icon: ShieldAlert },
  { href: '/admin/departments', label: 'Departments', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/approvals', label: 'Approvals', icon: ShieldCheck },
  // Phase 2 Admin
  { href: '/admin/teams', label: 'Teams', icon: UsersRound },
  { href: '/admin/routing-config', label: 'AI Routing', icon: GitBranch },
  { href: '/admin/sla-settings', label: 'SLA Settings', icon: Clock },
  { href: '/admin/escalations', label: 'Escalations', icon: ArrowUpCircle },
  { href: '/admin/resolution-quality', label: 'Quality', icon: CheckCircle2 },
  { href: '/admin/ai-performance', label: 'AI Performance', icon: Sparkles },
  // Core
  { href: '/admin/audit', label: 'Audit Logs', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/ai-settings', label: 'AI Config', icon: Cpu },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isMobileOpen, setMobileOpen } = useSidebarStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  const isAdmin = pathname.startsWith('/admin');
  const isTeamView = pathname.startsWith('/team');
  const navItems = isAdmin ? adminNav : isTeamView ? teamNav : employeeNav;
  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin') return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-surface-secondary">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-5 border-b border-border flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-teal-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-text-primary">Pulse<span className="text-brand-600">Mind</span></span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Switcher */}
        {(user.role === 'SUPER_ADMIN' || user.role === 'TEAM_MEMBER') && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex gap-1 bg-surface-secondary rounded-lg p-0.5">
              <Link href="/dashboard"
                className={`flex-1 text-center text-xs font-medium py-1.5 rounded-md transition-all ${!isAdmin && !isTeamView ? 'bg-white shadow-sm text-brand-600' : 'text-text-secondary hover:text-text-primary'}`}>
                Employee
              </Link>
              <Link href="/team/technical"
                className={`flex-1 text-center text-xs font-medium py-1.5 rounded-md transition-all ${isTeamView ? 'bg-white shadow-sm text-brand-600' : 'text-text-secondary hover:text-text-primary'}`}>
                Team
              </Link>
              {user.role === 'SUPER_ADMIN' && (
                <Link href="/admin"
                  className={`flex-1 text-center text-xs font-medium py-1.5 rounded-md transition-all ${isAdmin ? 'bg-white shadow-sm text-brand-600' : 'text-text-secondary hover:text-text-primary'}`}>
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}>
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{item.label}</span>
              {isActive(item.href) && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-display font-semibold text-sm">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-text-muted truncate">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-all">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border flex items-center px-6 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden mr-4 text-text-secondary">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }} key={pathname}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
