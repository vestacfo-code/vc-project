import { useState, useEffect } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VestaBrand } from '@/components/ui/finlo-brand';
import { Check, Loader2, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

// Credit add-on options (minimum 100 credits)
const CREDIT_OPTIONS = [100, 200, 300, 400, 500, 600, 800, 1000];

export const PlanCreditsTab = () => {
  const { credits, loading: creditsLoading } = useCredits();
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [addonCredits, setAddonCredits] = useState(100);
  const [isManagingAddon, setIsManagingAddon] = useState(false);
  const [currentAddon, setCurrentAddon] = useState<any>(null);
  const [isAnnualScale, setIsAnnualScale] = useState(false);
  const [isAnnualCeo, setIsAnnualCeo] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [hasActiveStripeSubscription, setHasActiveStripeSubscription] = useState(false);
  const [isCustomSolution, setIsCustomSolution] = useState(false);
  const [customPricing, setCustomPricing] = useState<{ fixed_amount?: number; monthly_amount?: number } | null>(null);

  useEffect(() => {
    const loadSubscriptionInfo = async () => {
      if (!user) return;
      
      try {
        const [creditsData, addonData, subscriptionCheck, profileData, pricingData] = await Promise.all([
          supabase
            .from('user_credits')
            .select('tier, tier_start_date, next_reset_date, is_trial, trial_start_date, trial_end_date')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('credit_addons')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle(),
          // Check if user has an active Stripe subscription
          supabase.functions.invoke('check-subscription'),
          // Check if user is a custom solution user
          supabase
            .from('profiles')
            .select('is_custom_solution')
            .eq('user_id', user.id)
            .single(),
          // Get custom pricing if exists
          supabase
            .from('custom_pricing')
            .select('fixed_amount, monthly_amount')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()
        ]);

        if (!creditsData.error && creditsData.data) {
          setSubscriptionInfo(creditsData.data);
        }

        if (addonData.data) {
          setCurrentAddon(addonData.data);
          setAddonCredits(addonData.data.credits_per_month);
        }

        // Set whether user has active Stripe subscription (check has_stripe_subscription flag)
        if (subscriptionCheck.data && !subscriptionCheck.error) {
          // Use the explicit has_stripe_subscription flag from the edge function
          const hasStripe = subscriptionCheck.data.has_stripe_subscription === true;
          setHasActiveStripeSubscription(hasStripe);
        }

        // Set custom solution status
        if (profileData.data?.is_custom_solution) {
          setIsCustomSolution(true);
        }

        // Set custom pricing
        if (pricingData.data) {
          setCustomPricing(pricingData.data);
        }

        if (!creditsData.error && creditsData.data) {
          setSubscriptionInfo(creditsData.data);
        }

        if (addonData.data) {
          setCurrentAddon(addonData.data);
          setAddonCredits(addonData.data.credits_per_month);
        }

        // Set whether user has active Stripe subscription (check has_stripe_subscription flag)
        if (subscriptionCheck.data && !subscriptionCheck.error) {
          // Use the explicit has_stripe_subscription flag from the edge function
          const hasStripe = subscriptionCheck.data.has_stripe_subscription === true;
          setHasActiveStripeSubscription(hasStripe);
        }
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    loadSubscriptionInfo();
  }, [user]);

  const getTierDisplayName = (tier: string) => {
    if (isCustomSolution) return 'Custom Solution';
    switch (tier) {
      case 'founder': return 'Founder';
      case 'scale': return 'Scale';
      case 'ceo': return 'CFO';
      default: return 'Free';
    }
  };

  const getRenewalDate = () => {
    if (subscriptionInfo?.is_trial && subscriptionInfo?.trial_end_date) {
      return new Date(subscriptionInfo.trial_end_date).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });
    }
   // Check credits.next_reset_date first (from useCredits hook), then subscriptionInfo
   if (credits?.next_reset_date) {
     return new Date(credits.next_reset_date).toLocaleDateString('en-US', { 
       month: 'short', day: 'numeric', year: 'numeric' 
     });
   }
   if (subscriptionInfo?.next_reset_date) {
      return new Date(subscriptionInfo.next_reset_date).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });
    }
   // Fallback: Calculate based on tier_start_date or account creation
   if (subscriptionInfo?.tier_start_date) {
     const tierStart = new Date(subscriptionInfo.tier_start_date);
     const today = new Date();
     const resetDay = tierStart.getDate();
     
     // Calculate next reset date
     let nextReset = new Date(today.getFullYear(), today.getMonth(), resetDay);
     if (nextReset <= today) {
       nextReset = new Date(today.getFullYear(), today.getMonth() + 1, resetDay);
     }
     
     return nextReset.toLocaleDateString('en-US', { 
       month: 'short', day: 'numeric', year: 'numeric' 
     });
   }
   // Last fallback: 1st of next month
   const today = new Date();
   const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
   return nextMonth.toLocaleDateString('en-US', { 
     month: 'short', day: 'numeric', year: 'numeric' 
   });
  };

  const handleManageSubscription = async () => {
    if (currentTier === 'founder') {
      toast({
        title: "No Active Subscription",
        description: "You're on the free Founder plan. Upgrade to manage your subscription.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = async (tier: 'scale' | 'ceo', isAnnual: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { tier, isAnnual }
      });
      
      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');
      
      window.open(data.url, '_blank');
      toast({
        title: "Redirecting to Checkout",
        description: `Opening Stripe checkout${isAnnual ? ' (10% annual discount)' : ''}...`,
      });
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };

  const handleDowngradeToFree = async () => {
    setIsDowngrading(true);
    try {
      // Cancel subscription via customer portal - this will stop future payments
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        toast({
          title: "Opening Billing Portal",
          description: "Cancel your subscription to downgrade to the free plan. All future payments will be stopped.",
        });
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDowngrading(false);
    }
  };

  const handleManageAddon = async (action: 'add' | 'update' | 'remove') => {
    if (!user) return;

    if (currentTier === 'founder') {
      toast({
        title: "Subscription Required",
        description: "Please upgrade to Scale or CFO plan first to add credit add-ons.",
        variant: "destructive",
      });
      return;
    }

    if (!hasActiveStripeSubscription) {
      toast({
        title: "Stripe Subscription Required",
        description: "You need an active Stripe subscription to add credits. Please upgrade via Stripe checkout first.",
        variant: "destructive",
      });
      return;
    }

    setIsManagingAddon(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription-credits', {
        body: { action, credits: addonCredits }
      });

      if (error) throw error;
      
      // Handle edge function error response
      if (data?.error) {
        if (data.isFounder) {
          toast({
            title: "Unlimited Credits",
            description: "Founder Access users have unlimited credits and don't need add-ons.",
          });
          return;
        }
        if (data.requiresSubscription) {
          toast({
            title: "Active Subscription Required",
            description: "You need an active Stripe subscription to add credits. Please upgrade first.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error);
      }

      const actionText = action === 'remove' 
        ? "Add-on will be removed at the end of your billing cycle."
        : action === 'add'
        ? `Added ${addonCredits} credits/month. Your payment has been prorated.`
        : `Updated to ${addonCredits} credits/month. Your payment has been prorated.`;

      toast({
        title: action === 'remove' ? "Add-on Scheduled for Removal" : "Credits Added Successfully",
        description: actionText,
      });

      // Reload addon state
      const addonData = await supabase
        .from('credit_addons')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (addonData.data) {
        setCurrentAddon(addonData.data);
        setAddonCredits(addonData.data.credits_per_month);
      } else {
        setCurrentAddon(null);
        setAddonCredits(100);
      }
    } catch (error: any) {
      console.error('Addon management error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to manage credit add-on. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManagingAddon(false);
    }
  };

  if (creditsLoading || isLoadingSubscription) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  const creditsRemaining = credits?.current_credits || 0;
  const totalCredits = credits?.total_monthly_limit || credits?.monthly_limit || 0;
  const creditsPercentage = totalCredits > 0 ? (creditsRemaining / totalCredits) * 100 : 0;
  const currentTier = credits?.tier || 'founder';

  return (
    <div className="flex-1 p-6 overflow-y-auto scrollbar-hide bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-white">Plans & credits</h1>
          <p className="text-sm text-slate-400">Manage your subscription and credit balance.</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
             <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10">
                <HelpCircle className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs bg-[#1a1a1a] border border-white/10 shadow-lg p-3">
              <p className="text-sm font-medium text-white mb-2">How credits work:</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• <strong className="text-white">AI Chat:</strong> 1 credit per message</li>
                <li>• <strong className="text-white">Document Analysis:</strong> 1 credit per document</li>
              </ul>
              <p className="text-xs text-slate-500 mt-2">Credits reset monthly based on your billing cycle.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Current Plan Summary */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="p-2 bg-white/10 rounded-lg border border-white/10">
          <VestaBrand size="md" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-white">You're on {getTierDisplayName(currentTier)}</p>
          <p className="text-sm text-slate-400">
            {subscriptionInfo?.is_trial ? 'Trial ends' : 'Renews'} {getRenewalDate()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{creditsRemaining}</p>
          <p className="text-xs text-slate-500">of {totalCredits} credits</p>
        </div>
        {currentTier !== 'founder' && !isCustomSolution && (
        <Button variant="outline" size="sm" onClick={handleManageSubscription} className="bg-white/5 hover:bg-white/10 text-white border-white/10">
            Manage
          </Button>
        )}
      </div>

      {/* Custom Solution User - Simplified View */}
      {isCustomSolution ? (
        <div className="space-y-6">
          <Card className="ring-2 ring-white/20 border-white/20 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Custom Solution</CardTitle>
              <CardDescription className="text-sm text-slate-400">
                Your personalized Vesta configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customPricing && (
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  {customPricing.monthly_amount && customPricing.monthly_amount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Monthly Fee</span>
                      <span className="font-semibold text-white">
                        ${customPricing.monthly_amount.toFixed(2)}/mo
                      </span>
                    </div>
                  )}
                  {customPricing.fixed_amount && customPricing.fixed_amount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Setup Fee (paid)</span>
                      <span className="font-medium text-slate-300">
                        ${customPricing.fixed_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Credits Remaining</span>
                  <span className="font-semibold text-white">
                    {creditsRemaining >= 999999 ? 'Unlimited' : creditsRemaining}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Monthly Allocation</span>
                  <span className="font-medium text-slate-300">
                    {totalCredits >= 999999 ? 'Unlimited' : `${totalCredits} credits`}
                  </span>
                </div>
                {totalCredits < 999999 && (
                  <Progress value={creditsPercentage} className="h-2" />
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <Button 
                  variant="outline"
                  className="w-full bg-transparent text-white border-white/20 hover:bg-white/10"
                  onClick={() => window.open('mailto:support@vesta.ai?subject=Custom Solution Support', '_blank')}
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Plan Cards - Standard Users */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Founder (Free) */}
        <Card className={`border ${currentTier === 'founder' ? 'ring-2 ring-white/30 border-white/30' : 'border-white/10'} bg-white/5`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Founder</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Get started with essential insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-2xl font-bold text-white">Free</span>
            </div>
            
            <div className="text-sm text-slate-300 font-medium">30 credits / month</div>

            {currentTier === 'founder' ? (
              <div className="py-2 text-center text-sm text-slate-400 bg-white/5 rounded-md">
                Current plan
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full bg-transparent hover:bg-white/10 text-white border-white/20 hover:text-white"
                onClick={handleDowngradeToFree}
                disabled={isDowngrading}
              >
                {isDowngrading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Downgrade
              </Button>
            )}

            <div className="pt-3 border-t border-white/10 space-y-1.5">
              {['30 monthly credits', '5 daily credits', '5 downloads/month'].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs text-slate-400">
                  <Check className="w-3 h-3 flex-shrink-0 text-slate-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scale */}
        <Card className={`border ${currentTier === 'scale' ? 'ring-2 ring-white/30 border-white/30' : 'border-white/10'} bg-white/5`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Scale</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              For growing teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {isAnnualScale ? '$23.39' : '$25.99'}
              </span>
              <span className="text-sm text-slate-400">/ month</span>
            </div>
            
            <div className="text-sm text-slate-300 font-medium">150 credits / month</div>

            <Select 
              value={isAnnualScale ? "annual" : "monthly"}
              onValueChange={(value) => setIsAnnualScale(value === "annual")}
            >
              <SelectTrigger className="w-full text-xs h-8 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                <SelectItem value="monthly" className="text-slate-300 focus:bg-white/10 focus:text-white">Monthly</SelectItem>
                <SelectItem value="annual" className="text-slate-300 focus:bg-white/10 focus:text-white">Annual (10% off)</SelectItem>
              </SelectContent>
            </Select>

            {currentTier === 'scale' ? (
              <div className="py-2 text-center text-sm text-slate-400 bg-white/5 rounded-md">
                Current plan
              </div>
            ) : (
              <Button 
                className="w-full bg-white hover:bg-slate-200 text-black"
                onClick={() => handleUpgrade('scale', isAnnualScale)}
              >
                {currentTier === 'ceo' ? 'Switch' : 'Upgrade'}
              </Button>
            )}

            {/* Extra Credits (only for current tier with active Stripe subscription) */}
            {currentTier === 'scale' && hasActiveStripeSubscription && (
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Extra credits</span>
                  <span className="font-medium">${(addonCredits * 0.10).toFixed(0)}/mo</span>
                </div>
                <Select 
                  value={addonCredits.toString()}
                  onValueChange={(value) => setAddonCredits(parseInt(value))}
                >
                  <SelectTrigger className="w-full text-xs h-8 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select credits" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                    {CREDIT_OPTIONS.map((credits) => (
                      <SelectItem key={credits} value={credits.toString()} className="text-slate-300 focus:bg-white/10 focus:text-white">
                        {credits} credits (+${(credits * 0.10).toFixed(0)}/mo)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 text-xs h-7 bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white"
                  onClick={() => handleManageAddon(currentAddon ? 'update' : 'add')}
                  disabled={isManagingAddon || (currentAddon && addonCredits === currentAddon.credits_per_month)}
                >
                  {isManagingAddon ? <Loader2 className="w-3 h-3 animate-spin" /> : currentAddon ? 'Update Add-on' : 'Add Credits'}
                </Button>
                {currentAddon && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-1 text-xs h-6 text-slate-500 hover:bg-white/10"
                    onClick={() => handleManageAddon('remove')}
                    disabled={isManagingAddon}
                  >
                    Remove add-on
                  </Button>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-white/10 space-y-1.5">
              <p className="text-xs text-slate-500 mb-1">All Founder features, plus:</p>
              {['150 monthly credits', '30 daily credits', '25 downloads', '2 collaborators'].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs text-slate-400">
                  <Check className="w-3 h-3 flex-shrink-0 text-slate-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CFO */}
        <Card className={`border ${currentTier === 'ceo' ? 'ring-2 ring-white/30 border-white/30' : 'border-white/10'} bg-white/5`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">CFO</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Advanced controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {isAnnualCeo ? '$35.99' : '$39.99'}
              </span>
              <span className="text-sm text-slate-400">/ month</span>
            </div>
            
            <div className="text-sm text-slate-300 font-medium">250 credits / month</div>

            <Select 
              value={isAnnualCeo ? "annual" : "monthly"}
              onValueChange={(value) => setIsAnnualCeo(value === "annual")}
            >
              <SelectTrigger className="w-full text-xs h-8 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                <SelectItem value="monthly" className="text-slate-300 focus:bg-white/10 focus:text-white">Monthly</SelectItem>
                <SelectItem value="annual" className="text-slate-300 focus:bg-white/10 focus:text-white">Annual (10% off)</SelectItem>
              </SelectContent>
            </Select>

            {currentTier === 'ceo' ? (
              <div className="py-2 text-center text-sm text-slate-400 bg-white/5 rounded-md">
                Current plan
              </div>
            ) : (
              <Button 
                className="w-full bg-white hover:bg-slate-200 text-black"
                onClick={() => handleUpgrade('ceo', isAnnualCeo)}
              >
                Upgrade
              </Button>
            )}

            {/* Extra Credits (only for current tier with active Stripe subscription) */}
            {currentTier === 'ceo' && hasActiveStripeSubscription && (
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Extra credits</span>
                  <span className="font-medium">${(addonCredits * 0.10).toFixed(0)}/mo</span>
                </div>
                <Select 
                  value={addonCredits.toString()}
                  onValueChange={(value) => setAddonCredits(parseInt(value))}
                >
                  <SelectTrigger className="w-full text-xs h-8 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select credits" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 shadow-lg z-50">
                    {CREDIT_OPTIONS.map((credits) => (
                      <SelectItem key={credits} value={credits.toString()} className="text-slate-300 focus:bg-white/10 focus:text-white">
                        {credits} credits (+${(credits * 0.10).toFixed(0)}/mo)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 text-xs h-7 bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white"
                  onClick={() => handleManageAddon(currentAddon ? 'update' : 'add')}
                  disabled={isManagingAddon || (currentAddon && addonCredits === currentAddon.credits_per_month)}
                >
                  {isManagingAddon ? <Loader2 className="w-3 h-3 animate-spin" /> : currentAddon ? 'Update Add-on' : 'Add Credits'}
                </Button>
                {currentAddon && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-1 text-xs h-6 text-slate-500 hover:bg-white/10"
                    onClick={() => handleManageAddon('remove')}
                    disabled={isManagingAddon}
                  >
                    Remove add-on
                  </Button>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-white/10 space-y-1.5">
              <p className="text-xs text-slate-500 mb-1">All Scale features, plus:</p>
              {['250 monthly credits', 'Unlimited downloads', '6 collaborators', 'SSO'].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs text-slate-400">
                  <Check className="w-3 h-3 flex-shrink-0 text-slate-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
          </Card>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-6 flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
          <div>
            <p className="text-sm font-medium text-white">Need more?</p>
            <p className="text-xs text-slate-500">Custom plans for large organizations.</p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white"
            onClick={() => window.open('https://calendar.app.google/PWqhmizMxqUnRNpP9', '_blank')}
          >
            Contact Sales
          </Button>
        </div>
        </>
      )}
    </div>
  );
};
