import { useState } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  X, 
  Clock,
  TrendingUp,
  Crown,
  Check,
  AlertTriangle
} from 'lucide-react';

interface PaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditsNeeded: number;
  action: string;
  onContinueWithFree?: () => void;
  allowFreeMode?: boolean;
}

export const Paywall = ({ 
  open, 
  onOpenChange, 
  creditsNeeded, 
  action, 
  onContinueWithFree,
  allowFreeMode = false 
}: PaywallProps) => {
  const { credits, getTierInfo } = useCredits();

  if (!credits) return null;

  const currentTierInfo = getTierInfo(credits.tier);
  
  const handleUpgrade = () => {
    window.dispatchEvent(new CustomEvent('openSettings', { 
      detail: { tab: 'plan-credits' } 
    }));
    onOpenChange(false); // Close the paywall dialog
  };

  const handleContinueFree = () => {
    if (onContinueWithFree) {
      onContinueWithFree();
    }
    onOpenChange(false);
  };

  const benefits = [
    'Unlimited AI-powered financial analysis',
    'Advanced insights and recommendations',
    'Priority processing and support',
    'Export and share professional reports',
    'Collaborate with team members',
    'Track performance over time'
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Credits Required
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Status */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-orange-900">
                      Insufficient Credits
                    </h3>
                    <p className="text-sm text-orange-700">
                      You need {creditsNeeded} credits to {action}, but only have {credits.current_credits} remaining.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Plan */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Current Plan</CardTitle>
                  <Badge variant="secondary">{currentTierInfo.name}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold">{credits.current_credits}</div>
                  <div className="text-sm text-muted-foreground">credits remaining</div>
                </div>
                
                <div className="mt-3 text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Credits reset monthly on {credits.next_reset_date ? new Date(credits.next_reset_date).toLocaleDateString() : 'your billing date'}
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Benefits */}
            <div>
              <h3 className="font-medium mb-3">Upgrade to unlock:</h3>
              <div className="grid gap-2">
                {benefits.slice(0, 3).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tier Overview */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium text-blue-900">Scale</div>
                  <div className="text-sm text-blue-700">150 credits/month</div>
                  <div className="text-xs text-blue-600">$25.99/month</div>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4 text-center">
                  <Crown className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="font-medium text-purple-900">CFO</div>
                  <div className="text-sm text-purple-700">250 credits/month</div>
                  <div className="text-xs text-purple-600">$39.99/month</div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleUpgrade}
                className="w-full"
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
              
              {allowFreeMode && onContinueWithFree && (
                <Button 
                  variant="outline" 
                  onClick={handleContinueFree}
                  className="w-full"
                >
                  Continue with Free Plan
                </Button>
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <p>✓ Cancel anytime • ✓ No long-term commitments • ✓ Instant access</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
};