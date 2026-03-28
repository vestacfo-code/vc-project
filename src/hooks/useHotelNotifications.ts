import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface HotelNotification {
  id: string;
  hotel_id: string;
  user_id: string;
  type: 'anomaly' | 'daily_briefing' | 'weekly_report' | 'sync_error' | 'recommendation' | 'system';
  title: string;
  body: string;
  link?: string | null;
  read_at: string | null;
  created_at: string;
}

export function useHotelNotifications(hotelId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['hotel_notifications', user?.id];

  // Fetch all recent notifications for this user
  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as HotelNotification[];
    },
    enabled: !!user,
    refetchInterval: 30_000, // poll every 30s for new notifications
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Mark a single notification as read
  const markRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('hotel_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Mark all as read
  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('hotel_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user!.id)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}
