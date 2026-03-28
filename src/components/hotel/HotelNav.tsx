import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Target,
  Plug,
  LogOut,
  Building2,
  ChevronDown,
  Settings,
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
  { to: '/integrations', icon: Plug,             label: 'Integrations' },
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
    <aside className="hidden lg:flex flex-col w-56 bg-[#0a0f1e] border-r border-slate-800 h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <VestaLogo size="sm" />
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
            {label === 'Anomalies' && anomalyCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {anomalyCount > 9 ? '9+' : anomalyCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-0.5">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
        <div className="flex items-center gap-2 px-3 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-amber-400 text-xs font-semibold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-slate-500 text-xs truncate">{userName}</span>
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0f1e] border-t border-slate-800 flex z-50">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors relative',
              isActive ? 'text-amber-400' : 'text-slate-500'
            )
          }
        >
          <div className="relative">
            <Icon className="w-5 h-5" />
            {label === 'Anomalies' && anomalyCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {anomalyCount > 9 ? '9+' : anomalyCount}
              </span>
            )}
          </div>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default HotelNav;
