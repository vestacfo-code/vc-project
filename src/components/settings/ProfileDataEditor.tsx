import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, Building2, Briefcase, Users, Target, FileText, ScrollText, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfileData {
  companyName: string;
  industry: string;
  companySize: string;
  businessType: string;
  description: string;
  termsAcceptedAt: string | null;
}

const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'retail-e-commerce', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'other', label: 'Other' },
];

const companySizes = [
  { value: '1', label: 'Just me (Solo entrepreneur)' },
  { value: '2-10', label: '2-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '200+', label: '200+ employees' },
];

const businessTypes = [
  { value: 'startup', label: 'Startup' },
  { value: 'small-business', label: 'Small Business' },
  { value: 'medium-business', label: 'Medium Business' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'freelancer-consultant', label: 'Freelancer/Consultant' },
  { value: 'non-profit', label: 'Non-profit' },
  { value: 'agency', label: 'Agency' },
  { value: 'e-commerce', label: 'E-commerce' },
];

export const ProfileDataEditor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [data, setData] = useState<ProfileData>({
    companyName: '',
    industry: '',
    companySize: '',
    businessType: '',
    description: '',
    termsAcceptedAt: null,
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_name, industry, company_size, business_type, description, terms_accepted_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile) {
        setData({
          companyName: profile.company_name || '',
          industry: profile.industry || '',
          companySize: profile.company_size || '',
          businessType: profile.business_type || '',
          description: profile.description || '',
          termsAcceptedAt: profile.terms_accepted_at || null,
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: data.companyName,
          industry: data.industry,
          company_size: data.companySize,
          business_type: data.businessType,
          description: data.description,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your business information has been saved.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Information Section */}
      <div className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white">Business Information</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm text-slate-300">Company Name</Label>
            <Input
              id="companyName"
              value={data.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              placeholder="Your company name"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Industry</Label>
              <Select value={data.industry} onValueChange={(value) => updateField('industry', value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value}>
                      {ind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Company Size</Label>
              <Select value={data.companySize} onValueChange={(value) => updateField('companySize', value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Business Type</Label>
            <Select value={data.businessType} onValueChange={(value) => updateField('businessType', value)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-slate-300">Business Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe what your business does..."
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[100px] resize-none"
            />
            <p className="text-xs text-slate-500">
              This helps our AI provide more relevant insights for your business.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white text-black hover:bg-slate-200"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Terms & Conditions Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white">Terms & Conditions</h3>
        </div>

        <div className="bg-white/5 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-white">Terms of Service</p>
              {data.termsAcceptedAt ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" />
                    Accepted
                  </Badge>
                  <span className="text-xs text-slate-500">
                    on {new Date(data.termsAcceptedAt).toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Not accepted
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTermsModal(true)}
              className="bg-white/5 text-white border-white/10 hover:bg-white/10"
            >
              <FileText className="w-4 h-4 mr-2" />
              Review Terms
            </Button>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsReviewModal 
        open={showTermsModal} 
        onOpenChange={setShowTermsModal} 
      />
    </div>
  );
};

interface TermsReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsReviewModal = ({ open, onOpenChange }: TermsReviewModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Terms of Service</DialogTitle>
          <DialogDescription>
            Review our Terms of Service agreement.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-96 w-full border rounded-md p-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. AI Financial Analysis Disclaimer</h3>
              <p>
                Finlo provides AI-powered financial analysis and insights for informational purposes only. 
                These analyses, predictions, and recommendations are not professional financial advice and 
                should not be considered as such.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. Accuracy Limitations</h3>
              <p>
                AI predictions and analyses may contain inaccuracies or errors. Results are based on the 
                data provided and AI algorithms, which may not capture all financial nuances or market 
                conditions. You acknowledge that:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>AI-generated insights may be incomplete or incorrect</li>
                <li>Financial predictions are estimates and not guarantees</li>
                <li>Market conditions and business circumstances can change rapidly</li>
                <li>Historical data does not guarantee future performance</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Professional Consultation Recommended</h3>
              <p className="mb-2">
                Finlo's analysis is designed to give you clear, data-driven insights into your business performance. While our reports can guide your decision-making, we recommend consulting with a qualified financial advisor, accountant, or other professional for major financial decisions, such as investments, loans, business expansion, or significant cost adjustments.
              </p>
              <p>
                Think of Finlo as your always-on financial analyst — providing you with the numbers, trends, and forecasts — so that any further expert advice you seek can be faster, more informed, and more cost-effective.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. User Responsibility</h3>
              <p>
                You are solely responsible for all financial decisions made using or based on information 
                from Finlo. By using our service, you acknowledge that you understand the limitations of 
                AI analysis and accept full responsibility for your business decisions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Data Privacy and Security</h3>
              <p>
                Your financial data is processed securely and used solely to provide analysis services. 
                We implement industry-standard security measures but cannot guarantee absolute security. 
                You are responsible for the accuracy of data you provide.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Limitation of Liability</h3>
              <p>
                Finlo and its affiliates shall not be liable for any direct, indirect, incidental, 
                special, or consequential damages resulting from the use of our AI analysis, including 
                but not limited to financial losses, business interruption, or missed opportunities.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">7. Service Availability</h3>
              <p>
                We strive to provide continuous service but cannot guarantee uninterrupted access. 
                AI analysis features may be updated, modified, or temporarily unavailable without notice.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">8. Changes to Terms</h3>
              <p>
                These terms may be updated periodically. Continued use of Finlo's financial features 
                constitutes acceptance of any changes.
              </p>
            </section>

            <div className="pt-4 border-t mt-6">
              <p className="text-xs text-muted-foreground italic">
                Last updated: February 2026
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDataEditor;
