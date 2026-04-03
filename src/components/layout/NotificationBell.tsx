import React, { useState } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Sparkles, BarChart2, RefreshCw, Star, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHotelNotifications, HotelNotification } from '@/hooks/useHotelNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
  hotelId: string | null;
}

const typeConfig: Record<HotelNotification['type'], { icon: React.ReactNode; color: string; bg: string }> = {
  anomaly:        { icon: <AlertTriangle size={13} />, color: '#dc2626', bg: '#fef2f2' },
  daily_briefing: { icon: <Sparkles size={13} />,      color: '#7c3aed', bg: '#f5f3ff' },
  weekly_report:  { icon: <BarChart2 size={13} />,     color: '#0284c7', bg: '#f0f9ff' },
  sync_error:     { icon: <RefreshCw size={13} />,     color: '#d97706', bg: '#fffbeb' },
  recommendation: { icon: <Star size={13} />,          color: '#C8963E', bg: '#fef9ef' },
  system:         { icon: <Info size={13} />,          color: '#6b7280', bg: '#f9fafb' },
};

function NotificationRow({
  notification,
  onRead,
}: {
  notification: HotelNotification;
  onRead: (id: string) => void;
}) {
  const navigate = useNavigate();
  const cfg = typeConfig[notification.type] ?? typeConfig.system;
  const isUnread = !notification.read_at;

  const handleClick = () => {
    if (isUnread) onRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors',
        'hover:bg-gray-50 border-b border-gray-100 last:border-0',
        isUnread && 'bg-blue-50/40',
      )}
    >
      {/* Type icon */}
      <span
        className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ color: cfg.color, backgroundColor: cfg.bg }}
      >
        {cfg.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn('text-sm leading-snug truncate', isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}
        >
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.body}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
      )}
    </button>
  );
}

export function NotificationBell({ hotelId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useHotelNotifications(hotelId);

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllRead();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10 focus:outline-none"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-white/80" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white leading-none px-1"
              style={{ backgroundColor: '#C8963E' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
          style={{ backgroundColor: '#1B3A5C' }}>
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-white/70" />
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <span
                className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#C8963E' }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors"
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[380px] overflow-y-auto bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#f0f4f8' }}
              >
                <Bell size={18} style={{ color: '#94a3b8' }} />
              </div>
              <p className="text-sm text-gray-400 font-medium">All caught up</p>
              <p className="text-xs text-gray-300">No new notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onRead={markRead}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => { setOpen(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors w-full text-center"
            >
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
