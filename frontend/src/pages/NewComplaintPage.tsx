import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { CATEGORIES } from '../utils/helpers';

export default function NewComplaintPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    channel: 'web', priority: 'medium',
    subject: '', description: '',
    customer_name: '', customer_email: '',
    customer_phone: '', customer_account_number: '',
  });
  const [error, setError] = useState('');

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/complaints', data),
    onSuccess: (res) => navigate(`/complaints/${res.data.complaint.id}`),
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to create complaint'),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate(form);
  };

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <button onClick={() => navigate('/complaints')} className="btn-ghost text-sm mb-4 -ml-2">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="mb-6">
        <h1 className="font-display font-bold text-xl text-white">New Complaint</h1>
        <p className="text-slate-500 text-sm mt-0.5">AI analysis will run automatically on submission</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer info */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Full Name *</label>
              <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)}
                className="input" placeholder="John Smith" required />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Email *</label>
              <input type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)}
                className="input" placeholder="john@email.com" required />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Phone</label>
              <input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)}
                className="input" placeholder="+1-555-0000" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Account Number</label>
              <input value={form.customer_account_number} onChange={e => set('customer_account_number', e.target.value)}
                className="input" placeholder="****1234" />
            </div>
          </div>
        </div>

        {/* Complaint details */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">Complaint Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Channel</label>
              <select value={form.channel} onChange={e => set('channel', e.target.value)} className="input">
                {['email','chat','web','api','phone'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className="input">
                {['low','medium','high','critical'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Subject *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)}
              className="input" placeholder="Brief summary of the issue" required />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="input resize-none" rows={6}
              placeholder="Detailed description of the complaint…" required />
          </div>
        </div>

        {/* AI notice */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-accent-violet/5 border border-accent-violet/15">
          <Sparkles size={14} className="text-accent-violet mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            AI will automatically classify this complaint, detect sentiment, extract key entities,
            generate a summary, and draft a suggested response upon submission.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary disabled:opacity-50">
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing with AI…
              </span>
            ) : (
              <><Sparkles size={14} /> Submit & Analyze</>
            )}
          </button>
          <button type="button" onClick={() => navigate('/complaints')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
