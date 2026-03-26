import { useEffect, useRef } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

interface CreditNotificationsProps {
  onUpgradeRequested?: () => void;
}

export const CreditNotifications = ({ onUpgradeRequested }: CreditNotificationsProps) => {
  const { credits } = useCredits();
  const { user } = useAuth();
  const notificationSent = useRef<Set<string>>(new Set());

  const createNotification = async (
    type: string,
    title: string,
    message: string,
    data?: any
  ) => {
    if (!user) return;

    try {
      await supabase.functions.invoke('create-notification', {
        body: {
          userId: user.id,
          type,
          title,
          message,
          data: {
            ...data,
            onUpgradeRequested: !!onUpgradeRequested,
            severity: type === 'credit_depleted' ? 'critical' : 'warning'
          }
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  useEffect(() => {
    if (!credits || !user) return;

    const currentTime = formatInTimeZone(new Date(), 'America/New_York', 'h:mm a zzz');
    const notificationKey = `${user.id}-${credits.current_credits}-${credits.credits_used_today}`;
    
    // Prevent duplicate notifications for the same state
    if (notificationSent.current.has(notificationKey)) return;
    
    // Check for depleted credits
    if (credits.current_credits === 0) {
      createNotification(
        'credit_depleted',
        'Credits Depleted',
        `You've used all your credits for this month. ${onUpgradeRequested ? 'Upgrade to get more credits.' : ''} Time: ${currentTime}`,
        { 
          credits_remaining: 0,
          monthly_limit: credits.monthly_limit,
          upgrade_available: !!onUpgradeRequested
        }
      );
      notificationSent.current.add(notificationKey);
      return;
    }

    // Check for very low credits (5 or less)
    if (credits.current_credits <= 5) {
      createNotification(
        'credit_low',
        'Low Credits Warning',
        `Only ${credits.current_credits} credits remaining this month. ${onUpgradeRequested ? 'Consider upgrading for more credits.' : ''} Time: ${currentTime}`,
        {
          credits_remaining: credits.current_credits,
          monthly_limit: credits.monthly_limit,
          upgrade_available: !!onUpgradeRequested
        }
      );
      notificationSent.current.add(notificationKey);
      return;
    }

    // Check for low credits (25% remaining)
    const lowThreshold = Math.floor(credits.monthly_limit * 0.25);
    if (credits.current_credits <= lowThreshold && credits.current_credits > 5) {
      createNotification(
        'credit_warning',
        'Credits Running Low',
        `You have ${credits.current_credits} of ${credits.monthly_limit} credits remaining. ${onUpgradeRequested ? 'Consider upgrading.' : ''} Time: ${currentTime}`,
        {
          credits_remaining: credits.current_credits,
          monthly_limit: credits.monthly_limit,
          upgrade_available: !!onUpgradeRequested
        }
      );
      notificationSent.current.add(notificationKey);
    }
  }, [credits?.current_credits, user, onUpgradeRequested]);

  // Check for daily limit reached
  useEffect(() => {
    if (!credits || !user) return;

    const dailyLimitKey = `${user.id}-daily-${credits.credits_used_today}-${credits.daily_limit}`;
    
    if (notificationSent.current.has(dailyLimitKey)) return;

    if (credits.credits_used_today >= credits.daily_limit) {
      const currentTime = formatInTimeZone(new Date(), 'America/New_York', 'h:mm a zzz');
      const nextReset = formatInTimeZone(
        new Date(new Date().setDate(new Date().getDate() + 1)), 
        'America/New_York', 
        'h:mm a zzz'
      );

      createNotification(
        'daily_limit_reached',
        'Daily Limit Reached',
        `You've reached your daily limit of ${credits.daily_limit} credits. Credits reset tomorrow at ${nextReset}. Current time: ${currentTime}${onUpgradeRequested ? ' Upgrade for higher daily limits.' : ''}`,
        {
          daily_limit: credits.daily_limit,
          credits_used_today: credits.credits_used_today,
          reset_time: nextReset,
          upgrade_available: !!onUpgradeRequested
        }
      );
      notificationSent.current.add(dailyLimitKey);
    }
  }, [credits?.credits_used_today, credits?.daily_limit, user, onUpgradeRequested]);

  return null; // This component only handles notifications
};