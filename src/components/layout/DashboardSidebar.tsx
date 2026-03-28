import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  DollarSign,
  Bell,
  Settings,
} from 'lucide-react';
import { VestaBrand } from '@/components/ui/finlo-brand';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/app', icon: <LayoutDashboard size={18} /> },
  { label: 'AI Briefing', to: '/app/insights', icon: <Sparkles size={18} /> },
  { label: 'Revenue', to: '/app/revenue', icon: <TrendingUp size={18} /> },
  { label: 'Costs', to: '/app/costs', icon: <DollarSign size={18} /> },
  { label: 'Alerts', to: '/app/alerts', icon: <Bell size={18} /> },
  { label: 'Settings', to: '/app/settings', icon: <Settings size={18} /> },
];

export const DashboardSidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    return location.pathname.startsWith(to);
  };

  return (
    <aside
      className="flex flex-col h-full shrink-0"
      style={{ width: 240, backgroundColor: '#1B3A5C' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <VestaBrand size="sm" variant="dark" />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                'relative',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5',
              )}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {/* Active gold left border */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ backgroundColor: '#C8963E' }}
                />
              )}
              <span className={cn('flex items-center', active ? 'text-white' : 'text-white/60')}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer accent */}
      <div
        className="px-5 py-4 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <p
          className="text-[10px] uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono', monospace" }}
        >
          AI CFO for Hotels
        </p>
      </div>
    </aside>
  );
};
