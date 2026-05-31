import { Priority, Status, Sentiment, Channel } from '../types';
import { formatDistanceToNow, format, isPast } from 'date-fns';

export const formatDate = (date: string) =>
  format(new Date(date), 'MMM d, yyyy HH:mm');

export const formatRelative = (date: string) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const isOverdue = (sla_due_at?: string, status?: Status) => {
  if (!sla_due_at) return false;
  if (status === 'resolved' || status === 'closed') return false;
  return isPast(new Date(sla_due_at));
};

export const getSLAPercent = (created_at: string, sla_due_at?: string): number => {
  if (!sla_due_at) return 0;
  const start = new Date(created_at).getTime();
  const end = new Date(sla_due_at).getTime();
  const now = Date.now();
  const pct = ((now - start) / (end - start)) * 100;
  return Math.min(Math.max(pct, 0), 100);
};

export const priorityConfig: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-rose-400', bg: 'bg-rose-500/15 border border-rose-500/30', dot: 'bg-rose-400' },
  high:     { label: 'High',     color: 'text-amber-400', bg: 'bg-amber-500/15 border border-amber-500/30', dot: 'bg-amber-400' },
  medium:   { label: 'Medium',   color: 'text-blue-400',  bg: 'bg-blue-500/15 border border-blue-500/30',   dot: 'bg-blue-400' },
  low:      { label: 'Low',      color: 'text-slate-400', bg: 'bg-slate-500/15 border border-slate-500/30', dot: 'bg-slate-400' },
};

export const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  open:        { label: 'Open',        color: 'text-sky-400',    bg: 'bg-sky-500/15 border border-sky-500/30' },
  in_progress: { label: 'In Progress', color: 'text-violet-400', bg: 'bg-violet-500/15 border border-violet-500/30' },
  pending:     { label: 'Pending',     color: 'text-amber-400',  bg: 'bg-amber-500/15 border border-amber-500/30' },
  escalated:   { label: 'Escalated',   color: 'text-rose-400',   bg: 'bg-rose-500/15 border border-rose-500/30' },
  resolved:    { label: 'Resolved',    color: 'text-emerald-400',bg: 'bg-emerald-500/15 border border-emerald-500/30' },
  closed:      { label: 'Closed',      color: 'text-slate-400',  bg: 'bg-slate-500/15 border border-slate-500/30' },
};

export const sentimentConfig: Record<Sentiment, { label: string; color: string; icon: string }> = {
  positive:     { label: 'Positive',      color: 'text-emerald-400', icon: '😊' },
  neutral:      { label: 'Neutral',       color: 'text-slate-400',   icon: '😐' },
  negative:     { label: 'Negative',      color: 'text-amber-400',   icon: '😟' },
  very_negative:{ label: 'Very Negative', color: 'text-rose-400',    icon: '😠' },
};

export const channelConfig: Record<Channel, { label: string; icon: string }> = {
  email: { label: 'Email',  icon: '✉️' },
  chat:  { label: 'Chat',   icon: '💬' },
  api:   { label: 'API',    icon: '⚡' },
  phone: { label: 'Phone',  icon: '📞' },
  web:   { label: 'Web',    icon: '🌐' },
};

export const CATEGORIES = [
  'Fraud & Disputes', 'Transaction Issues', 'Loans & Mortgages',
  'Credit & Reporting', 'Digital Banking', 'ATM & Cards',
  'Account Management', 'Business Banking', 'Investments',
  'Customer Service', 'Feedback & Compliments', 'Other'
];

export const categoryIcon: Record<string, string> = {
  'Fraud & Disputes':      '🛡️',
  'Transaction Issues':    '💳',
  'Loans & Mortgages':     '🏠',
  'Credit & Reporting':    '📊',
  'Digital Banking':       '📱',
  'ATM & Cards':           '🏧',
  'Account Management':    '👤',
  'Business Banking':      '🏢',
  'Investments':           '📈',
  'Customer Service':      '🎧',
  'Feedback & Compliments':'⭐',
  'Other':                 '📋',
};
