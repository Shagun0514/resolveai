import { Priority, Status, Sentiment, Channel } from '../../types';
import { priorityConfig, statusConfig, sentimentConfig, channelConfig } from '../../utils/helpers';

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = priorityConfig[priority];
  return (
    <span className={`badge ${c.bg} ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const c = statusConfig[status];
  return <span className={`badge ${c.bg} ${c.color}`}>{c.label}</span>;
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const c = sentimentConfig[sentiment];
  return (
    <span className={`badge bg-white/5 border border-white/10 ${c.color} gap-1`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: Channel }) {
  const c = channelConfig[channel];
  return (
    <span className="badge bg-white/5 border border-white/10 text-slate-400">
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

export function SLABadge({ sla_due_at, status, is_overdue }: {
  sla_due_at?: string; status: Status; is_overdue?: boolean
}) {
  if (!sla_due_at || status === 'resolved' || status === 'closed') return null;
  const overdue = is_overdue || new Date(sla_due_at) < new Date();
  const diff = Math.abs(new Date(sla_due_at).getTime() - Date.now());
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  if (overdue) {
    return (
      <span className="badge bg-rose-500/15 border border-rose-500/30 text-rose-400 animate-pulse">
        ⚠ Overdue {hours}h {mins}m
      </span>
    );
  }

  const urgency = hours < 2
    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
    : 'bg-white/5 border border-white/10 text-slate-400';

  return (
    <span className={`badge ${urgency}`}>
      ⏱ {hours}h {mins}m left
    </span>
  );
}
