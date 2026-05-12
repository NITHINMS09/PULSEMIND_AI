import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success-500';
  if (score >= 60) return 'text-warning-500';
  return 'text-danger-500';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-success-50';
  if (score >= 60) return 'bg-warning-50';
  return 'bg-danger-50';
}

export function getRiskLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'low': return 'text-success-500';
    case 'moderate': return 'text-warning-500';
    case 'high': return 'text-danger-500';
    case 'critical': return 'text-danger-500';
    default: return 'text-text-secondary';
  }
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export const statusColors: Record<string, string> = {
  SUBMITTED: 'badge-info',
  PENDING: 'badge-warning',
  IN_REVIEW: 'badge-info',
  IN_PROGRESS: 'badge-info',
  RESOLVED: 'badge-success',
  ESCALATED: 'badge-danger',
  CLOSED: 'badge-neutral',
};

export const priorityColors: Record<string, string> = {
  LOW: 'badge-neutral',
  MEDIUM: 'badge-info',
  HIGH: 'badge-warning',
  CRITICAL: 'badge-danger',
};

export const emotionEmojis: Record<string, string> = {
  frustration: '😤',
  anger: '😡',
  satisfaction: '😊',
  motivation: '🔥',
  anxiety: '😰',
  neutral: '😐',
  positive: '😄',
};
