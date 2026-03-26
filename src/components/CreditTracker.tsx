import { useState } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  TrendingUp, 
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Crown,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { toast } from '@/hooks/use-toast';

interface CreditTrackerProps {
  compact?: boolean;
  showUpgrade?: boolean;
}

export const CreditTracker = ({ compact = false, showUpgrade = true }: CreditTrackerProps) => {
  const { credits, loading, getTierInfo } = useCredits();
  const [expanded, setExpanded] = useState(false);


  if (loading) {
    return (
      <Card className={compact ? "w-72" : "w-full max-w-sm"}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-8 bg-muted rounded mb-2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!credits) {
    return (
      <Card className={compact ? "w-80 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800" : "w-full max-w-sm bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                <Coins className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">Credit System</h3>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Unable to load credit information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {showUpgrade && (
                <Button 
                  size="sm"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('openSettings', { 
                      detail: { tab: 'plan-credits' } 
                    }));
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tierInfo = getTierInfo(credits.tier);
  const creditsPercentage = (credits.current_credits / credits.monthly_limit) * 100;
  const monthlyUsagePercentage = (credits.credits_used_this_month / credits.monthly_limit) * 100;
  const dailyUsagePercentage = (credits.credits_used_today / credits.daily_limit) * 100;

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'founder': return <Star className="h-4 w-4" />;
      case 'scale': return <TrendingUp className="h-4 w-4" />;
      case 'ceo': return <Crown className="h-4 w-4" />;
      default: return <Coins className="h-4 w-4" />;
    }
  };

  const getCreditsColor = () => {
    if (creditsPercentage <= 10) return "text-destructive";
    if (creditsPercentage <= 25) return "text-orange-500";
    return "text-primary";
  };

  if (compact) {
    return (
      <Card className="w-80 border-border/50 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getTierIcon(credits.tier)}
              <div>
                <div className="font-medium text-sm">{tierInfo.name}</div>
                <div className="text-xs text-muted-foreground">
                  {credits.current_credits} / {credits.monthly_limit} credits
                </div>
              </div>
            </div>
            <div className={`text-right ${getCreditsColor()}`}>
              <div className="text-lg font-bold">{credits.current_credits}</div>
              <div className="text-xs">remaining</div>
            </div>
          </div>
          
          <Progress 
            value={creditsPercentage} 
            className="h-2 mb-3"
          />

          <div className="text-xs text-muted-foreground mb-3">
            Eastern Time: {formatInTimeZone(new Date(), 'America/New_York', 'MMM dd, yyyy h:mm a zzz')}
          </div>

          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="text-xs p-1 h-auto"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Details
            </Button>
            {showUpgrade && (credits.tier === 'founder' || credits.current_credits <= 5) && (
              <Button 
                size="sm" 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openSettings', { 
                    detail: { tab: 'plan-credits' } 
                  }));
                }}
                className="text-xs"
                variant={credits.current_credits === 0 ? "default" : "outline"}
              >
                <Zap className="h-3 w-3 mr-1" />
                {credits.current_credits === 0 ? 'Upgrade Now' : 'Upgrade'}
              </Button>
            )}
          </div>

          {expanded && (
            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Daily Used:</span>
                <span>{credits.credits_used_today} / {credits.daily_limit}</span>
              </div>
              <Progress value={dailyUsagePercentage} className="h-1" />
              
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Monthly Used:</span>
                <span>{credits.credits_used_this_month} / {credits.monthly_limit}</span>
              </div>
              <Progress value={monthlyUsagePercentage} className="h-1" />

              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Downloads:</span>
                <span>
                  {credits.report_downloads_this_month} / {credits.max_monthly_downloads === -1 ? '∞' : credits.max_monthly_downloads}
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                Last reset: {formatInTimeZone(new Date(credits.last_reset_date), 'America/New_York', 'MMM dd h:mm a')}
              </div>

            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tierInfo.color} text-white`}>
              {getTierIcon(credits.tier)}
            </div>
            <div>
              <h3 className="font-semibold">{tierInfo.name}</h3>
              <p className="text-sm text-muted-foreground">{tierInfo.price}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {credits.tier.toUpperCase()}
          </Badge>
        </div>

        <div className="text-center mb-4">
          <div className={`text-3xl font-bold ${getCreditsColor()}`}>
            {credits.current_credits}
          </div>
          <div className="text-sm text-muted-foreground">
            of {credits.monthly_limit} credits remaining
          </div>
          <div className="text-xs text-muted-foreground">
            Eastern Time: {formatInTimeZone(new Date(), 'America/New_York', 'MMM dd, yyyy h:mm a zzz')}
          </div>
          <div className="text-xs text-muted-foreground">
            Last reset: {formatInTimeZone(new Date(credits.last_reset_date), 'America/New_York', 'MMM dd h:mm a')}
          </div>
        </div>

        <Progress value={creditsPercentage} className="mb-4" />

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Today</span>
            </div>
            <span>{credits.credits_used_today} / {credits.daily_limit}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>This Month</span>
            </div>
            <span>{credits.credits_used_this_month} / {credits.monthly_limit}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>Downloads</span>
            </div>
            <span>
              {credits.report_downloads_this_month} / {credits.max_monthly_downloads === -1 ? '∞' : credits.max_monthly_downloads}
            </span>
          </div>
        </div>

        {showUpgrade && credits.tier === 'founder' && (
          <Button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openSettings', { 
                detail: { tab: 'plan-credits' } 
              }));
            }}
            className="w-full mt-4"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        )}

      </CardContent>
    </Card>
  );
};