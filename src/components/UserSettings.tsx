import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, User, Building2, Save, Loader2, CreditCard, Calendar, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserProfile {
  full_name: string;
  email: string;
  company_name: string;
  industry: string;
  company_size: string;
  business_type: string;
  description: string;
  avatar_url: string;
}

interface UserSettingsProps {
  onViewTerms?: () => void;
}

const UserSettings = ({ onViewTerms }: UserSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    subscription_tier?: string;
    subscription_end?: string;
  }>({ subscribed: false });
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    email: '',
    company_name: '',
    industry: '',
    company_size: '',
    business_type: '',
    description: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

const handleManageSubscription = async () => {
  if (!user) return;
  // Redirect to plan selection page with manage flag so subscribed users can access it
  navigate('/payment-selection?manage=true');
};

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          company_name: (data as any).company_name || '',
          industry: (data as any).industry || '',
          company_size: (data as any).company_size || '',
          business_type: (data as any).business_type || '',
          description: (data as any).description || '',
          avatar_url: data.avatar_url || '',
        });
      } else {
        setProfile(prev => ({ ...prev, email: user.email || '', avatar_url: '' }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: "Failed to load your profile information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setAvatarFile(null);

      toast({
        title: "Avatar uploaded",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      // Determine if a profile exists, then update or insert accordingly (avoids upsert constraint/typing issues)
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchErr && (fetchErr as any).code !== 'PGRST116') throw fetchErr;

      let error = null as any;

      if (existing) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            full_name: profile.full_name,
            email: profile.email,
            company_name: profile.company_name,
            industry: profile.industry,
            company_size: profile.company_size,
            business_type: profile.business_type,
            description: profile.description,
          })
          .eq('user_id', user.id);
        error = updateErr;
      } else {
        // Use upsert with user_id conflict to handle race conditions with auth trigger
        const { error: insertErr } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            full_name: profile.full_name,
            email: profile.email,
            company_name: profile.company_name,
            industry: profile.industry,
            company_size: profile.company_size,
            business_type: profile.business_type,
            description: profile.description,
          } as any, {
            onConflict: 'user_id'
          });
        error = insertErr;
      }

      if (error) throw error;

      // Update auth user metadata so the dashboard greeting reflects the new name
      try {
        await supabase.auth.updateUser({ data: { full_name: profile.full_name } });
      } catch (e) {
        console.warn('Auth metadata update failed (non-blocking):', e);
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully. AI analysis will now be personalized to your business.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save failed",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-primary" />
            <CardTitle>Subscription & Billing</CardTitle>
          </div>
          <CardDescription>
            Manage your subscription, billing, and payment details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Current Plan</h4>
                    <Badge variant="default">
                      {subscription.subscription_tier}
                    </Badge>
                  </div>
                  {subscription.subscription_end && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Renews on {new Date(subscription.subscription_end).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {subscription.subscription_tier !== 'The Founder' && (
                    <Button 
                      onClick={() => navigate('/payment-selection?manage=true')}
                      variant="outline"
                    >
                      Upgrade Plan
                    </Button>
                  )}
                  <Button 
                    onClick={() => window.open(import.meta.env.VITE_STRIPE_PORTAL_URL ?? 'https://billing.stripe.com', '_blank')}
                    variant="outline"
                  >
                    Manage Billing
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {subscription.subscription_tier === 'The Founder' 
                  ? 'You\'re on the free Founder tier. You can upgrade anytime to unlock more features and credits.'
                  : 'Click "Manage Billing" to update payment methods, view invoices, or cancel your subscription. Click "Upgrade Plan" to see available upgrades. For support, contact vestacfo@gmail.com'
                }
              </div>
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed rounded-lg">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">No Active Subscription</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a plan to unlock AI-powered financial insights and advanced features
              </p>
              <Button onClick={() => navigate('/payment-selection')}>
                View Pricing Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="w-6 h-6 text-primary" />
            <CardTitle>Personal Information</CardTitle>
          </div>
          <CardDescription>
            Update your personal details for a personalized experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="text-2xl">
                {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex gap-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  disabled={uploading}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarFile(file);
                    handleAvatarUpload(file);
                  }
                }}
              />
              {profile.avatar_url && !profile.avatar_url.includes('googleusercontent.com') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await supabase
                        .from('profiles')
                        .update({ avatar_url: null })
                        .eq('user_id', user?.id);
                      setProfile(prev => ({ ...prev, avatar_url: '' }));
                      toast({ title: "Avatar removed" });
                    } catch (error) {
                      toast({ title: "Failed to remove avatar", variant: "destructive" });
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {profile.avatar_url?.includes('googleusercontent.com') && (
              <p className="text-xs text-muted-foreground mt-2">
                Using Google profile picture
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-primary" />
            <CardTitle>Business Information</CardTitle>
          </div>
          <CardDescription>
            Tell us about your business so AI can provide more relevant insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={profile.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Your company name"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={profile.industry}
                onValueChange={(value) => handleInputChange('industry', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size">Company Size</Label>
              <Select
                value={profile.company_size}
                onValueChange={(value) => handleInputChange('company_size', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-1000">201-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_type">Business Type</Label>
            <Select
              value={profile.business_type}
              onValueChange={(value) => handleInputChange('business_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="small-business">Small Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="non-profit">Non-Profit</SelectItem>
                <SelectItem value="freelancer">Freelancer/Consultant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              value={profile.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your business, goals, and challenges..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-primary" />
            <CardTitle>AI Personalization</CardTitle>
          </div>
          <CardDescription>
            Help our AI understand your business better for more accurate insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">How this helps:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• AI will provide industry-specific recommendations</li>
              <li>• Business size affects scaling advice and benchmarks</li>
              <li>• Your description helps contextualize financial patterns</li>
              <li>• More accurate risk assessments and growth projections</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Terms of Service Section */}
      <Card>
        <CardHeader>
          <CardTitle>Legal & Terms</CardTitle>
          <CardDescription>
            Review our Terms of Service and privacy information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Terms of Service</h4>
              <p className="text-sm text-muted-foreground">
                Review our financial disclaimer and usage terms
              </p>
            </div>
            <Button variant="outline" onClick={onViewTerms}>
              View Terms
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UserSettings;