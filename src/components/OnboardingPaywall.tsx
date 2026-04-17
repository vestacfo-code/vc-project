import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Check, 
  Zap, 
  Users, 
  Download, 
  TrendingUp, 
  Crown,
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface OnboardingPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueFree: () => void;
}

export const OnboardingPaywall = ({ open, onOpenChange, onContinueFree }: OnboardingPaywallProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (tier: 'scale' | 'ceo') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { tier, isAnnual: false }
      });
      
      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');
      
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Failed to create checkout:', error);
      toast.error(`Failed to start checkout process: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithFree = () => {
    onContinueFree();
    onOpenChange(false);
  };

  const tiers = [
    {
      id: 'founder' as const,
      name: 'The Founder',
      price: 'FREE',
      period: 'forever',
      description: 'Perfect for getting started',
      icon: <Star className="h-6 w-6" />,
      gradient: 'from-vesta-navy-muted to-vesta-navy',
      features: [
        '5 AI credits daily (30/month max)',
        '5 report downloads per month',
        'Basic financial analysis',
        'AI-powered insights',
        'Email support',
        'Solo user only'
      ],
      buttonText: 'Continue Free',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      id: 'scale' as const,
      name: 'Scale',
      price: '$25.99',
      period: '/month',
      description: 'Perfect for growing businesses',
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: 'from-blue-500 to-purple-600',
      features: [
        '100 AI credits per month',
        '25 report downloads per month',
        'Full financial analysis unlocked',
        'Advanced AI insights',
        'Up to 2 collaborators',
        'Priority support',
      ],
      buttonText: 'Subscribe Now',
      buttonVariant: 'default' as const,
      popular: true
    },
    {
      id: 'ceo' as const,
      name: 'CFO',
      price: '$39.99',
      period: '/month',
      description: 'Everything you need to scale',
      icon: <Crown className="h-6 w-6" />,
      gradient: 'from-purple-500 to-pink-600',
      features: [
        '250 AI credits per month',
        'Unlimited report downloads',
        'Complete financial analysis suite',
        'Advanced AI insights & reporting',
        'Up to 6 collaborators',
        'Dedicated account manager',
      ],
      buttonText: 'Subscribe Now',
      buttonVariant: 'default' as const,
      popular: false
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-0">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DialogTitle className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Choose Your Plan to Continue ✨
            </DialogTitle>
            <p className="text-center text-vesta-navy/80 text-lg mt-2">
              Complete your setup by selecting a plan that fits your needs
            </p>
          </motion.div>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Pricing tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier, idx) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -10, scale: tier.popular ? 1.02 : 1.03 }}
              >
                <Card 
                  className={`relative h-full glass-card border-0 shadow-xl ${
                    tier.popular ? 'scale-105 shadow-2xl' : ''
                  }`}
                >
                  {tier.popular && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                    >
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 text-sm font-semibold shadow-lg">
                        <Sparkles className="w-3 h-3 mr-1 inline" />
                        Most Popular
                      </Badge>
                    </motion.div>
                  )}
                  
                  <CardHeader className="text-center pb-4 pt-6">
                    <motion.div
                      className="flex justify-center mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${tier.gradient} text-white shadow-lg`}>
                        {tier.icon}
                      </div>
                    </motion.div>
                    <CardTitle className="text-2xl font-bold text-vesta-navy">{tier.name}</CardTitle>
                    <p className="text-sm text-vesta-navy/80 mt-1">{tier.description}</p>
                    
                    <div className="mt-6">
                      <div className="text-4xl font-bold text-vesta-navy">
                        {tier.price}
                        <span className="text-lg font-normal text-vesta-navy/80">
                          {tier.period}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
                          className="flex items-center gap-3 text-sm"
                        >
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <span className="text-vesta-navy/90 font-medium">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => {
                        if (tier.id === 'founder') {
                          handleContinueWithFree();
                        } else {
                          handleUpgrade(tier.id);
                        }
                      }}
                      disabled={loading}
                      className={`w-full py-6 text-base font-semibold rounded-xl transition-all duration-300 ${
                        tier.id === 'founder'
                          ? 'bg-white/50 text-vesta-navy hover:bg-white/70 border-2 border-vesta-navy/15'
                          : `bg-gradient-to-r ${tier.gradient} text-white hover:shadow-2xl hover:scale-105`
                      }`}
                      variant={tier.id === 'founder' ? 'outline' : 'default'}
                    >
                      {tier.buttonText}
                      {tier.id !== 'founder' && <ArrowRight className="h-5 w-5 ml-2" />}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Benefits section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center space-y-6 glass-card rounded-3xl p-8"
          >
            <h3 className="font-bold text-2xl text-vesta-navy">Why upgrade? 🚀</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Zap, label: 'More AI Credits', color: 'text-yellow-600' },
                { icon: Download, label: 'More Downloads', color: 'text-blue-600' },
                { icon: Users, label: 'Team Collaboration', color: 'text-purple-600' },
                { icon: TrendingUp, label: 'Advanced Features', color: 'text-green-600' }
              ].map((benefit, idx) => (
                <motion.div
                  key={benefit.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + idx * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <benefit.icon className={`h-8 w-8 ${benefit.color}`} />
                  <span className="text-sm font-medium text-vesta-navy/90">{benefit.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-center text-sm text-vesta-navy/80 space-y-2"
          >
            <p className="font-medium">✓ Cancel anytime • ✓ No long-term commitments • ✓ Secure payment processing</p>
            <p>Questions? Contact us at <span className="font-semibold text-blue-600">vestacfo@gmail.com</span></p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
