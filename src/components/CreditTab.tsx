import { useState, useEffect } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { Button } from '@/components/ui/button';
import { 
  Coins, 
  Zap,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { formatInTimeZone } from 'date-fns-tz';
import { CreditAddOnDialog } from '@/components/CreditAddOnDialog';

export const CreditTab = () => {
  const { credits, loading, getTierInfo, fetchCredits, lastUpdateTime } = useCredits();
  const [open, setOpen] = useState(false);

  // Debug: Log when credits change
  useEffect(() => {
    console.log('CreditTab - Credits changed:', {
      current_credits: credits?.current_credits,
      credits_used_this_month: credits?.credits_used_this_month,
      report_downloads_this_month: credits?.report_downloads_this_month,
      lastUpdateTime
    });
  }, [credits?.current_credits, credits?.credits_used_this_month, credits?.report_downloads_this_month, lastUpdateTime]);

  if (loading) {
    return (
      <div className="flex items-center space-x-1 px-3 py-2 bg-secondary/50 rounded-md text-xs animate-pulse">
        <Coins className="h-3 w-3" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!credits) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center space-x-1 px-3 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md text-xs text-orange-700"
          >
            <Coins className="h-3 w-3" />
            <span>Credits</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Coins className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-800">Credit System</h3>
                <p className="text-sm text-orange-600">
                  Unable to load credit information
                </p>
              </div>
            </div>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openSettings', { 
                  detail: { tab: 'plan-credits' } 
                }));
                setOpen(false);
              }}
              className="w-full"
            >
              Upgrade
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const tierInfo = getTierInfo(credits.tier);
  const effectiveLimit = credits.total_monthly_limit || credits.monthly_limit;
  const creditsPercentage = (credits.current_credits / effectiveLimit) * 100;
  const monthlyUsagePercentage = (credits.credits_used_this_month / effectiveLimit) * 100;
  // Only show daily usage for founder tier
  const showDailyUsage = credits.tier === 'founder';
  const dailyUsagePercentage = showDailyUsage ? (credits.credits_used_today / credits.daily_limit) * 100 : 0;

  const getCreditsColor = () => {
    if (creditsPercentage <= 10) return "text-destructive";
    if (creditsPercentage <= 25) return "text-orange-500";
    return "text-primary";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center space-x-1 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-md text-xs data-[state=open]:bg-primary data-[state=open]:text-primary-foreground"
        >
          <Coins className="h-3 w-3" />
          <span className={getCreditsColor()}>{credits.current_credits}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${tierInfo.color} text-white`}>
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">{tierInfo.name}</h3>
                <p className="text-sm text-muted-foreground">{tierInfo.price}</p>
              </div>
            </div>
          </div>

          {/* Credits Display */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${getCreditsColor()}`}>
              {credits.current_credits}
            </div>
            <div className="text-sm text-muted-foreground">
              of {effectiveLimit} credits remaining
              {credits.addon_credits && credits.addon_credits > 0 && (
                <div className="text-xs text-muted-foreground">
                  (Base: {credits.monthly_limit} + Add-ons: {credits.addon_credits})
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Eastern Time: {formatInTimeZone(new Date(), 'America/New_York', 'MMM dd, yyyy h:mm a zzz')}
            </div>
          </div>

          <Progress value={creditsPercentage} className="h-2" />

          {/* Usage Details */}
          <div className="space-y-2">
            {showDailyUsage && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Daily Used:</span>
                  <span>{credits.credits_used_today} / {credits.daily_limit}</span>
                </div>
                <Progress value={dailyUsagePercentage} className="h-1" />
              </>
            )}
            
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Monthly Used:</span>
              <span>{credits.credits_used_this_month} / {effectiveLimit}</span>
            </div>
            <Progress value={monthlyUsagePercentage} className="h-1" />

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Downloads:</span>
              <span>
                {credits.report_downloads_this_month} / {credits.max_monthly_downloads === -1 ? '∞' : credits.max_monthly_downloads}
              </span>
            </div>
          </div>

          {/* Credit Costs Info */}
          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Credit costs:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className="text-muted-foreground">AI Chat:</span>
              <span className="text-right font-medium">1 credit</span>
              <span className="text-muted-foreground">Sync Data:</span>
              <span className="text-right font-medium">2 credits</span>
            </div>
          </div>

          {/* Reset Dates */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>Last reset: {formatInTimeZone(new Date(credits.last_reset_date), 'America/New_York', 'MMM dd h:mm a')}</div>
            {credits.next_reset_date && (
              <div>Next reset: {formatInTimeZone(new Date(credits.next_reset_date), 'America/New_York', 'MMM dd')}</div>
            )}
          </div>

          {/* Manual Refresh Button for Debugging */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              console.log('Manual refresh triggered');
              fetchCredits();
            }}
            className="w-full text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh Credits
          </Button>

          {/* Actions */}
          <div className="space-y-2">
            {/* Upgrade button for founder tier or low credits */}
            {(credits.tier === 'founder' || credits.current_credits <= 5) && (
              <Button 
                size="sm"
                variant="default"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openSettings', { 
                    detail: { tab: 'plan-credits' } 
                  }));
                  setOpen(false);
                }}
                className="w-full"
              >
                {credits.current_credits === 0 ? 'Upgrade Now' : 'Upgrade Plan'}
              </Button>
            )}

            {/* Add-on credits for paid users */}
            {(credits.tier === 'scale' || credits.tier === 'ceo') && (
              <CreditAddOnDialog>
                <Button 
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Extra Credits
                </Button>
              </CreditAddOnDialog>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};