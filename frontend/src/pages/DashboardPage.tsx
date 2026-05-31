import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, AlertTriangle, Clock, CheckCircle2,
  ArrowRight, Flame, Activity
} from 'lucide-react';
import api from '../services/api';
import { Analytics, Complaint } from '../types';
import { PriorityBadge, StatusBadge, SentimentBadge, SLABadge } from '../components/shared/Badges';
import { formatRelative, categoryIcon, sentimentConfig } from '../utils/helpers';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color, onClick }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; onClick?: () => void;
}) {
  return (
    <div
      className={`card cursor-pointer hover:scale-[1.01] transition-transform ${onClick ? 'border-animated' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={17} />
        </div>
        <TrendingUp size={12} className="text-slate-600" />
      </div>
      <div className="text-2xl font-display font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ['analytics'],
    queryFn: async () => (await api.get('/analytics')).data,
  });

  const { data: recentData } = useQuery({
    queryKey: ['complaints-recent'],
    queryFn: async () => (await api.get('/complaints?limit=8&sort=created_at&order=DESC')).data,
  });

  const { data: criticalData } = useQuery({
    queryKey: ['complaints-critical'],
    queryFn: async () => (await api.get('/complaints?priority=critical&status=open&limit=5')).data,
  });

  const recent: Complaint[] = recentData?.complaints || [];
  const critical: Complaint[] = criticalData?.complaints || [];

  const statusMap = Object.fromEntries((analytics?.by_status || []).map(s => [s.status, parseInt(s.count)]));
  const open = (statusMap['open'] || 0) + (statusMap['in_progress'] || 0) + (statusMap['escalated'] || 0);

  const trendData = (analytics?.trend || []).slice(-14).map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    count: parseInt(d.count)
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-xl text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Complaint intelligence overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity} label="Total Complaints" value={analytics?.totals.all ?? '—'}
          color="bg-brand-600/20 text-brand-400"
          onClick={() => navigate('/complaints')}
        />
        <StatCard
          icon={Clock} label="Open / Active" value={open || '—'}
          color="bg-amber-500/20 text-amber-400"
          onClick={() => navigate('/complaints?status=open')}
        />
        <StatCard
          icon={AlertTriangle} label="SLA Overdue" value={analytics?.sla.overdue ?? '—'}
          sub="Needs immediate attention"
          color="bg-rose-500/20 text-rose-400"
        />
        <StatCard
          icon={CheckCircle2} label="Resolved" value={analytics?.sla.resolved ?? '—'}
          sub={analytics?.sla.avg_resolution_hours ? `Avg ${analytics.sla.avg_resolution_hours}h` : undefined}
          color="bg-emerald-500/20 text-emerald-400"
        />
      </div>

      {/* Trend + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Complaint Trend</h3>
              <p className="text-xs text-slate-500">Last 14 days</p>
            </div>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>

        {/* Categories */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">By Category</h3>
          <p className="text-xs text-slate-500 mb-4">Top complaint types</p>
          <div className="space-y-2.5">
            {(analytics?.by_category || []).slice(0, 6).map((c) => {
              const total = (analytics?.by_category || []).reduce((s, x) => s + parseInt(x.count), 0) || 1;
              const pct = Math.round((parseInt(c.count) / total) * 100);
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span>{categoryIcon[c.category] || '📋'}</span>
                      {c.category}
                    </span>
                    <span className="text-xs font-medium text-slate-300">{c.count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5">
                    <div
                      className="h-1 rounded-full bg-brand-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Critical */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-rose-400" />
              <h3 className="text-sm font-semibold text-slate-200">Critical Open</h3>
            </div>
            <button onClick={() => navigate('/complaints?priority=critical')} className="btn-ghost text-xs">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {critical.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-4">No critical complaints 🎉</p>
            )}
            {critical.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/complaints/${c.id}`)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/[0.06] glow-critical"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{c.subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.customer_name} · {c.ticket_number}</p>
                </div>
                <SLABadge sla_due_at={c.sla_due_at} status={c.status} is_overdue={c.is_overdue} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Recent Activity</h3>
            <button onClick={() => navigate('/complaints')} className="btn-ghost text-xs">
              All <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {recent.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/complaints/${c.id}`)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate group-hover:text-slate-100 transition-colors">{c.subject}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-600">{c.ticket_number}</span>
                    <span className="text-[10px] text-slate-600">{formatRelative(c.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StatusBadge status={c.status} />
                  {c.ai_sentiment && <SentimentBadge sentiment={c.ai_sentiment} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentiment breakdown */}
      {analytics?.by_sentiment && analytics.by_sentiment.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Sentiment Distribution</h3>
          <div className="grid grid-cols-4 gap-3">
            {(['very_negative', 'negative', 'neutral', 'positive'] as const).map(s => {
              const found = analytics.by_sentiment.find(x => x.sentiment === s);
              const count = found ? parseInt(found.count) : 0;
              const total = analytics.by_sentiment.reduce((a, x) => a + parseInt(x.count), 0) || 1;
              const pct = Math.round((count / total) * 100);
              const c = sentimentConfig[s];
              return (
                <div key={s} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className={`text-lg font-display font-bold ${c.color}`}>{pct}%</div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
                  <div className="text-xs text-slate-600">{count} cases</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
