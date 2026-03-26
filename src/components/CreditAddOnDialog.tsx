import { useState } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Zap, CreditCard, Minus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CreditAddOnDialogProps {
  children: React.ReactNode;
}

export const CreditAddOnDialog = ({ children }: CreditAddOnDialogProps) => {
  const { credits } = useCredits();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [customCredits, setCustomCredits] = useState(200);

  const handlePurchaseAddon = async (creditAmount: number) => {
    if (!credits) {
      toast({
        title: "Error",
        description: "Unable to load credit information. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Only allow add-ons for paid tiers
    if (credits.tier === 'founder') {
      toast({
        title: "Upgrade Required",
        description: "Credit add-ons are only available for Scale and CFO plan subscribers. Please upgrade your plan first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription-credits', {
        body: { action: 'add', credits: creditAmount }
      });

      if (error) throw error;

      if (data.error) {
        // If error indicates no main subscription, fall back to create-addon-subscription
        if (data.error.includes("No active main subscription")) {
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-addon-subscription', {
            body: { credits: creditAmount }
          });

          if (checkoutError) throw checkoutError;

          if (checkoutData.url) {
            // Open Stripe checkout in a new tab
            window.open(checkoutData.url, '_blank');
            setOpen(false);
            toast({
              title: "Redirecting to Payment",
              description: "Opening Stripe checkout in a new tab...",
            });
            return;
          }
        }
        throw new Error(data.error);
      }

      // Success - credits added to existing subscription
      setOpen(false);
      toast({
        title: "Credits Added Successfully",
        description: `${creditAmount} credits have been added to your subscription. Your billing will be updated accordingly.`,
      });
      
    } catch (err) {
      console.error('Error managing subscription credits:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to manage subscription credits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adjustCredits = (amount: number) => {
    setCustomCredits(prev => Math.max(200, prev + amount));
  };

  const calculatePrice = (credits: number) => {
    return Math.round(credits * 0.125); // $0.125 per credit
  };

  const creditOptions = [
    {
      credits: 200,
      price: 25,
      popular: true,
      description: "Perfect for power users"
    },
    {
      credits: 400,
      price: 50,
      popular: false,
      description: "For heavy usage"
    },
    {
      credits: 600,
      price: 75,
      popular: false,
      description: "Maximum productivity"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <DialogTitle>Add Extra Credits</DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>
            Boost your monthly credit allowance with add-on packages. Perfect for power users who need more AI interactions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Options</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {creditOptions.map((option) => (
                <Card key={option.credits} className={`relative cursor-pointer transition-colors hover:bg-accent ${option.popular ? 'border-primary' : ''}`}
                      onClick={() => handlePurchaseAddon(option.credits)}>
                  {option.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="flex items-center justify-center gap-2 text-lg">
                      <Zap className="h-5 w-5 text-primary" />
                      +{option.credits} Credits
                    </CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="text-center space-y-4">
                    <div>
                      <div className="text-3xl font-bold">
                        ${option.price}
                        <span className="text-lg font-normal text-muted-foreground">/month</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${(option.price / option.credits).toFixed(3)} per credit
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>• {option.credits} extra credits monthly</div>
                      <div>• Stacks with your current plan</div>
                      <div>• Cancel anytime</div>
                      <div>• Instant activation</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Custom Amount</h3>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="custom-credits">Number of Credits (increments of 200)</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustCredits(-200)}
                        disabled={customCredits <= 200}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="custom-credits"
                        type="number"
                        value={customCredits}
                        onChange={(e) => {
                          const value = Math.max(200, Math.round(Number(e.target.value) / 200) * 200);
                          setCustomCredits(value);
                        }}
                        min="200"
                        step="200"
                        className="text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustCredits(200)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold">
                      ${calculatePrice(customCredits)}
                      <span className="text-lg font-normal text-muted-foreground">/month</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${(calculatePrice(customCredits) / customCredits).toFixed(3)} per credit
                    </div>
                  </div>

                  <Button 
                    onClick={() => handlePurchaseAddon(customCredits)}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {loading ? "Processing..." : `Add ${customCredits} Credits`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">How Credit Add-ons Work</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Add-on credits are added to your monthly allowance</li>
            <li>• Credits reset each month on your billing anniversary</li>
            <li>• You can purchase multiple add-ons to stack credits</li>
            <li>• Manage or cancel add-ons anytime through your account</li>
            <li>• Only available for Scale and CFO plan subscribers</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};