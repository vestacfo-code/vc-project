import { useState, useEffect } from 'react';
import { Check, HelpCircle, Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PaymentSelection = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    subscription_tier?: string;
    subscription_end?: string;
  }>({ subscribed: false });
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('PaymentSelection - User:', user, 'Subscription:', subscription);

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
      
      // If already subscribed, redirect to chat
      if (data.subscribed && !window.location.search.includes('manage=true')) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const handleSubscribe = async (tier: 'scale' | 'ceo') => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    // Check if onboarding is completed by checking profile data
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_name, industry')
        .eq('user_id', user.id)
        .single();

      if (error || !profile?.company_name || !profile?.industry) {
        toast.error('Please complete your onboarding first');
        navigate('/onboarding');
        return;
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      toast.error('Please complete your onboarding first');
      navigate('/onboarding');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting checkout with tier:', tier, 'isAnnual:', isAnnual);
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { tier, isAnnual }
      });
      
      console.log('Checkout response:', { data, error });
      
      if (error) {
        console.error('Checkout error details:', error);
        throw error;
      }
      
      if (!data?.url) {
        throw new Error('No checkout URL received');
      }
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Failed to create checkout:', error);
      toast.error(`Failed to start checkout process: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFounderAccess = () => {
    // Founder tier is free, just navigate to chat
    toast.success('Welcome to The Founder tier! You now have access to free credits.');
    navigate('/chat');
  };

  const handleDiscountCode = async () => {
    console.log('Discount code handler triggered with:', discountCode);
    
    if (!user) {
      toast.error('Please log in to apply discount codes');
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
        
        console.log('Founder access activated successfully, updating state...');
        setSubscription({
          subscribed: true,
          subscription_tier: 'Founder Access',
          subscription_end: undefined // Lifetime access
        });
        toast.success('🎉 Lifetime founder access activated! Welcome to the founder family.');
        // Force navigation to chat
        setTimeout(() => {
          window.location.href = '/chat';
        }, 1000);
      } catch (error) {
        console.error('Failed to activate founder access:', error);
        toast.error(`Failed to activate founder access: ${error.message || 'Unknown error'}`);
      }
    } else {
      console.log('Invalid discount code:', discountCode);
      toast.error('Invalid discount code');
    }
  };

  const founderFeatures = [
    '5 AI credits daily (30/month max)',
    '5 report downloads per month',
    'Basic financial analysis',
    'AI-powered insights',
    'Document processing',
    'Email support',
    'Solo user only (0 collaborators)'
  ];

  const scaleFeatures = [
    '150 AI credits per month',
    '25 report downloads per month',
    'Full financial analysis unlocked',
    'Advanced AI insights',
    'Document processing & analysis',
    'Up to 2 collaborators',
    'Priority support',
    'Credit add-ons available ($10/100 credits)'
  ];

  const ceoFeatures = [
    '250 AI credits per month',
    'Unlimited report downloads',
    'Complete financial analysis suite',
    'Advanced AI insights & reporting',
    'Full document processing',
    'Up to 6 collaborators',
    'Dedicated account manager',
    'Credit add-ons available ($10/100 credits)'
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in to continue</h2>
          <Button onClick={() => navigate('/auth')}>Go to Login</Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Business Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Complete your setup by selecting a payment plan
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Monthly billing
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm ${isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Annually billing
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="ml-2">
                Save 10%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* The Founder Tier - FREE */}
          <Card className="flex-1 relative">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-foreground">
                The Founder
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Perfect for getting started
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">
                  FREE
                </span>
                <span className="text-muted-foreground ml-2">
                  forever
                </span>
                <div className="text-xs text-muted-foreground mt-2">
                  No credit card required
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {founderFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={handleFounderAccess}
                disabled={!user}
                className="w-full" 
                size="lg"
                variant="outline"
              >
                {user ? 'Get Started Free' : 'Log in to Start'}
              </Button>
            </CardFooter>
          </Card>

          {/* Scale Tier */}
          <Card className="flex-1 relative border-2 border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-foreground">
                Scale
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Perfect for growing businesses
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">
                  ${isAnnual ? Math.round(25.99 * 12 * 0.9 / 12 * 100) / 100 : '25.99'}
                </span>
                <span className="text-muted-foreground ml-2">
                  /month
                </span>
                {isAnnual && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Billed annually (save 10%)
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {scaleFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={() => handleSubscribe('scale')}
                disabled={loading || !user}
                className="w-full" 
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : user ? (
                  'Start Subscription'
                ) : (
                  'Log in to Subscribe'
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* CEO Tier */}
          <Card className="flex-1 relative">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-foreground">
                CFO
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Everything you need to scale
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">
                  ${isAnnual ? Math.round(39.99 * 12 * 0.9 / 12 * 100) / 100 : '39.99'}
                </span>
                <span className="text-muted-foreground ml-2">
                  /month
                </span>
                {isAnnual && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Billed annually (save 10%)
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {ceoFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={() => handleSubscribe('ceo')}
                disabled={loading || !user}
                className="w-full" 
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : user ? (
                  'Start Subscription'
                ) : (
                  'Log in to Subscribe'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Start with our free tier or choose a paid plan that fits your needs.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Secure payment processing</span>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground">
              Questions about billing? Contact us at <a href="mailto:support@vesta.ai" className="text-primary hover:underline">support@vesta.ai</a>
            </p>
          </div>
          
          {/* Discount code section - always show for founder tier or unsubscribed users */}
          {(subscription.subscription_tier === 'Founder Access' || !subscription.subscribed) && (
            <div className="mt-12 max-w-md mx-auto">
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Have a discount code? Click here
                </summary>
                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code..."
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="text-sm"
                    />
                    <Button 
                      onClick={handleDiscountCode}
                      disabled={!discountCode}
                      size="sm"
                      variant="outline"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSelection;