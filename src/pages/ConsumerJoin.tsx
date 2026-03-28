import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Check, AlertCircle, ArrowLeft, CreditCard, DollarSign } from 'lucide-react';
import { AVAILABLE_FEATURES, FeatureKey } from '@/hooks/useConsumerFeatures';
import { Json } from '@/integrations/supabase/types';
import { getRedirectUrl } from '@/lib/constants';

interface InviteData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  slug: string;
  features: Json;
  custom_logo_url: string | null;
  status: string;
  expires_at: string;
  fixed_amount: number | null;
  monthly_amount: number | null;
  pricing_description: string | null;
  monthly_credits: number | null;
  is_free: boolean | null;
  skip_integration_onboarding: boolean | null;
}

// Typing effect component matching Auth page
const TypingHeadline = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayText('');
    setIsComplete(false);
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, 120);
    return () => clearInterval(timer);
  }, [text]);

  useEffect(() => {
    if (isComplete) {
      setShowCursor(false);
      return;
    }
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 600);
    return () => clearInterval(cursorTimer);
  }, [isComplete]);

  return (
    <span className="font-serif text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal leading-tight">
      {displayText}
      {!isComplete && (
        <span 
          className="ml-1 inline-block w-[3px] h-[1em] bg-white/80 align-middle"
          style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s' }}
        />
      )}
    </span>
  );
};

// Underline input component matching Auth page
const UnderlineInput = ({ 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required={required}
    className="w-full h-12 bg-transparent border-0 border-b-2 border-gray-200 rounded-none 
      focus:border-gray-900 focus:ring-0 focus:outline-none
      text-gray-900 placeholder:text-gray-400 transition-colors px-0"
  />
);

export default function ConsumerJoin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [existingUser, setExistingUser] = useState<{ id: string; paymentPending: boolean } | null>(null);

  // Check for payment status in URL
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast({
        title: 'Payment successful!',
        description: 'Your account is now fully activated.',
      });
      navigate('/chat');
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: 'Payment cancelled',
        description: 'You can try again when ready.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast, navigate]);

  useEffect(() => {
    if (slug) {
      validateInvite();
    }
  }, [slug]);

  const validateInvite = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consumer_invite_links')
        .select('*')
        .eq('slug', slug)
        .in('status', ['active', 'pending_payment'])
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError('This invite link is invalid, expired, or has already been used.');
        return;
      }

      setInvite(data);

      // Check if user already exists with pending payment
      if (data.user_id && data.status === 'pending_payment') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, payment_status')
          .eq('user_id', data.user_id)
          .maybeSingle();

        if (profile && profile.payment_status === 'pending') {
          setExistingUser({ id: profile.user_id, paymentPending: true });
        }
      }
    } catch (err: any) {
      console.error('Error validating invite:', err);
      setError('Failed to validate invite link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasPricing = (invite: InviteData) => {
    return (invite.fixed_amount && invite.fixed_amount > 0) || 
           (invite.monthly_amount && invite.monthly_amount > 0);
  };

  const getHeadline = () => {
    if (error) return "Something went wrong.";
    if (existingUser?.paymentPending) return "Complete your payment.";
    if (invite && hasPricing(invite)) return "Your custom solution awaits.";
    return "We've been expecting you.";
  };

  const handleContinueToPayment = async () => {
    if (!invite) return;
    
    setSubmitting(true);
    try {
      const featuresArray = Array.isArray(invite.features) ? invite.features : [];
      
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'create-custom-checkout',
        {
          body: {
            inviteId: invite.id,
            fixedAmount: invite.fixed_amount || 0,
            monthlyAmount: invite.monthly_amount || 0,
            email: invite.email,
            features: featuresArray,
            monthlyCredits: invite.monthly_credits,
            successUrl: getRedirectUrl('/chat?payment=success'),
            cancelUrl: getRedirectUrl(`/join/${slug}?payment=cancelled`),
          },
        }
      );

      if (checkoutError) throw new Error('Failed to create payment session');

      if (checkoutData?.url) {
        window.location.href = checkoutData.url;
      }
    } catch (err: any) {
      console.error('Error resuming payment:', err);
      toast({
        title: 'Failed to resume payment',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (!invite) return;

    setSubmitting(true);
    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          data: {
            full_name: `${invite.first_name || ''} ${invite.last_name || ''}`.trim(),
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      const showPricing = hasPricing(invite);

      // Update the invite status
      await supabase
        .from('consumer_invite_links')
        .update({
          status: showPricing ? 'pending_payment' : 'used',
          used_at: new Date().toISOString(),
          user_id: authData.user.id,
        })
        .eq('id', invite.id);

      // Update profile with custom solution flag, logo, and payment status
      await supabase
        .from('profiles')
        .update({
          is_custom_solution: true,
          custom_logo_url: invite.custom_logo_url,
          full_name: `${invite.first_name || ''} ${invite.last_name || ''}`.trim(),
          payment_status: showPricing ? 'pending' : 'completed',
          credit_renewal_day: new Date().getDate(), // Set renewal day to current day of month
          skip_integration_onboarding: invite.skip_integration_onboarding ?? false,
        })
        .eq('user_id', authData.user.id);

      // Enable selected features
      const featuresArray = Array.isArray(invite.features) ? invite.features : [];
      if (featuresArray.length > 0) {
        const featureRecords = featuresArray.map(featureKey => ({
          user_id: authData.user!.id,
          feature_key: featureKey as string,
          enabled: true,
          enabled_at: new Date().toISOString(),
        }));

        await supabase
          .from('consumer_features')
          .insert(featureRecords);
      }

      // If no pricing, apply custom credits immediately
       if (!showPricing && invite.monthly_credits !== null) {
        const creditsValue = invite.monthly_credits === -1 ? 999999 : invite.monthly_credits;
        await supabase
          .from('user_credits')
          .update({
            monthly_limit: creditsValue,
            current_credits: creditsValue,
            daily_limit: creditsValue === 999999 ? 999999 : Math.ceil(creditsValue / 5),
             last_reset_date: new Date().toISOString().split('T')[0], // Set initial reset date
          })
          .eq('user_id', authData.user.id);
      }

      // If there's pricing, redirect to Stripe checkout
      if (showPricing) {
        toast({
          title: 'Account created!',
          description: 'Redirecting to payment...',
        });

        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
          'create-custom-checkout',
          {
            body: {
              inviteId: invite.id,
              fixedAmount: invite.fixed_amount || 0,
              monthlyAmount: invite.monthly_amount || 0,
              email: invite.email,
              features: featuresArray,
              monthlyCredits: invite.monthly_credits,
              successUrl: getRedirectUrl('/chat?payment=success'),
              cancelUrl: getRedirectUrl(`/join/${slug}?payment=cancelled`),
            },
          }
        );

        if (checkoutError) {
          console.error('Checkout error:', checkoutError);
          throw new Error('Failed to create payment session');
        }

        if (checkoutData?.url) {
          window.location.href = checkoutData.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else {
        // No pricing - redirect directly to chat
        toast({
          title: 'Account created!',
          description: 'Your account has been set up successfully. Redirecting...',
        });

        await supabase
          .from('consumer_invite_links')
          .update({ status: 'used' })
          .eq('id', invite.id);

        setTimeout(() => navigate('/chat'), 1500);
      }
    } catch (err: any) {
      console.error('Error creating account:', err);
      toast({
        title: 'Failed to create account',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getFeatureNames = (features: Json): string[] => {
    const keys = Array.isArray(features) ? features : [];
    return keys.map(key => AVAILABLE_FEATURES.find(f => f.key === key)?.name || String(key));
  };

  const getFeaturesArray = (features: Json): FeatureKey[] => {
    return Array.isArray(features) ? features.filter((f): f is FeatureKey => 
      typeof f === 'string' && AVAILABLE_FEATURES.some(af => af.key === f)
    ) : [];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const logoUrl = invite?.custom_logo_url || '/assets/9a766835-c271-49a0-bc54-c0424112a3cc.png';

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - Blue - Hidden on mobile */}
      <div className="hidden lg:flex w-[55%] bg-gradient-to-b from-[#2563eb] to-[#1e40af] relative overflow-hidden">
        {/* Heavy grainy noise texture overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.35 }}>
          <filter id="grainyNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="5" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.5" />
              <feFuncG type="linear" slope="1.5" />
              <feFuncB type="linear" slope="1.5" />
            </feComponentTransfer>
          </filter>
          <rect width="100%" height="100%" filter="url(#grainyNoise)" />
        </svg>
        
        {/* Secondary grain layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.25, mixBlendMode: 'multiply' }}>
          <filter id="fineGrain">
            <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#fineGrain)" />
        </svg>
        
        {/* Decorative curved lines */}
        <svg className="absolute top-0 right-0 w-[700px] h-[700px]" viewBox="0 0 700 700" fill="none">
          <path d="M700 0 Q500 200 700 400" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
          <path d="M700 80 Q550 280 700 480" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
          <path d="M700 160 Q600 360 700 560" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
        </svg>
        
        <svg className="absolute bottom-0 left-0 w-[600px] h-[600px]" viewBox="0 0 600 600" fill="none">
          <path d="M0 600 Q200 400 0 200" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
          <path d="M0 520 Q150 320 0 120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
        </svg>
        
        <div className="flex flex-col justify-between p-12 lg:p-16 w-full relative z-10">
          <div />
          <div>
            <TypingHeadline key={getHeadline()} text={getHeadline()} />
          </div>
          <p className="text-white/40 text-sm">© 2026 Vesta. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - White - Full screen on mobile */}
      <div className="flex-1 flex flex-col bg-white px-4 py-6 sm:px-8 sm:py-8 lg:px-16 xl:px-24 min-h-[100dvh] lg:min-h-0 relative">
        {/* Top bar with back button and logo */}
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors -ml-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="h-10 object-contain"
            />
          </button>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            {error ? (
              /* Error State */
              <div className="space-y-6 text-center">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-serif text-gray-900 mb-2">
                    Invalid Invite Link
                  </h1>
                  <p className="text-gray-500">
                    {error}
                  </p>
                </div>
                <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                  Go to Homepage
                </Button>
              </div>
            ) : existingUser?.paymentPending ? (
              /* Resume Payment State */
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-2">
                    Complete Your Payment
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Your account has been created. Complete payment to activate your access.
                  </p>
                </div>

                {/* Pricing Summary - Clean minimal design */}
                {invite && hasPricing(invite) && (
                  <div className="space-y-4 py-2">
                    {invite.fixed_amount && invite.fixed_amount > 0 && (
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-gray-500 text-sm">One-time setup</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(invite.fixed_amount)}</span>
                      </div>
                    )}
                    {invite.monthly_amount && invite.monthly_amount > 0 && (
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-gray-500 text-sm">Monthly</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(invite.monthly_amount)}<span className="text-gray-400 text-sm font-normal">/mo</span></span>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleContinueToPayment}
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                  ) : (
                    <><CreditCard className="mr-2 h-4 w-4" />Continue to Payment</>
                  )}
                </Button>
              </div>
            ) : invite && (
              /* Normal Registration Form */
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-2">
                    Set Up Your Account
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Welcome, {invite.first_name || invite.email}! Create a password to get started.
                  </p>
                </div>

                {/* Pre-filled info - Clean minimal style */}
                <div className="space-y-3 py-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-gray-500 text-sm">Email</span>
                    <span className="text-gray-900">{invite.email}</span>
                  </div>
                  {invite.first_name && (
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-gray-500 text-sm">Name</span>
                      <span className="text-gray-900">
                        {invite.first_name} {invite.last_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing Section - Clean minimal design */}
                {hasPricing(invite) && (
                  <div className="space-y-3 py-2">
                    {invite.fixed_amount && invite.fixed_amount > 0 && (
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-gray-500 text-sm">One-time setup</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(invite.fixed_amount)}</span>
                      </div>
                    )}
                    {invite.monthly_amount && invite.monthly_amount > 0 && (
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-gray-500 text-sm">Monthly</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(invite.monthly_amount)}<span className="text-gray-400 text-sm font-normal">/mo</span></span>
                      </div>
                    )}
                    {invite.pricing_description && (
                      <p className="text-xs text-gray-400 pt-1">
                        {invite.pricing_description}
                      </p>
                    )}
                  </div>
                )}

                {/* Features - Minimal inline style */}
                {getFeaturesArray(invite.features).length > 0 && (
                  <div className="flex flex-wrap gap-2 py-2">
                    {getFeatureNames(invite.features).map((name) => (
                      <span key={name} className="inline-flex items-center text-xs text-gray-500">
                        <Check className="h-3 w-3 mr-1 text-gray-400" />
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Password form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <UnderlineInput
                    type="password"
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  
                  <UnderlineInput
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg mt-2" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                    ) : hasPricing(invite) ? (
                      <><CreditCard className="mr-2 h-4 w-4" />Create Account & Pay</>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>

                <p className="text-xs text-center text-gray-400">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
