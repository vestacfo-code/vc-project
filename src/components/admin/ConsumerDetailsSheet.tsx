import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Building2, 
  Calendar, 
  CreditCard, 
  Sparkles,
  User,
  Activity,
  Settings,
  Loader2,
  Save,
  ExternalLink,
   Copy,
   Edit,
   X
} from 'lucide-react';
import { format } from 'date-fns';
import { FeatureManager } from './FeatureManager';
import { AVAILABLE_FEATURES, FeatureKey } from '@/hooks/useConsumerFeatures';

interface Consumer {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  industry: string | null;
  created_at: string;
  is_custom_solution: boolean;
  custom_logo_url: string | null;
  subscription_tier?: string;
  credits_remaining?: number;
  features_enabled?: string[];
}

interface ConsumerDetailsSheetProps {
  consumer: Consumer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ConsumerDetailsSheet({ consumer, open, onOpenChange, onUpdate }: ConsumerDetailsSheetProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [creditUsage, setCreditUsage] = useState<any[]>([]);
  const [customPricing, setCustomPricing] = useState<any>(null);
  const [isCustomSolution, setIsCustomSolution] = useState(false);
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
   const [isEditing, setIsEditing] = useState(false);
   const [editForm, setEditForm] = useState({
     full_name: '',
     company_name: '',
     industry: '',
   });

  useEffect(() => {
    if (consumer && open) {
      loadConsumerDetails();
       setEditForm({
         full_name: consumer.full_name || '',
         company_name: consumer.company_name || '',
         industry: consumer.industry || '',
       });
       setIsEditing(false);
    }
  }, [consumer, open]);

  const loadConsumerDetails = async () => {
    if (!consumer) return;
    
    setLoading(true);
    try {
      // Load credit usage
      const { data: usage } = await supabase
        .from('credit_usage_log')
        .select('*')
        .eq('user_id', consumer.user_id)
        .order('timestamp', { ascending: false })
        .limit(10);
      
      setCreditUsage(usage || []);

      // Load custom pricing
      const { data: pricing } = await supabase
        .from('custom_pricing')
        .select('*')
        .eq('user_id', consumer.user_id)
        .eq('is_active', true)
        .maybeSingle();
      
      setCustomPricing(pricing);

      // Load features
      const { data: features } = await supabase
        .from('consumer_features')
        .select('feature_key')
        .eq('user_id', consumer.user_id)
        .eq('enabled', true);
      
      setEnabledFeatures(features?.map(f => f.feature_key) || []);
      setIsCustomSolution(consumer.is_custom_solution);
    } catch (error) {
      console.error('Error loading consumer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCustomSolution = async (enabled: boolean) => {
    if (!consumer) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_custom_solution: enabled })
        .eq('user_id', consumer.user_id);

      if (error) throw error;
      
      setIsCustomSolution(enabled);
      onUpdate();
      toast({
        title: enabled ? 'Custom solution enabled' : 'Custom solution disabled',
        description: `${consumer.full_name || consumer.email} is now ${enabled ? 'a' : 'no longer a'} custom solution user.`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to update',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureToggle = async (featureKey: FeatureKey, enabled: boolean) => {
    if (!consumer) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (enabled) {
        // Insert or update feature
        const { error } = await supabase
          .from('consumer_features')
          .upsert({
            user_id: consumer.user_id,
            feature_key: featureKey,
            enabled: true,
            enabled_by: user?.id,
            enabled_at: new Date().toISOString(),
          }, { onConflict: 'user_id,feature_key' });

        if (error) throw error;
        setEnabledFeatures([...enabledFeatures, featureKey]);
      } else {
        // Disable feature
        const { error } = await supabase
          .from('consumer_features')
          .update({ enabled: false })
          .eq('user_id', consumer.user_id)
          .eq('feature_key', featureKey);

        if (error) throw error;
        setEnabledFeatures(enabledFeatures.filter(f => f !== featureKey));
      }

      toast({
        title: enabled ? 'Feature enabled' : 'Feature disabled',
        description: `${featureKey} has been ${enabled ? 'enabled' : 'disabled'} for this user.`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Failed to update feature',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

   const handleSaveProfile = async () => {
     if (!consumer) return;
     setSaving(true);
     try {
       const { error } = await supabase
         .from('profiles')
         .update({
           full_name: editForm.full_name,
           company_name: editForm.company_name,
           industry: editForm.industry,
         })
         .eq('user_id', consumer.user_id);
 
       if (error) throw error;
       toast({ title: 'Profile updated' });
       onUpdate();
       setIsEditing(false);
     } catch (error: any) {
       toast({
         title: 'Failed to update profile',
         description: error.message,
         variant: 'destructive',
       });
     } finally {
       setSaving(false);
     }
   };
 
  if (!consumer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-semibold text-primary">
                {consumer.full_name?.charAt(0)?.toUpperCase() || consumer.email?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <SheetTitle className="text-xl">
                {consumer.full_name || 'No name'}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                {consumer.email}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5"
                  onClick={() => copyToClipboard(consumer.email || '')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </SheetDescription>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Badge variant={consumer.subscription_tier === 'founder' ? 'default' : 'secondary'}>
              {consumer.subscription_tier || 'free'}
            </Badge>
            {isCustomSolution && (
              <Badge variant="default">
                <Sparkles className="h-3 w-3 mr-1" />
                Custom Solution
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Separator />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Basic Info */}
              <Card>
                 <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile Information
                  </CardTitle>
                   {!isEditing ? (
                     <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                       <Edit className="h-3 w-3 mr-1" />
                       Edit
                     </Button>
                   ) : (
                     <div className="flex gap-1">
                       <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                         <X className="h-3 w-3" />
                       </Button>
                       <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                         {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                         Save
                       </Button>
                     </div>
                   )}
                </CardHeader>
                 <CardContent className="space-y-4">
                   {isEditing ? (
                     <div className="space-y-4">
                       <div className="space-y-2">
                         <Label htmlFor="full_name">Full Name</Label>
                         <Input
                           id="full_name"
                           value={editForm.full_name}
                           onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="company_name">Company</Label>
                         <Input
                           id="company_name"
                           value={editForm.company_name}
                           onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="industry">Industry</Label>
                         <Input
                           id="industry"
                           value={editForm.industry}
                           onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                         />
                       </div>
                    </div>
                   ) : (
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <p className="text-muted-foreground">Full Name</p>
                         <p className="font-medium">{consumer.full_name || 'Not set'}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Company</p>
                         <p className="font-medium">{consumer.company_name || 'Not set'}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Industry</p>
                         <p className="font-medium">{consumer.industry || 'Not set'}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Joined</p>
                         <p className="font-medium">{format(new Date(consumer.created_at), 'PPP')}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Credits</p>
                         <p className="font-medium">{consumer.credits_remaining || 0}</p>
                       </div>
                    </div>
                   )}
                </CardContent>
              </Card>

              {/* Custom Pricing */}
              {customPricing && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Custom Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Fixed Amount</p>
                        <p className="font-medium">${customPricing.fixed_amount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Amount</p>
                        <p className="font-medium">${customPricing.monthly_amount}/mo</p>
                      </div>
                    </div>
                    {customPricing.description && (
                      <p className="text-sm text-muted-foreground">{customPricing.description}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Custom Solution Toggle */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Custom Solution User</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable custom features and branding for this user
                      </p>
                    </div>
                    <Switch
                      checked={isCustomSolution}
                      onCheckedChange={handleToggleCustomSolution}
                      disabled={saving}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Enabled Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {AVAILABLE_FEATURES.map((feature) => (
                    <div key={feature.key} className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label className="font-medium">{feature.name}</Label>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <Switch
                        checked={enabledFeatures.includes(feature.key)}
                        onCheckedChange={(enabled) => handleFeatureToggle(feature.key, enabled)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Credit Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {creditUsage.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No credit usage recorded
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {creditUsage.map((usage) => (
                        <div key={usage.id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{usage.action_type}</p>
                            <p className="text-muted-foreground text-xs">
                              {format(new Date(usage.timestamp), 'PPp')}
                            </p>
                          </div>
                          <Badge variant="outline">-{usage.credits_used}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
