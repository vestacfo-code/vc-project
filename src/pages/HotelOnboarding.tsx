import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, ArrowLeft, Hotel, MapPin, Database } from 'lucide-react';

const TOTAL_STEPS = 3;

interface OnboardingFormData {
  // Step 1
  hotelName: string;
  propertyType: string;
  roomCount: string;
  // Step 2
  city: string;
  country: string;
  timezone: string;
  currency: string;
  // Step 3
  pmsProvider: string;
}

const PROPERTY_TYPES = [
  { value: 'independent', label: 'Independent' },
  { value: 'boutique', label: 'Boutique' },
  { value: 'chain_property', label: 'Chain Property' },
  { value: 'resort', label: 'Resort' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'serviced_apartment', label: 'Serviced Apartment' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (Paris)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard (Dubai)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard (Tokyo)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern (Sydney)' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
];

const PMS_PROVIDERS = [
  { value: 'mews', label: 'Mews' },
  { value: 'cloudbeds', label: 'Cloudbeds' },
  { value: 'opera', label: 'Oracle OPERA' },
  { value: 'apaleo', label: 'Apaleo' },
  { value: 'protel', label: 'Protel' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: "I don't use a PMS yet" },
];

const HotelOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<OnboardingFormData>({
    hotelName: '',
    propertyType: '',
    roomCount: '',
    city: '',
    country: '',
    timezone: '',
    currency: '',
    pmsProvider: '',
  });

  const set = (field: keyof OnboardingFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const canProceedStep1 = form.hotelName.trim() !== '' && form.propertyType !== '' && form.roomCount !== '';
  const canProceedStep2 = form.city.trim() !== '' && form.country.trim() !== '' && form.timezone !== '' && form.currency !== '';

  const handleComplete = async () => {
    if (!user) return;
    if (form.pmsProvider === '') {
      toast.error('Please select a PMS provider.');
      return;
    }
    setIsSubmitting(true);
    try {
      const orgId = localStorage.getItem('vesta_onboarding_org_id');

      const { data: hotelData, error: hotelError } = await supabase
        .from('hotels')
        .insert({
          organization_id: orgId ?? null,
          name: form.hotelName.trim(),
          property_type: form.propertyType,
          room_count: parseInt(form.roomCount, 10),
          city: form.city.trim(),
          country: form.country.trim(),
          timezone: form.timezone,
          currency: form.currency,
          pms_provider: form.pmsProvider,
        })
        .select('id')
        .single();

      if (hotelError) throw hotelError;

      const { error: memberError } = await supabase
        .from('hotel_members')
        .insert({
          hotel_id: hotelData.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
        });

      if (memberError) throw memberError;

      localStorage.removeItem('vesta_onboarding_org_id');
      localStorage.removeItem('vesta_pending_google_signup');

      toast.success('Hotel set up successfully! Welcome to Vesta.');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[HotelOnboarding] Error:', err);
      toast.error(err.message || 'Failed to save your hotel. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressValue = (step / TOTAL_STEPS) * 100;

  const stepIcons = [
    <Hotel key="hotel" className="w-5 h-5" />,
    <MapPin key="map" className="w-5 h-5" />,
    <Database key="db" className="w-5 h-5" />,
  ];

  const stepTitles = ['Property Basics', 'Location', 'PMS Integration'];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-sm font-medium">Step {step} of {TOTAL_STEPS}</span>
          <span className="text-gray-400 text-sm">{stepTitles[step - 1]}</span>
        </div>
        <Progress value={progressValue} className="h-1.5 bg-gray-800 [&>div]:bg-white" />
      </div>

      <Card className="w-full max-w-lg bg-gray-900 border border-gray-800 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-white">
              {stepIcons[step - 1]}
            </div>
            <CardTitle className="text-white text-xl">{stepTitles[step - 1]}</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            {step === 1 && "Tell us about your property."}
            {step === 2 && "Where is your hotel located?"}
            {step === 3 && "Connect your property management system."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Hotel Name *</label>
                <Input
                  placeholder="e.g. The Grand Meridian"
                  value={form.hotelName}
                  onChange={e => set('hotelName', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Property Type *</label>
                <Select value={form.propertyType} onValueChange={v => set('propertyType', v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-gray-600">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {PROPERTY_TYPES.map(pt => (
                      <SelectItem key={pt.value} value={pt.value} className="focus:bg-gray-700 focus:text-white">
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Number of Rooms *</label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 120"
                  value={form.roomCount}
                  onChange={e => set('roomCount', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-gray-600"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">City *</label>
                <Input
                  placeholder="e.g. Dubai"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Country *</label>
                <Input
                  placeholder="e.g. United Arab Emirates"
                  value={form.country}
                  onChange={e => set('country', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Timezone *</label>
                <Select value={form.timezone} onValueChange={v => set('timezone', v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-gray-600">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value} className="focus:bg-gray-700 focus:text-white">
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Currency *</label>
                <Select value={form.currency} onValueChange={v => set('currency', v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-gray-600">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value} className="focus:bg-gray-700 focus:text-white">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Property Management System *</label>
                <Select value={form.pmsProvider} onValueChange={v => set('pmsProvider', v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-gray-600">
                    <SelectValue placeholder="Select your PMS" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {PMS_PROVIDERS.map(p => (
                      <SelectItem key={p.value} value={p.value} className="focus:bg-gray-700 focus:text-white">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-gray-800/60 border border-gray-700 px-4 py-3">
                <p className="text-gray-400 text-sm">
                  Don't worry — you can connect your PMS later from Settings.
                </p>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(s => s - 1)}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                className="bg-white text-gray-900 hover:bg-gray-100 font-medium disabled:opacity-40"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting || form.pmsProvider === ''}
                className="bg-white text-gray-900 hover:bg-gray-100 font-medium disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-gray-600 text-xs">
        Vesta Hotel CFO &mdash; Secure setup
      </p>
    </div>
  );
};

export default HotelOnboarding;
