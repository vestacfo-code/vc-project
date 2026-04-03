import React from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { NotificationBell } from './NotificationBell';
import { useHotelDashboard } from '@/hooks/useHotelDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { hotelId, hotel } = useHotelDashboard();
  const { user } = useAuth();

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Right column: header + content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header bar */}
        <header
          className="flex items-center justify-between px-6 shrink-0"
          style={{
            height: 56,
            backgroundColor: '#1B3A5C',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Hotel name */}
          <div className="flex items-center gap-2">
            {hotel ? (
              <>
                <span
                  className="text-sm font-semibold text-white/90"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {hotel.name}
                </span>
                {hotel.city && (
                  <span
                    className="text-xs text-white/40 hidden sm:inline"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    · {hotel.city}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-white/40" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Loading…
              </span>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <NotificationBell hotelId={hotelId} />

            {/* User avatar */}
            <Avatar className="w-8 h-8 border border-white/20">
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ backgroundColor: '#C8963E', color: '#fff' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Main content area */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: '#F7F4EE' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
