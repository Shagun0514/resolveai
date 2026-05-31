import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  SlidersHorizontal, X, UserCircle
} from 'lucide-react';
import api from '../services/api';
import { Complaint, ComplaintFilters } from '../types';
import {
  PriorityBadge, StatusBadge, SentimentBadge,
  ChannelBadge, SLABadge
} from '../components/shared/Badges';
import { formatRelative, categoryIcon } from '../utils/helpers';

const STATUSES = ['open','in_progress','pending','escalated','resolved','closed'];
const PRIORITIES = ['critical','high','medium','low'];
const SENTIMENTS = ['very_negative','negative','neutral','positive'];
const CHANNELS = ['email','chat','web','api','phone'];

export default function ComplaintsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<ComplaintFilters>({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    category: '',
    channel: '',
    sentiment: '',
    search: '',
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  const queryKey = ['complaints', filters];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
      );
      return (await api.get('/complaints', { params })).data;
    },
  });

  const complaints: Complaint[] = data?.complaints || [];
  const pagination = data?.pagination;

  const update = useCallback((key: keyof ComplaintFilters, val: string | number) => {
    setFilters(f => ({ ...f, [key]: val, ...(key !== 'page' ? { page: 1 } : {}) }));
  }, []);

  const clearFilters = () => {
    setFilters({ status: '', priority: '', category: '', channel: '', sentiment: '', search: '', page: 1, limit: 20 });
    setSearchParams({});
  };

  const activeFilterCount = [filters.status, filters.priority, filters.category, filters.channel, filters.sentiment]
    .filter(Boolean).length;

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Complaints</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pagination ? `${pagination.total} total` : 'Loading…'}
          </p>
        </div>
        <button onClick={() => navigate('/complaints/new')} className="btn-primary text-sm">
          + New Complaint
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by subject, customer, ticket #…"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            className="input pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary relative ${showFilters ? 'border-brand-500/40 text-brand-400' : ''}`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="btn-ghost text-rose-400 hover:text-rose-300">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 grid grid-cols-2 md:grid-cols-5 gap-3 animate-slide-up">
          {[
            { key: 'status', options: STATUSES, label: 'Status' },
            { key: 'priority', options: PRIORITIES, label: 'Priority' },
            { key: 'sentiment', options: SENTIMENTS, label: 'Sentiment' },
            { key: 'channel', options: CHANNELS, label: 'Channel' },
          ].map(({ key, options, label }) => (
            <div key={key}>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-600 mb-1">{label}</label>
              <select
                value={filters[key as keyof ComplaintFilters] as string}
                onChange={(e) => update(key as keyof ComplaintFilters, e.target.value)}
                className="input text-xs"
              >
                <option value="">All</option>
                {options.map(o => (
                  <option key={o} value={o}>{o.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-600 mb-1">Assigned</label>
            <select
              value={filters.assigned_to || ''}
              onChange={(e) => update('assigned_to', e.target.value)}
              className="input text-xs"
            >
              <option value="">All</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Ticket', 'Subject', 'Customer', 'Priority', 'Status', 'Channel', 'SLA', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="skeleton h-4 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && complaints.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-600">
                    No complaints found matching your filters.
                  </td>
                </tr>
              )}
              {!isLoading && complaints.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/complaints/${c.id}`)}
                  className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-slate-400 group-hover:text-brand-400 transition-colors">
                      {c.ticket_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-sm flex-shrink-0">{categoryIcon[c.ai_category || ''] || '📋'}</span>
                      <div>
                        <p className="text-sm text-slate-200 truncate max-w-[200px] group-hover:text-white transition-colors">
                          {c.subject}
                        </p>
                        {c.ai_category && (
                          <p className="text-[10px] text-slate-600 mt-0.5">{c.ai_category}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-medium text-slate-300 flex-shrink-0">
                        {c.customer_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-slate-300">{c.customer_name}</p>
                        <p className="text-[10px] text-slate-600">{c.customer_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ChannelBadge channel={c.channel} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <SLABadge sla_due_at={c.sla_due_at} status={c.status} is_overdue={c.is_overdue} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-slate-500">{formatRelative(c.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => update('page', Math.max(1, (filters.page || 1) - 1))}
                disabled={pagination.page === 1}
                className="btn-ghost p-1.5 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-slate-400 px-2">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => update('page', Math.min(pagination.pages, (filters.page || 1) + 1))}
                disabled={pagination.page === pagination.pages}
                className="btn-ghost p-1.5 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
