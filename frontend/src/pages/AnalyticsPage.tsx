import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import api from '../services/api';
import { Analytics } from '../types';
import { categoryIcon, sentimentConfig } from '../utils/helpers';
import { format } from 'date-fns';

const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#f59e0b','#10b981','#f43f5e','#ec4899','#14b8a6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['analytics'],
    queryFn: async () => (await api.get('/analytics')).data,
  });

  if (isLoading) return (
    <div className="p-6 grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton rounded-xl h-56" />
      ))}
    </div>
  );

 const sentimentData = (analytics?.by_sentiment || []).map(s => ({
  name: sentimentConfig[s.sentiment as Sentiment]?.label || s.sentiment,
  value: parseInt(s.count),
  icon: sentimentConfig[s.sentiment as Sentiment]?.icon,
    color: { positive: '#10b981', neutral: '#94a3b8', negative: '#f59e0b', very_negative: '#f43f5e' }[s.sentiment] || '#94a3b8'
  }));

  const categoryData = (analytics?.by_category || []).map((c, i) => ({
    name: (categoryIcon[c.category] || '') + ' ' + c.category,
    count: parseInt(c.count),
    fill: COLORS[i % COLORS.length]
  }));

  const channelData = (analytics?.by_channel || []).map(c => ({
    name: c.channel,
    value: parseInt(c.count)
  }));

  const trendData = (analytics?.trend || []).slice(-30).map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    complaints: parseInt(d.count)
  }));

  const statusData = (analytics?.by_status || []).map(s => ({
    name: s.status.replace('_', ' '),
    value: parseInt(s.count),
    color: {
      open: '#38bdf8', in_progress: '#a78bfa', pending: '#fbbf24',
      escalated: '#f87171', resolved: '#34d399', closed: '#64748b'
    }[s.status] || '#94a3b8'
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-xl text-white">Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Complaint intelligence & performance metrics</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Complaints', value: analytics?.totals.all ?? 0, color: 'text-brand-400' },
          { label: 'Currently Open', value: analytics?.totals.open ?? 0, color: 'text-amber-400' },
          { label: 'SLA Breached', value: analytics?.sla.breached ?? 0, color: 'text-rose-400' },
          { label: 'Avg Resolution', value: analytics?.sla.avg_resolution_hours ? `${analytics.sla.avg_resolution_hours}h` : '—', color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`text-3xl font-display font-bold ${color} mb-1`}>{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Trend + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Daily Complaint Volume (30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="complaints" stroke="#3b82f6" strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#60a5fa' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">By Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusData} cx="50%" cy="50%"
                innerRadius={50} outerRadius={75}
                dataKey="value" paddingAngle={3}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="capitalize">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category bars + Sentiment + Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="name" type="category"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false} tickLine={false} width={160}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          {/* Sentiment */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Sentiment Split</h3>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={sentimentData} cx="50%" cy="50%" outerRadius={50} dataKey="value" paddingAngle={3}>
                  {sentimentData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {sentimentData.map(s => (
                <div key={s.name} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    {s.icon} {s.name}
                  </span>
                  <span className="text-slate-300 font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Channel */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">By Channel</h3>
            <div className="space-y-2">
              {channelData.map((c, i) => {
                const total = channelData.reduce((s, x) => s + x.value, 0) || 1;
                const pct = Math.round((c.value / total) * 100);
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-slate-400 capitalize">{c.name}</span>
                      <span className="text-[10px] text-slate-300 font-medium">{c.value} ({pct}%)</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5">
                      <div
                        className="h-1 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
