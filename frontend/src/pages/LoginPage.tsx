import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuthStore();
  const [email, setEmail] = useState('admin@resolveai.com');
  const [password, setPassword] = useState('password123');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@resolveai.com' },
    { label: 'Agent', email: 'agent1@resolveai.com' },
    { label: 'Supervisor', email: 'supervisor@resolveai.com' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-slate flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-violet/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-600/30">
            <Shield size={26} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">ResolveAI</h1>
          <p className="text-slate-500 text-sm mt-1">Banking Complaint Intelligence</p>
        </div>

        {/* Form card */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-200 mb-5">Sign in to your account</h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@resolveai.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <p className="text-[11px] text-slate-600 mb-2 font-medium uppercase tracking-wider">Demo accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((a) => (
                <button
                  key={a.email}
                  onClick={() => { setEmail(a.email); setPassword('password123'); }}
                  className="text-[11px] py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 text-slate-400 hover:text-slate-200 transition-all text-center"
                >
                  {a.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-2 text-center">All use: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
