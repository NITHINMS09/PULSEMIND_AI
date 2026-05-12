'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, X, Filter, Clock, Shield, AlertTriangle, MessageSquare, Brain, Users } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { useNotificationStore } from '@/stores';
import type { Notification } from '@/types';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  COMPLAINT_SUBMITTED: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  COMPLAINT_ASSIGNED: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  COMPLAINT_RESOLVED: { icon: Check, color: 'text-teal-600', bg: 'bg-teal-50' },
  COMPLAINT_ESCALATED: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  STATUS_UPDATE: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  AI_INSIGHT: { icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
  SLA_BREACH: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  RESOLUTION_PENDING: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ESCALATION: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ACCOUNT_APPROVED: { icon: Shield, color: 'text-teal-600', bg: 'bg-teal-50' },
  ACCOUNT_REJECTED: { icon: X, color: 'text-red-600', bg: 'bg-red-50' },
  ACCOUNT_SUSPENDED: { icon: Shield, color: 'text-slate-600', bg: 'bg-slate-100' },
  PENDING_APPROVAL: { icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
  HR_MESSAGE: { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  SYSTEM_ALERT: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  BADGE_EARNED: { icon: Check, color: 'text-amber-600', bg: 'bg-amber-50' },
  WELLNESS_TIP: { icon: Brain, color: 'text-teal-600', bg: 'bg-teal-50' },
};

function getRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load notifications on open
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  // Poll for unread count every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const { data } = await notificationsApi.list({ limit: 50 });
      const items = data?.data || data || [];
      setNotifications(Array.isArray(items) ? items : []);
    } catch {}
  }

  async function handleMarkRead(id: string) {
    markAsRead(id);
    try { await notificationsApi.markRead(id); } catch {}
  }

  async function handleMarkAllRead() {
    markAllAsRead();
    try { await notificationsApi.markAllRead(); } catch {}
  }

  async function handleDelete(id: string) {
    setNotifications(notifications.filter(n => n.id !== id));
    try { await notificationsApi.delete(id); } catch {}
  }

  async function handleClearAll() {
    clearAll();
    try { await notificationsApi.clearAll(); } catch {}
  }

  // Group notifications
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
  const todayNotifs = filtered.filter(n => new Date(n.createdAt) >= today);
  const yesterdayNotifs = filtered.filter(n => new Date(n.createdAt) >= yesterday && new Date(n.createdAt) < today);
  const olderNotifs = filtered.filter(n => new Date(n.createdAt) < yesterday);

  const groups = [
    { label: 'Today', items: todayNotifs },
    { label: 'Yesterday', items: yesterdayNotifs },
    { label: 'Older', items: olderNotifs },
  ].filter(g => g.items.length > 0);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-lg bg-surface-secondary hover:bg-surface-tertiary flex items-center justify-center transition-colors">
        <Bell className="w-[18px] h-[18px] text-text-secondary" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-danger-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-12 w-[400px] max-h-[520px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/60 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-r from-white to-surface-secondary/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-text-primary text-base">Notifications</h3>
                <div className="flex items-center gap-1">
                  <button onClick={handleMarkAllRead} title="Mark all as read"
                    className="w-7 h-7 rounded-lg hover:bg-surface-secondary flex items-center justify-center text-text-muted hover:text-brand-600 transition-colors">
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button onClick={handleClearAll} title="Clear all"
                    className="w-7 h-7 rounded-lg hover:bg-surface-secondary flex items-center justify-center text-text-muted hover:text-danger-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-lg hover:bg-surface-secondary flex items-center justify-center text-text-muted transition-colors ml-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1">
                <button onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filter === 'all' ? 'bg-brand-100 text-brand-700' : 'text-text-muted hover:bg-surface-secondary'}`}>
                  All
                </button>
                <button onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filter === 'unread' ? 'bg-brand-100 text-brand-700' : 'text-text-muted hover:bg-surface-secondary'}`}>
                  Unread {unreadCount > 0 && <span className="ml-1 text-[10px] font-bold">({unreadCount})</span>}
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[380px] scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                  <Bell className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs">You&apos;re all caught up!</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.label}>
                    <div className="px-5 py-2 bg-surface-secondary/50">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{group.label}</span>
                    </div>
                    {group.items.map((notif) => {
                      const tc = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM_ALERT;
                      const Icon = tc.icon;
                      return (
                        <motion.div key={notif.id} layout
                          className={`flex items-start gap-3 px-5 py-3 border-b border-border/30 cursor-pointer transition-colors group ${
                            !notif.isRead ? 'bg-brand-50/30' : 'hover:bg-surface-secondary/30'
                          }`}
                          onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                        >
                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-lg ${tc.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Icon className={`w-4 h-4 ${tc.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                                {notif.title}
                              </p>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.body}</p>
                            <p className="text-[10px] text-text-muted/70 mt-1">{getRelativeTime(notif.createdAt)}</p>
                          </div>

                          {/* Delete */}
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                            className="w-6 h-6 rounded-md hover:bg-danger-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            <X className="w-3 h-3 text-text-muted hover:text-danger-500" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
