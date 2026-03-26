import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const TrialCountdown = () => {
  const { user } = useAuth();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkTrialStatus = async () => {
      const { data } = await supabase
        .from('user_credits')
        .select('is_trial_active, trial_end_date, tier')
        .eq('user_id', user.id)
        .single();

      if (data?.is_trial_active && data?.trial_end_date) {
        const endDate = new Date(data.trial_end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          setDaysRemaining(diffDays);
          setIsVisible(true);
        } else {
          // Trial expired, downgrade user
          setIsVisible(false);
          
          const { error } = await supabase
            .from('user_credits')
            .update({
              is_trial_active: false,
              tier: 'founder',
              current_credits: 30,
              monthly_limit: 30,
              daily_limit: 5,
              max_monthly_downloads: 5,
              max_collaborators: 0
            })
            .eq('user_id', user.id);

          if (!error) {
            toast.error('Your trial has ended. You\'ve been moved to The Founder tier.');
            
            // Create notification
            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                type: 'trial_expired',
                title: 'Trial Period Ended',
                message: 'Your 14-day CFO tier trial has ended. Upgrade to Scale or CFO tier to continue accessing premium features!'
              });
          }
        }
      } else {
        setIsVisible(false);
      }
    };

    checkTrialStatus();
    
    // Check every hour
    const interval = setInterval(checkTrialStatus, 3600000);
    return () => clearInterval(interval);
  }, [user]);

  if (!isVisible || daysRemaining === null) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-3 shadow-lg border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-primary" />
        <div className="flex flex-col">
          <span className="font-medium text-foreground">Trial Active</span>
          <span className="text-xs text-muted-foreground">
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
          </span>
        </div>
      </div>
    </Card>
  );
};
