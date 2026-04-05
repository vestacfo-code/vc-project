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
import { VestaBrand } from '@/components/ui/vesta-brand';
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
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-vesta-navy/90 bg-gradient-to-b from-white to-vesta-mist/40">
      <div className="border-b border-vesta-navy/90 px-5 py-6">
        <VestaBrand size="sm" variant="light" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-vesta-gold/15 text-vesta-navy'
                  : 'text-vesta-navy/80 hover:bg-vesta-mist/25 hover:text-vesta-navy',
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-vesta-gold"
                  aria-hidden
                />
              )}
              <span className={cn('flex items-center', active ? 'text-vesta-navy' : 'text-vesta-navy/65')}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-vesta-navy/10 px-5 py-4">
        <p
          className="text-[10px] uppercase tracking-widest text-vesta-navy-muted"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          AI CFO for Hotels
        </p>
      </div>
    </aside>
  );
};
