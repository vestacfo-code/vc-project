import { useState, useEffect, useCallback } from 'react';
// Use the wrapper client that respects recovery mode and shares session with useAuth
import { supabase } from '@/lib/supabase-client-wrapper';
import { useAuth } from './useAuth';
import { useTeamRole } from './useTeamRole';
import { toast } from '@/hooks/use-toast';

export type SubscriptionTier = 'founder' | 'scale' | 'ceo';

export interface UserCredits {
  id: string;
  user_id: string;
  current_credits: number;
  monthly_limit: number;
  daily_limit: number;
  credits_used_today: number;
  credits_used_this_month: number;
  tier: SubscriptionTier;
  max_monthly_downloads: number;
  report_downloads_this_month: number;
  max_collaborators: number;
  additional_credits_purchased: number;
  last_reset_date: string;
  last_daily_reset: string;
  tier_start_date: string;
  next_reset_date?: string | null;
  addon_credits?: number; // Credits from add-on subscriptions
  total_monthly_limit?: number; // Base limit + addon credits
}

export interface CreditUsageLog {
  id: string;
  user_id: string;
  credits_used: number;
  action_type: string;
  description?: string;
  timestamp: string;
}

export const useCredits = () => {
  const { user } = useAuth();
  // Team members should see the owner's credits, not their own
  const { effectiveUserId, isMember, isLoading: teamLoading } = useTeamRole();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now()); // Force re-render trigger
  const [lowCreditAlertShown, setLowCreditAlertShown] = useState(false); // Prevent repeated alerts

  // Fetch user credits - for team members, fetch owner's credits
  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    // Wait for team role to resolve before fetching credits
    if (teamLoading) {
      return;
    }

    // Wait for a valid session with retry logic for race conditions
    let session = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        session = sessionData.session;
        break;
      }
      // Wait a bit for session to sync
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    if (!session) {
      console.log('[useCredits] No valid session after retries, skipping fetch');
      setCredits(null);
      setLoading(false);
      return;
    }

    // Use effectiveUserId for team members (owner's ID), otherwise user's own ID
    const targetUserId = effectiveUserId || user.id;

    try {
      setLoading(true);
      setError(null);
      
      // For team members, we need to pass the owner's user ID to get their credits
      const { data, error } = await supabase.functions.invoke('credit-manager', {
        body: { 
          action: 'get_credits',
          target_user_id: isMember ? targetUserId : undefined // Only pass for team members
        }
      });

      if (error) {
        // If it's an auth error, don't show error - user session may be stale
        if (error.message?.includes('Authentication') || error.message?.includes('401') || error.message?.includes('session')) {
          console.log('[useCredits] Auth error, session may be stale:', error.message);
          setCredits(null);
          setLoading(false);
          return;
        }
        throw error;
      }
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch credits');

      // Fetch next reset date based on target user (owner for team members)
      const { data: nextResetData, error: resetError } = await supabase.rpc('get_next_monthly_reset_date', {
        p_user_id: targetUserId
      });

      if (resetError) {
        console.error('Error fetching next reset date:', resetError);
      }

      // Get active add-on credits for the target user
      const { data: addonData, error: addonError } = await supabase.functions.invoke('check-addon-subscription', {
        body: { target_user_id: isMember ? targetUserId : undefined }
      });
      
      let totalAddonCredits = 0;
      if (!addonError && addonData?.addons) {
        totalAddonCredits = addonData.addons.reduce((total: number, addon: { credits_per_month: number }) => total + addon.credits_per_month, 0);
      }

      const creditsWithAddons = {
        ...data,
        next_reset_date: nextResetData || null,
        addon_credits: totalAddonCredits,
        total_monthly_limit: data.monthly_limit + totalAddonCredits,
        is_team_credits: isMember // Flag to indicate these are owner's credits
      };

      setCredits(creditsWithAddons);
      setLastUpdateTime(Date.now()); // Force re-render
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch credits';
      setError(errorMessage);
      console.error('Error fetching credits:', err);
    } finally {
      setLoading(false);
    }
  }, [user, effectiveUserId, isMember, teamLoading]);

  // Use credits for an action
  const useCredits = async (creditsToUse: number, actionType: string, description?: string): Promise<boolean> => {
    if (!user || !credits) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use credits.",
        variant: "destructive",
      });
      return false;
    }

     // Optimistic update - deduct credits immediately in local state
     const previousCredits = credits.current_credits;
     setCredits(prev => prev ? {
       ...prev,
       current_credits: Math.max(0, prev.current_credits - creditsToUse),
       credits_used_today: prev.credits_used_today + creditsToUse,
       credits_used_this_month: prev.credits_used_this_month + creditsToUse
     } : null);
 
    try {
       // Fire-and-forget the server call - don't await for UI responsiveness
       supabase.functions.invoke('credit-manager', {
        body: {
          action: 'use_credits',
          credits_used: creditsToUse,
          action_type: actionType,
          description
        }
       }).then(({ data, error }) => {
         if (error || !data?.success) {
           console.error('Credit deduction error:', error || data?.error);
           // Revert optimistic update on failure
           setCredits(prev => prev ? {
             ...prev,
             current_credits: previousCredits,
             credits_used_today: Math.max(0, prev.credits_used_today - creditsToUse),
             credits_used_this_month: Math.max(0, prev.credits_used_this_month - creditsToUse)
           } : null);
           
           if (data?.error === "Insufficient credits") {
             toast({
               title: "Insufficient Credits",
               description: `You need ${data.credits_needed} credits but only have ${data.current_credits}.`,
               variant: "destructive",
             });
           }
        }
       }).catch(err => {
         console.error('Credit deduction failed:', err);
         // Revert on network error
         setCredits(prev => prev ? {
           ...prev,
           current_credits: previousCredits,
           credits_used_today: Math.max(0, prev.credits_used_today - creditsToUse),
           credits_used_this_month: Math.max(0, prev.credits_used_this_month - creditsToUse)
         } : null);
       });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to use credits';
      console.error('Error using credits:', err);
       // Revert optimistic update
       setCredits(prev => prev ? {
         ...prev,
         current_credits: previousCredits,
         credits_used_today: Math.max(0, prev.credits_used_today - creditsToUse),
         credits_used_this_month: Math.max(0, prev.credits_used_this_month - creditsToUse)
       } : null);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to track downloads specifically
  const trackDownload = async (downloadType: string, description?: string): Promise<boolean> => {
    if (!credits || !user) return false;

    // Check download limits
    if (credits.max_monthly_downloads !== -1 && credits.report_downloads_this_month >= credits.max_monthly_downloads) {
      toast({
        title: "Download Limit Reached",
        description: "You've reached your monthly download limit. Please upgrade your plan for more downloads.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Update download count in database
      const { error } = await supabase
        .from('user_credits')
        .update({ 
          report_downloads_this_month: credits.report_downloads_this_month + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Log the download action
      await supabase.from('credit_usage_log').insert({
        user_id: user.id,
        credits_used: 0,
        action_type: downloadType,
        description: description || `Download: ${downloadType}`,
      });

      // Update local state immediately
      setCredits(prev => prev ? {
        ...prev,
        report_downloads_this_month: prev.report_downloads_this_month + 1
      } : null);
      
      // Force re-render
      setLastUpdateTime(Date.now());

      toast({
        title: "Download Started",
        description: `${description || downloadType} download initiated successfully.`,
      });

      return true;
    } catch (err) {
      console.error('Error tracking download:', err);
      toast({
        title: "Download Error",
        description: "Failed to track download. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Check if user can use credits
  const canUseCredits = (creditsNeeded: number): boolean => {
    if (!credits) {
      return false;
    }
    
    // Check for unlimited users (based on discount code, not just high credit count)
    if (credits.monthly_limit >= 999999) {
      return true;
    }
    
    return credits.current_credits >= creditsNeeded;
  };

  // Get tier information
  const getTierInfo = (tier: SubscriptionTier) => {
    const tierInfo = {
      founder: {
        name: "Founder Access",
        price: "30 credits/month",
        monthlyCredits: 30,
        dailyCredits: 5,
        downloads: 5,
        collaborators: 0,
        color: "bg-gradient-to-r from-vesta-navy-muted to-vesta-navy"
      },
      scale: {
        name: "Scale Plan",
        price: "150 credits/month",
        monthlyCredits: 150,
        dailyCredits: 30,
        downloads: 25,
        collaborators: 2,
        color: "bg-gradient-to-r from-blue-500 to-blue-600"
      },
      ceo: {
        name: "CFO Plan",
        price: "250 credits/month",
        monthlyCredits: 250,
        dailyCredits: 50,
        downloads: -1, // Unlimited
        collaborators: 6,
        color: "bg-gradient-to-r from-purple-500 to-purple-600"
      }
    };

    return tierInfo[tier];
  };

  // Check for low credits and show alerts (only once per session)
  const checkLowCredits = useCallback(() => {
    if (!credits || lowCreditAlertShown) return;

    const lowThreshold = Math.floor(credits.monthly_limit * 0.2); // 20% of monthly limit
    const veryLowThreshold = Math.floor(credits.monthly_limit * 0.1); // 10% of monthly limit

    if (credits.current_credits <= 0) {
      setLowCreditAlertShown(true);
      toast({
        title: "Credits Depleted",
        description: "You've used all your credits. Upgrade your plan to continue using AI features.",
        variant: "destructive",
      });
    } else if (credits.current_credits <= veryLowThreshold) {
      setLowCreditAlertShown(true);
      toast({
        title: "Very Low Credits",
        description: `Only ${credits.current_credits.toFixed(0)} credits remaining. Consider upgrading your plan.`,
        variant: "destructive",
      });
    }
    // Removed the "Low Credits" toast at 20% - too noisy
  }, [credits, lowCreditAlertShown]);

  // Real-time updates - listen to the effective user's credits (owner for team members)
  useEffect(() => {
    if (!user) return;
    
    // Wait for team role to resolve
    if (teamLoading) return;

    // Subscribe to the target user's credits (owner's for team members)
    const targetUserId = effectiveUserId || user.id;
    
    const channel = supabase
      .channel(`user-credits-changes-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          
          // Update state immediately from the real-time payload if possible
          if (payload.new && payload.eventType === 'UPDATE') {
            setCredits(prev => {
              if (!prev) return null;
              return {
                ...prev,
                current_credits: (payload.new as any).current_credits,
                credits_used_today: (payload.new as any).credits_used_today,
                credits_used_this_month: (payload.new as any).credits_used_this_month,
                report_downloads_this_month: (payload.new as any).report_downloads_this_month,
                updated_at: (payload.new as any).updated_at
              };
            });
            // Force re-render
            setLastUpdateTime(Date.now());
          }
          
          // Also fetch complete data to ensure accuracy
          setTimeout(() => fetchCredits(), 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_addons',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          // Refetch credits when addon credits change (affects total limits)
          setTimeout(() => fetchCredits(), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, effectiveUserId, teamLoading, fetchCredits]);

  // Initial fetch - delay slightly to allow auth state to stabilize
  useEffect(() => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }
    
    // Small delay to ensure auth session is fully established
    const timer = setTimeout(() => {
      fetchCredits();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [user, fetchCredits]);

  // Check low credits when credits change
  useEffect(() => {
    if (credits && credits.current_credits > 0) {
      checkLowCredits();
    }
  }, [credits?.current_credits]);

  return {
    credits,
    loading,
    error,
    fetchCredits,
    useCredits,
    trackDownload,
    canUseCredits,
    getTierInfo,
    lastUpdateTime // Include this to help components detect changes
  };
};