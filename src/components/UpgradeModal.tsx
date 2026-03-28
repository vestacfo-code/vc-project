import { useState } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Check, 
  Zap, 
  Users, 
  Download, 
  TrendingUp, 
  Crown,
  Loader2,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CreditAddOnDialog } from '@/components/CreditAddOnDialog';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier?: string;
}

export const UpgradeModal = ({ open, onOpenChange, currentTier = 'founder' }: UpgradeModalProps) => {
  const { getTierInfo } = useCredits();
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');

  const handleUpgrade = async (tier: 'scale' | 'ceo') => {
    try {
      setLoading(tier);
      
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { tier, isAnnual }
      });

      if (error) throw error;
      if (!data.url) throw new Error('No checkout URL received');

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirecting to Checkout",
        description: "Opening Stripe checkout in a new tab...",
      });

      // Close modal after a short delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);

    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDiscountCode = async () => {
    console.log('Discount code handler triggered with:', discountCode);
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply discount codes",
        variant: "destructive",
      });
      return;
    }

    if (discountCode.trim().toLowerCase() === 'founder@vesta.ai') {
      console.log('Valid discount code detected, calling activate-founder...');
      try {
        const { data, error } = await supabase.functions.invoke('activate-founder', {
          body: { discountCode: discountCode.trim() }
        });
        
        console.log('Activate founder response:', { data, error });
        
        if (error) {
          console.error('Activate founder error:', error);
          throw error;
        }
        
        console.log('Founder access activated successfully!');
        toast({
          title: "🎉 Founder Access Activated!",
          description: "Lifetime CFO tier access granted! Welcome to the founder family.",
        });
        
        // Close modal and redirect to dashboard
        onOpenChange(false);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } catch (error) {
        console.error('Failed to activate founder access:', error);
        toast({
          title: "Activation Failed",
          description: `Failed to activate founder access: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } else {
      console.log('Invalid discount code:', discountCode);
      toast({
        title: "Invalid Code",
        description: "Invalid discount code",
        variant: "destructive",
      });
    }
  };

  const getPricingInfo = (tier: 'scale' | 'ceo') => {
    const pricing = {
      scale: {
        monthly: 25.99,
        annual: Math.round(25.99 * 12 * 0.9 * 100) / 100, // 10% discount, fixed calculation
      },
      ceo: {
        monthly: 39.99,
        annual: Math.round(39.99 * 12 * 0.9 * 100) / 100, // 10% discount, fixed calculation
      }
    };

    const price = pricing[tier];
    const currentPrice = isAnnual ? price.annual : price.monthly;
    const savings = isAnnual ? Math.round((price.monthly * 12 - price.annual) * 100) / 100 : 0;

    return {
      price: currentPrice,
      period: isAnnual ? '/year' : '/month',
      savings: savings > 0 ? savings : 0
    };
  };

  const tiers = [
    {
      id: 'scale' as const,
      name: 'Scale',
      description: 'Perfect for growing businesses',
      icon: <TrendingUp className="h-6 w-6" />,
      credits: 100,
      downloads: 25,
      collaborators: 2,
      features: [
        '100 AI credits per month',
        '25 report downloads',
        'Up to 2 collaborators',
        'Full financial analysis',
        'Priority support',
        'Advanced insights'
      ],
      popular: true
    },
    {
      id: 'ceo' as const,
      name: 'CFO',
      description: 'Everything you need to scale',
      icon: <Crown className="h-6 w-6" />,
      credits: 250,
      downloads: -1,
      collaborators: 6,
      features: [
        '250 AI credits per month',
        'Unlimited report downloads',
        'Up to 6 collaborators',
        'All Scale features',
        'White-label reports',
        'Dedicated account manager'
      ],
      popular: false
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Upgrade Your Plan
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Get more credits and unlock powerful features to grow your business
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Label htmlFor="billing-toggle" className={!isAnnual ? 'font-medium' : 'text-muted-foreground'}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="billing-toggle" className={isAnnual ? 'font-medium' : 'text-muted-foreground'}>
              Annual
            </Label>
            {isAnnual && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Save 10%
              </Badge>
            )}
          </div>

          {/* Current Plan */}
          {currentTier === 'founder' && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Current Plan: The Founder</CardTitle>
                  <Badge variant="secondary">FREE</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">5 credits/day</div>
                    <div className="text-muted-foreground">30/month max</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">5 downloads</div>
                    <div className="text-muted-foreground">per month</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">0 collaborators</div>
                    <div className="text-muted-foreground">solo only</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upgrade Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {tiers.map((tier) => {
              const pricing = getPricingInfo(tier.id);
              const isCurrentTier = currentTier === tier.id;
              
              return (
                <Card 
                  key={tier.id}
                  className={`relative ${tier.popular ? 'border-primary shadow-lg' : 'border-border'} ${isCurrentTier ? 'opacity-50' : ''}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        {tier.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                    
                    <div className="mt-4">
                      <div className="text-3xl font-bold">
                        ${pricing.price}
                        <span className="text-lg font-normal text-muted-foreground">
                          {pricing.period}
                        </span>
                      </div>
                      {pricing.savings > 0 && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Save ${pricing.savings.toFixed(2)} per year
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="text-center">
                        <div className="font-medium flex items-center justify-center gap-1">
                          <Zap className="h-3 w-3" />
                          {tier.credits}
                        </div>
                        <div className="text-muted-foreground text-xs">credits/month</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium flex items-center justify-center gap-1">
                          <Download className="h-3 w-3" />
                          {tier.downloads === -1 ? '∞' : tier.downloads}
                        </div>
                        <div className="text-muted-foreground text-xs">downloads</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium flex items-center justify-center gap-1">
                          <Users className="h-3 w-3" />
                          {tier.collaborators}
                        </div>
                        <div className="text-muted-foreground text-xs">collaborators</div>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleUpgrade(tier.id)}
                      disabled={loading === tier.id || isCurrentTier}
                      className="w-full"
                      variant={tier.popular ? "default" : "outline"}
                    >
                      {loading === tier.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentTier ? (
                        'Current Plan'
                      ) : (
                        `Upgrade to ${tier.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add-on Credits Section */}
          {(currentTier === 'scale' || currentTier === 'ceo') && (
            <div className="border-t pt-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Need More Credits?</h3>
                <p className="text-sm text-muted-foreground">Add extra credits to your monthly allowance</p>
              </div>
              <div className="flex justify-center">
                <CreditAddOnDialog>
                  <Button variant="outline" className="gap-2">
                    <Zap className="h-4 w-4" />
                    Add Extra Credits
                  </Button>
                </CreditAddOnDialog>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>• Cancel anytime, no long-term commitments</p>
            <p>• All plans include automatic credit resets and usage tracking</p>
            <p>• Start with our free tier or upgrade for more features</p>
          </div>

          {/* Discount Code Section */}
          {currentTier === 'founder' && (
            <div className="mt-8 max-w-md mx-auto">
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground text-center">
                  Have a discount code? Click here
                </summary>
                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter discount code..."
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleDiscountCode()}
                    />
                    <Button 
                      onClick={handleDiscountCode}
                      disabled={!discountCode.trim()}
                      size="sm"
                      variant="outline"
                    >
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Enter a valid discount code to unlock special offers
                  </p>
                </div>
              </details>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};