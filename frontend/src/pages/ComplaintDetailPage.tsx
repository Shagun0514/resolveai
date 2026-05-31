import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Bot, Send, RefreshCw, User, Clock,
  Copy, CheckCheck, ChevronDown, Sparkles, Eye, EyeOff,
  Shield, CreditCard, AlertTriangle, CheckCircle2, Building2
} from 'lucide-react';
import api from '../services/api';
import { Complaint, Message, Status, Priority } from '../types';
import {
  PriorityBadge, StatusBadge, SentimentBadge,
  ChannelBadge, SLABadge
} from '../components/shared/Badges';
import { formatDate, formatRelative, categoryIcon, getSLAPercent } from '../utils/helpers';

// ── Customer Profile Panel ────────────────────────────────
function CustomerPanel({ customer, accounts, customerComplaints }: {
  customer: any;
  accounts: any[];
  customerComplaints: any[];
}) {
  const tierColors: Record<string, string> = {
    platinum: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/25',
    gold:     'text-amber-300 bg-amber-500/15 border-amber-500/25',
    silver:   'text-slate-300 bg-slate-500/15 border-slate-500/25',
    standard: 'text-slate-400 bg-slate-700/30 border-slate-600/25',
  };
  const accountTypeIcon: Record<string, string> = {
    checking: '🏦', savings: '💰', credit: '💳', loan: '📋',
    mortgage: '🏠', business: '🏢',
  };
  const accountStatusColor: Record<string, string> = {
    active: 'text-emerald-400', frozen: 'text-rose-400',
    closed: 'text-slate-500', suspended: 'text-amber-400',
  };

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-brand-600/20 flex items-center justify-center">
          <User size={13} className="text-brand-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Customer Profile</h3>
      </div>

      {/* Identity */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600/40 to-accent-violet/40 border border-white/10 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {customer.full_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white truncate">{customer.full_name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${tierColors[customer.customer_tier] || tierColors.standard}`}>
              {customer.customer_tier}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{customer.email}</p>
          {customer.phone && <p className="text-xs text-slate-600">{customer.phone}</p>}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
          <p className="text-lg font-display font-bold text-white">{customer.total_complaints}</p>
          <p className="text-[10px] text-slate-600">Complaints</p>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
          <p className="text-lg font-display font-bold text-white">{accounts.length}</p>
          <p className="text-[10px] text-slate-600">Accounts</p>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
          {customer.kyc_verified
            ? <CheckCircle2 size={16} className="text-emerald-400 mx-auto mb-0.5" />
            : <AlertTriangle size={16} className="text-amber-400 mx-auto mb-0.5" />}
          <p className="text-[10px] text-slate-600">KYC</p>
        </div>
      </div>

      {/* Location + since */}
      <div className="space-y-1.5">
        {(customer.city || customer.state) && (
          <div className="flex justify-between">
            <span className="text-[11px] text-slate-600">Location</span>
            <span className="text-[11px] text-slate-300">{[customer.city, customer.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {customer.customer_since && (
          <div className="flex justify-between">
            <span className="text-[11px] text-slate-600">Customer since</span>
            <span className="text-[11px] text-slate-300">{new Date(customer.customer_since).getFullYear()}</span>
          </div>
        )}
      </div>

      {/* Accounts */}
      {accounts.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Accounts</p>
          <div className="space-y-1.5">
            {accounts.map((acc: any) => (
              <div key={acc.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{accountTypeIcon[acc.account_type] || '🏦'}</span>
                  <div>
                    <p className="text-[11px] text-slate-300 capitalize">{acc.account_type}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{acc.masked_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-medium capitalize ${accountStatusColor[acc.status] || 'text-slate-400'}`}>
                    {acc.status}
                  </p>
                  {acc.balance !== null && (
                    <p className="text-[10px] text-slate-500">
                      ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous complaints */}
      {customerComplaints.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Previous Complaints</p>
          <div className="space-y-1.5">
            {customerComplaints.map((c: any) => (
              <div key={c.id} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400 truncate flex-1">{c.subject}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{c.ticket_number}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Section ────────────────────────────────────────────
function AISection({ complaint, onReanalyze, reanalyzing }: {
  complaint: Complaint;
  onReanalyze: () => void;
  reanalyzing: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-violet/20 flex items-center justify-center">
            <Sparkles size={13} className="text-accent-violet" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">AI Analysis</h3>
          {complaint.ai_processed_at && (
            <span className="text-[10px] text-slate-600">Updated {formatRelative(complaint.ai_processed_at)}</span>
          )}
        </div>
        <button onClick={onReanalyze} disabled={reanalyzing} className="btn-ghost text-xs text-accent-violet">
          <RefreshCw size={12} className={reanalyzing ? 'animate-spin' : ''} />
          {reanalyzing ? 'Analyzing…' : 'Re-analyze'}
        </button>
      </div>

      {complaint.ai_summary && (
        <div className="p-3 rounded-lg bg-accent-violet/5 border border-accent-violet/15">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-violet/70 mb-1.5">Summary</p>
          <p className="text-sm text-slate-300 leading-relaxed">{complaint.ai_summary}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
          <p className="text-[10px] text-slate-600 mb-1">Sentiment</p>
          {complaint.ai_sentiment
            ? <SentimentBadge sentiment={complaint.ai_sentiment} />
            : <span className="text-slate-600 text-xs">—</span>}
          {complaint.ai_sentiment_score !== undefined && (
            <p className="text-[10px] text-slate-600 mt-1">Score: {(complaint.ai_sentiment_score * 100).toFixed(0)}%</p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
          <p className="text-[10px] text-slate-600 mb-1">Category</p>
          <span className="text-sm">{categoryIcon[complaint.ai_category || ''] || '📋'}</span>
          <p className="text-xs text-slate-300 mt-0.5">{complaint.ai_category || '—'}</p>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
          <p className="text-[10px] text-slate-600 mb-1">Channel</p>
          <ChannelBadge channel={complaint.channel} />
        </div>
      </div>

      {complaint.ai_entities && Object.keys(complaint.ai_entities).length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Extracted Entities</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(complaint.ai_entities).map(([k, v]) => v && (
              <div key={k} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-500 capitalize">{k.replace(/_/g, ' ')}: </span>
                <span className="text-xs font-mono text-slate-300">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {complaint.ai_suggested_response && (
        <div>
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors w-full"
          >
            <Bot size={13} className="text-brand-400" />
            <span className="font-medium">AI Draft Response</span>
            <ChevronDown size={12} className={`ml-auto transition-transform ${showResponse ? 'rotate-180' : ''}`} />
          </button>
          {showResponse && (
            <div className="mt-2 p-3 rounded-lg bg-brand-600/5 border border-brand-500/20 animate-slide-up">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{complaint.ai_suggested_response}</p>
              <button onClick={() => copy(complaint.ai_suggested_response!)} className="mt-2 btn-ghost text-xs text-brand-400">
                {copied ? <><CheckCheck size={12} /> Copied!</> : <><Copy size={12} /> Copy draft</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isSystem = msg.sender_type === 'system';
  const isAgent = msg.sender_type === 'agent';

  if (isSystem) {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] text-slate-600 px-2">{msg.content}</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold
        ${!isAgent ? 'bg-slate-700 text-slate-300' : 'bg-brand-600/30 text-brand-400'}`}>
        {!isAgent ? (msg.sender_name || 'C').charAt(0) : <User size={12} />}
      </div>
      <div className={`max-w-[75%] ${isAgent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600">
            {msg.sender_user_name || msg.sender_name || (isAgent ? 'Agent' : 'Customer')}
          </span>
          <span className="text-[10px] text-slate-700">{formatRelative(msg.created_at)}</span>
          {msg.is_internal && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-500">Internal</span>
          )}
        </div>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isAgent
            ? 'bg-brand-600/20 border border-brand-500/25 text-slate-200 rounded-tr-sm'
            : msg.is_internal
              ? 'bg-amber-500/8 border border-amber-500/15 text-amber-200/80 rounded-tl-sm'
              : 'bg-white/[0.05] border border-white/[0.08] text-slate-300 rounded-tl-sm'
          }`}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => (await api.get(`/complaints/${id}`)).data,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Complaint>) => api.patch(`/complaints/${id}`, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaint', id] }),
  });

  const messageMutation = useMutation({
    mutationFn: (payload: { content: string; is_internal: boolean }) =>
      api.post(`/complaints/${id}/messages`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      setReply('');
    },
  });

  const reanalyzeMutation = useMutation({
    mutationFn: () => api.post(`/complaints/${id}/reanalyze`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaint', id] }),
  });

  const complaint: Complaint | undefined = data?.complaint;
  const messages: Message[] = data?.messages || [];
  const customer = data?.customer || null;
  console.log('customer data:', data?.customer);
  console.log('full data:', data);
  const accounts = data?.accounts || [];
  const customerComplaints = data?.customerComplaints || [];

  if (isLoading) return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton rounded-xl h-24" />
      ))}
    </div>
  );

  if (!complaint) return (
    <div className="p-6 text-center text-slate-500">Complaint not found.</div>
  );

  const slaPercent = getSLAPercent(complaint.created_at, complaint.sla_due_at);
  const slaColor = slaPercent > 90 ? 'bg-rose-500' : slaPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="p-6 animate-fade-in">
      {/* Back + header */}
      <div className="mb-5">
        <button onClick={() => navigate('/complaints')} className="btn-ghost text-sm mb-3 -ml-2">
          <ArrowLeft size={14} /> Back to Complaints
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs text-slate-500">{complaint.ticket_number}</span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
              <SLABadge sla_due_at={complaint.sla_due_at} status={complaint.status} is_overdue={complaint.is_overdue} />
            </div>
            <h1 className="font-display font-bold text-lg text-white leading-tight">{complaint.subject}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {complaint.customer_name} · {complaint.customer_email}
              {complaint.customer_phone && ` · ${complaint.customer_phone}`}
              {complaint.customer_account_number && ` · Acct: ${complaint.customer_account_number}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={complaint.status}
              onChange={(e) => updateMutation.mutate({ status: e.target.value as Status })}
              className="input text-xs w-36 py-1.5"
            >
              {(['open','in_progress','pending','resolved','closed','escalated'] as Status[]).map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              value={complaint.priority}
              onChange={(e) => updateMutation.mutate({ priority: e.target.value as Priority })}
              className="input text-xs w-28 py-1.5"
            >
              {(['low','medium','high','critical'] as Priority[]).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3-column layout on xl, 2-column otherwise */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Col 1: Conversation */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Clock size={13} className="text-slate-500" />
              Conversation History
              <span className="text-[10px] text-slate-600 font-normal ml-auto">{messages.length} messages</span>
            </h3>
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            </div>
          </div>

          {/* Reply box */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-slate-400">Reply</span>
              <button
                onClick={() => setIsInternal(!isInternal)}
                className={`ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all
                  ${isInternal
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}
              >
                {isInternal ? <EyeOff size={11} /> : <Eye size={11} />}
                {isInternal ? 'Internal note' : 'Customer reply'}
              </button>
            </div>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={isInternal ? 'Add an internal note…' : 'Type your reply to the customer…'}
              rows={4}
              className="input resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              {complaint.ai_suggested_response && (
                <button onClick={() => setReply(complaint.ai_suggested_response!)} className="btn-ghost text-xs text-accent-violet">
                  <Sparkles size={12} /> Use AI draft
                </button>
              )}
              <button
                onClick={() => messageMutation.mutate({ content: reply, is_internal: isInternal })}
                disabled={!reply.trim() || messageMutation.isPending}
                className="btn-primary text-xs ml-auto disabled:opacity-50"
              >
                <Send size={12} />
                {messageMutation.isPending ? 'Sending…' : isInternal ? 'Add Note' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>

        {/* Col 2: Right sidebar */}
        <div className="space-y-4">
          {/* Customer profile */}
          {customer
            ? <CustomerPanel customer={customer} accounts={accounts} customerComplaints={customerComplaints} />
            : (
              <div className="card p-4 text-center text-slate-600 text-xs">
                <User size={20} className="mx-auto mb-2 opacity-30" />
                No linked customer profile
              </div>
            )
          }

          {/* AI Analysis */}
          <AISection
            complaint={complaint}
            onReanalyze={() => reanalyzeMutation.mutate()}
            reanalyzing={reanalyzeMutation.isPending}
          />

          {/* SLA Progress */}
          {complaint.sla_due_at && !['resolved','closed'].includes(complaint.status) && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-400">SLA Progress</h4>
                <span className={`text-[10px] font-medium ${slaPercent > 90 ? 'text-rose-400' : slaPercent > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {slaPercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${slaColor}`} style={{ width: `${slaPercent}%` }} />
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">Due: {formatDate(complaint.sla_due_at)}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="card p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400">Details</h4>
            {[
              ['Created', formatDate(complaint.created_at)],
              ['Updated', formatDate(complaint.updated_at)],
              ['Assigned to', complaint.assigned_to_name || 'Unassigned'],
              ['First response', complaint.first_response_at ? formatRelative(complaint.first_response_at) : 'Not yet'],
              ['Messages', String(messages.length)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-2">
                <span className="text-[11px] text-slate-600">{label}</span>
                <span className="text-[11px] text-slate-300 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
