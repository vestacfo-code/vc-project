import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check, Link, Upload, Sparkles, Coins } from 'lucide-react';
import { AVAILABLE_FEATURES, FeatureKey } from '@/hooks/useConsumerFeatures';
import { getRedirectUrl } from '@/lib/constants';

interface CreateConsumerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateConsumerDialog({ open, onOpenChange, onSuccess }: CreateConsumerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    fixedAmount: '',
    monthlyAmount: '',
    pricingDescription: '',
    customLogoUrl: '',
    selectedFeatures: [] as FeatureKey[],
    creditOption: 'default' as 'default' | 'custom' | 'unlimited',
    customCredits: '',
    isFree: false,
    skipIntegrationOnboarding: false,
  });

  const handleFeatureToggle = (featureKey: FeatureKey) => {
    setFormData(prev => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(featureKey)
        ? prev.selectedFeatures.filter(f => f !== featureKey)
        : [...prev.selectedFeatures, featureKey]
    }));
  };

  const generateSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';
    for (let i = 0; i < 12; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address for the consumer.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = generateSlug();

      // Create the invite link with pricing information
      // Calculate monthly credits value
      let monthlyCredits: number | null = null;
      if (formData.creditOption === 'unlimited') {
        monthlyCredits = -1; // -1 represents unlimited (will be converted to 999999)
      } else if (formData.creditOption === 'custom' && formData.customCredits) {
        monthlyCredits = parseInt(formData.customCredits);
      }

      const { data: invite, error: inviteError } = await supabase
        .from('consumer_invite_links')
        .insert({
          email: formData.email,
          first_name: formData.firstName || null,
          last_name: formData.lastName || null,
          slug,
          features: formData.selectedFeatures,
          custom_logo_url: formData.customLogoUrl || null,
          created_by: user.id,
          status: 'active',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          fixed_amount: formData.isFree ? 0 : (formData.fixedAmount ? parseFloat(formData.fixedAmount) : 0),
          monthly_amount: formData.isFree ? 0 : (formData.monthlyAmount ? parseFloat(formData.monthlyAmount) : 0),
          pricing_description: formData.pricingDescription || null,
          monthly_credits: monthlyCredits,
          is_free: formData.isFree,
          skip_integration_onboarding: formData.skipIntegrationOnboarding,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Generate the full URL using production domain
      const inviteLink = getRedirectUrl(`/join/${slug}`);
      setGeneratedLink(inviteLink);

      toast({
        title: 'Invite link created!',
        description: 'Copy the link and share it with the consumer.',
      });
    } catch (error: any) {
      console.error('Error creating consumer invite:', error);
      toast({
        title: 'Failed to create invite',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      fixedAmount: '',
      monthlyAmount: '',
      pricingDescription: '',
      customLogoUrl: '',
      selectedFeatures: [],
      creditOption: 'default',
      customCredits: '',
      isFree: false,
      skipIntegrationOnboarding: false,
    });
    setGeneratedLink(null);
    setCopied(false);
    onOpenChange(false);
    if (generatedLink) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Custom Consumer
          </DialogTitle>
          <DialogDescription>
            Create a custom solution consumer with pre-configured features and pricing.
            They'll receive an invite link to set up their account.
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-6 py-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Link className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">Invite Link Generated!</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Share this link with {formData.firstName || formData.email} to complete their registration.
                </p>
                
                <div className="flex gap-2">
                  <Input 
                    value={generatedLink} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button onClick={copyLink} variant="outline">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  This link expires in 7 days and can only be used once.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium">Consumer Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h4 className="font-medium">Custom Pricing</h4>
                 <label 
                   htmlFor="is-free"
                   className="flex items-center gap-2 cursor-pointer"
                 >
                   <Checkbox
                     id="is-free"
                     checked={formData.isFree}
                     onCheckedChange={(checked) => setFormData({ 
                       ...formData, 
                       isFree: checked === true,
                       fixedAmount: checked ? '' : formData.fixedAmount,
                       monthlyAmount: checked ? '' : formData.monthlyAmount,
                     })}
                   />
                   <span className="text-sm font-medium text-green-600">Free Account</span>
                 </label>
               </div>
               
               {formData.isFree ? (
                 <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                   <p className="text-sm text-green-700">
                     This account will be completely free. No payment will be required and credits will reset monthly from the account creation date.
                   </p>
                 </div>
               ) : (
                 <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fixedAmount">One-time Setup Fee ($)</Label>
                  <Input
                    id="fixedAmount"
                    type="number"
                    placeholder="0"
                    value={formData.fixedAmount}
                    onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyAmount">Monthly Fee ($)</Label>
                  <Input
                    id="monthlyAmount"
                    type="number"
                    placeholder="0"
                    value={formData.monthlyAmount}
                    onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricingDescription">Pricing Notes</Label>
                <Textarea
                  id="pricingDescription"
                  placeholder="Any notes about the custom pricing arrangement..."
                  value={formData.pricingDescription}
                  onChange={(e) => setFormData({ ...formData, pricingDescription: e.target.value })}
                  rows={2}
                />
              </div>
                 </>
               )}
            </div>

            <Separator />

            {/* Monthly Credits */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Monthly Credits</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Set the monthly credit allocation for this consumer.
              </p>
              <RadioGroup
                value={formData.creditOption}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  creditOption: value as 'default' | 'custom' | 'unlimited' 
                })}
                className="space-y-3"
              >
                <label 
                  htmlFor="credit-default"
                  className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <RadioGroupItem value="default" id="credit-default" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Default (based on tier)</p>
                    <p className="text-xs text-muted-foreground">Uses standard tier credit limits</p>
                  </div>
                </label>
                <label 
                  htmlFor="credit-custom"
                  className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <RadioGroupItem value="custom" id="credit-custom" />
                  <div className="flex-1 flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">Custom amount</p>
                      <p className="text-xs text-muted-foreground">Set a specific limit</p>
                    </div>
                    {formData.creditOption === 'custom' && (
                      <Input
                        type="number"
                        placeholder="100"
                        value={formData.customCredits}
                        onChange={(e) => setFormData({ ...formData, customCredits: e.target.value })}
                        className="w-28 h-8"
                        min="1"
                      />
                    )}
                  </div>
                </label>
                <label 
                  htmlFor="credit-unlimited"
                  className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <RadioGroupItem value="unlimited" id="credit-unlimited" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Unlimited credits</p>
                    <p className="text-xs text-muted-foreground">No monthly limit</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <Separator />

            {/* Features */}
            <div className="space-y-4">
              <h4 className="font-medium">Custom Features</h4>
              <p className="text-sm text-muted-foreground">
                Select the features this consumer will have access to beyond the standard Dashboard and Chat.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_FEATURES.map((feature) => {
                  const isSelected = formData.selectedFeatures.includes(feature.key);
                  return (
                    <label
                      key={feature.key}
                      htmlFor={`feature-${feature.key}`}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        id={`feature-${feature.key}`}
                        checked={isSelected}
                        onCheckedChange={() => handleFeatureToggle(feature.key)}
                      />
                      <div>
                        <p className="font-medium text-sm">{feature.name}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Branding */}
            <div className="space-y-4">
              <h4 className="font-medium">White-Label Branding (Optional)</h4>
              <div className="space-y-2">
                <Label htmlFor="customLogoUrl">Custom Logo URL</Label>
                <Input
                  id="customLogoUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.customLogoUrl}
                  onChange={(e) => setFormData({ ...formData, customLogoUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a URL to a logo image that will replace the Vesta logo in their dashboard.
                </p>
              </div>
            </div>

            <Separator />

            {/* Integration Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Integration Settings</h4>
              <label 
                htmlFor="skip-integration"
                className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Checkbox
                  id="skip-integration"
                  checked={formData.skipIntegrationOnboarding}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    skipIntegrationOnboarding: checked === true 
                  })}
                />
                <div>
                  <p className="font-medium text-sm">Skip Accounting Integration Requirement</p>
                  <p className="text-xs text-muted-foreground">
                    When enabled, this user will not see the QuickBooks/Wave connection walkthrough 
                    and can access all features without connecting an integration.
                  </p>
                </div>
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Invite Link
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
