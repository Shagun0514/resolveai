import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, BarChart3,
  Bell, Plus, Shield
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/complaints', icon: MessageSquare,   label: 'Complaints' },
  { to: '/analytics',  icon: BarChart3,       label: 'Analytics' },
];

const DEMO_USER = { name: 'Sarah Chen', role: 'Admin' };

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-slate-950 bg-grid-slate">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-slate-950/80 backdrop-blur-xl">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Shield size={15} className="text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-base tracking-tight">ResolveAI</span>
              <p className="text-[10px] text-slate-500 leading-tight">Banking Intelligence</p>
            </div>
          </div>
        </div>

        {/* Quick action */}
        <div className="px-4 py-4">
          <button
            onClick={() => navigate('/complaints/new')}
            className="btn-primary w-full justify-center text-xs py-2"
          >
            <Plus size={14} />
            New Complaint
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Navigation</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Static user chip */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
              {DEMO_USER.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{DEMO_USER.name}</p>
              <p className="text-[10px] text-slate-500">{DEMO_USER.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-xl flex-shrink-0">
          <div />
          <div className="flex items-center gap-2">
            <button className="btn-ghost relative">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-400" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <div className="text-xs text-slate-500">
              <span className="text-slate-300 font-medium">{DEMO_USER.name}</span>
              <span className="mx-1.5">·</span>
              <span className="capitalize px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{DEMO_USER.role}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
