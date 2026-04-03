import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { morphSpringSoft } from '@/lib/motion';
import {
  LayoutDashboard,
  AlertTriangle,
  Target,
  Plug,
  LogOut,
  FileText,
  Users,
  Settings,
  Handshake,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useHotelDashboard } from '@/hooks/useHotelDashboard';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { VestaLogo } from '@/components/VestaLogo';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/anomalies',    icon: AlertTriangle,    label: 'Anomalies' },
  { to: '/budget',       icon: Target,           label: 'Budget' },
  { to: '/reports',      icon: FileText,         label: 'Reports' },
  { to: '/team',         icon: Users,            label: 'Team' },
  { to: '/integrations', icon: Plug,             label: 'Integrations' },
  { to: '/marketplace',  icon: Handshake,        label: 'Partners' },
  { to: '/chat',         icon: MessageCircle,    label: 'Assistant' },
  { to: '/settings',    icon: Settings,         label: 'Settings' },
];

export const HotelNav = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hotelId } = useHotelDashboard();

  // Unresolved anomaly count for badge
  const { data: anomalyCount = 0 } = useQuery({
    queryKey: ['anomaly_count', hotelId],
    queryFn: async () => {
      if (!hotelId) return 0;
      const { count } = await supabase
        .from('anomalies')
        .select('id', { count: 'exact', head: true })
        .eq('hotel_id', hotelId)
        .eq('resolved', false);
      return count ?? 0;
    },
    enabled: !!hotelId,
    refetchInterval: 60_000,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const userName = user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.email?.split('@')[0]
    ?? 'You';

  return (
    <aside className="hidden lg:flex flex-col w-56 h-screen sticky top-0 shrink-0 border-r border-vesta-navy/10 bg-white shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-vesta-navy/10">
        <VestaLogo size="sm" tone="light" />
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative z-0',
                isActive
                  ? 'text-vesta-gold'
                  : 'text-slate-600 hover:text-vesta-navy hover:bg-vesta-mist/50'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="hotel-sidebar-active-pill"
                    className="absolute inset-0 rounded-lg bg-vesta-gold/15 border border-vesta-gold/30 -z-10"
                    transition={morphSpringSoft}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0 relative z-10" />
                <span className="relative z-10">{label}</span>
                {label === 'Anomalies' && anomalyCount > 0 && (
                  <span className="ml-auto relative z-10 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {anomalyCount > 9 ? '9+' : anomalyCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-vesta-navy/10 space-y-0.5">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
        <div className="mt-1 flex items-center gap-2 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vesta-gold/20 ring-1 ring-vesta-gold/40">
            <span className="text-xs font-semibold text-vesta-navy">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="truncate text-xs text-slate-500">{userName}</span>
        </div>
      </div>
    </aside>
  );
};

// Mobile bottom tab bar
export const HotelBottomNav = () => {
  const { hotelId } = useHotelDashboard();

  const { data: anomalyCount = 0 } = useQuery({
    queryKey: ['anomaly_count', hotelId],
    queryFn: async () => {
      if (!hotelId) return 0;
      const { count } = await supabase
        .from('anomalies')
        .select('id', { count: 'exact', head: true })
        .eq('hotel_id', hotelId)
        .eq('resolved', false);
      return count ?? 0;
    },
    enabled: !!hotelId,
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-vesta-navy/10 bg-white/95 backdrop-blur-md lg:hidden">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors relative',
              isActive ? 'text-vesta-gold' : 'text-slate-500'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative flex flex-col items-center gap-1">
                {isActive && (
                  <motion.span
                    layoutId="hotel-bottom-active-pill"
                    className="absolute -inset-x-1 -inset-y-1 rounded-2xl bg-vesta-gold/15 border border-vesta-gold/25 -z-10"
                    transition={morphSpringSoft}
                  />
                )}
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {label === 'Anomalies' && anomalyCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {anomalyCount > 9 ? '9+' : anomalyCount}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </div>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default HotelNav;
