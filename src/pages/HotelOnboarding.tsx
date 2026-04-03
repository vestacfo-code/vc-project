import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, ArrowLeft, Hotel, MapPin, Database, Target } from 'lucide-react';
import { VestaLogo } from '@/components/VestaLogo';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 4;

/** Radix SelectItem defaults to `text-gray-900`; on dark popovers that reads as invisible. */
const DARK_SELECT_CONTENT =
  'z-[200] max-h-[min(22rem,70vh)] bg-slate-800 border border-slate-600 text-slate-100 shadow-2xl';
const DARK_SELECT_ITEM =
  'cursor-pointer py-2.5 pl-8 pr-3 text-slate-100 focus:bg-slate-600 focus:text-white data-[highlighted]:bg-slate-600 data-[highlighted]:text-white data-[state=checked]:bg-slate-700 data-[state=checked]:text-white';

interface OnboardingFormData {
  hotelName: string;
  propertyType: string;
  roomCount: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  timezone: string;
  currency: string;
  role: string;
  portfolioSize: string;
  primaryGoals: string[];
  dataApproach: string;
  pmsProvider: string;
  notes: string;
}

const PROPERTY_TYPES = [
  { value: 'independent', label: 'Independent' },
  { value: 'boutique', label: 'Boutique' },
  { value: 'chain', label: 'Chain / flagged' },
  { value: 'resort', label: 'Resort' },
  { value: 'extended_stay', label: 'Extended stay' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'serviced_apartment', label: 'Serviced apartments' },
] as const;

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (New York)' },
  { value: 'America/Chicago', label: 'Central (Chicago)' },
  { value: 'America/Denver', label: 'Mountain (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
  { value: 'America/Phoenix', label: 'Arizona (Phoenix)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central Europe (Paris)' },
  { value: 'Asia/Dubai', label: 'Gulf (Dubai)' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
] as const;

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
] as const;

const PMS_PROVIDERS = [
  { value: 'mews', label: 'Mews' },
  { value: 'cloudbeds', label: 'Cloudbeds' },
  { value: 'opera', label: 'Oracle OPERA' },
  { value: 'apaleo', label: 'Apaleo' },
  { value: 'protel', label: 'Protel' },
  { value: 'littlehotelier', label: 'Little Hotelier' },
  { value: 'other', label: 'Other PMS' },
  { value: 'none', label: 'Not connected yet — CSV / manual first' },
] as const;

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner / partner' },
  { value: 'gm', label: 'General manager' },
  { value: 'asset_manager', label: 'Asset / portfolio manager' },
  { value: 'finance', label: 'Finance / controller' },
  { value: 'revenue', label: 'Revenue manager' },
  { value: 'other', label: 'Other' },
] as const;

const PORTFOLIO_OPTIONS = [
  { value: '1', label: 'This property only' },
  { value: '2_5', label: '2–5 properties' },
  { value: '6_15', label: '6–15 properties' },
  { value: '16_plus', label: '16+ properties' },
] as const;

const GOAL_OPTIONS = [
  { id: 'daily_briefing', label: 'Daily AI briefings' },
  { id: 'anomalies', label: 'Anomaly & cost alerts' },
  { id: 'reporting', label: 'Owner / lender reporting' },
  { id: 'benchmarking', label: 'Benchmarking vs market' },
  { id: 'forecasting', label: 'Forecasting & scenarios' },
  { id: 'marketplace', label: 'Vendor / cost savings (marketplace)' },
] as const;

const DATA_APPROACH_OPTIONS = [
  { value: 'pms_live', label: 'Live PMS API / integration' },
  { value: 'pms_export', label: 'PMS exports (CSV / Excel)' },
  { value: 'accounting', label: 'Accounting system (QBO, Xero, …)' },
  { value: 'mixed', label: 'Mix of PMS + accounting + spreadsheets' },
  { value: 'not_sure', label: 'Not sure yet — need guidance' },
] as const;

const HotelOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<OnboardingFormData>({
    hotelName: '',
    propertyType: '',
    roomCount: '',
    addressLine: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    timezone: '',
    currency: '',
    role: '',
    portfolioSize: '',
    primaryGoals: [],
    dataApproach: '',
    pmsProvider: '',
    notes: '',
  });

  const set = <K extends keyof OnboardingFormData>(field: K, value: OnboardingFormData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleGoal = (id: string) => {
    setForm((prev) => ({
      ...prev,
      primaryGoals: prev.primaryGoals.includes(id)
        ? prev.primaryGoals.filter((g) => g !== id)
        : [...prev.primaryGoals, id],
    }));
  };

  const roomsNum = parseInt(form.roomCount, 10);
  const canProceedStep1 =
    form.hotelName.trim() !== '' && form.propertyType !== '' && !Number.isNaN(roomsNum) && roomsNum >= 1;
  const canProceedStep2 =
    form.city.trim() !== '' && form.country.trim() !== '' && form.timezone !== '' && form.currency !== '';
  const canProceedStep3 =
    form.role !== '' && form.portfolioSize !== '' && form.primaryGoals.length > 0 && form.dataApproach !== '';
  const canComplete = form.pmsProvider !== '';

  const handleComplete = async () => {
    if (!user) return;
    if (!canComplete) {
      toast.error('Please select how you use a PMS (or choose “not connected yet”).');
      return;
    }
    setIsSubmitting(true);
    try {
      let orgId = localStorage.getItem('vesta_onboarding_org_id');

      if (!orgId) {
        const emailDomain = (user.email ?? '').split('@')[1] ?? '';
        const orgName = emailDomain
          ? emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1) + ' Hotel Group'
          : 'My Hotel Group';
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({ name: orgName, owner_user_id: user.id, plan: 'starter' })
          .select('id')
          .single();
        if (orgError) throw orgError;
        orgId = orgData.id;
      }

      const onboarding_profile = {
        role: form.role,
        portfolio_size_bucket: form.portfolioSize,
        primary_goals: form.primaryGoals,
        data_approach: form.dataApproach,
        notes: form.notes.trim() || undefined,
        onboarding_version: 2,
        completed_at: new Date().toISOString(),
      };

      const pmsVal = form.pmsProvider === 'none' ? null : form.pmsProvider;

      const { data: hotelData, error: hotelError } = await supabase
        .from('hotels')
        .insert({
          organization_id: orgId,
          name: form.hotelName.trim(),
          property_type: form.propertyType,
          room_count: roomsNum,
          address: form.addressLine.trim() || null,
          city: form.city.trim(),
          state: form.state.trim() || null,
          zip: form.zip.trim() || null,
          country: form.country.trim(),
          timezone: form.timezone,
          currency: form.currency,
          pms_provider: pmsVal,
          onboarding_profile,
        })
        .select('id')
        .single();

      if (hotelError) throw hotelError;

      const { error: memberError } = await supabase.from('hotel_members').insert({
        hotel_id: hotelData.id,
        user_id: user.id,
        role: 'owner',
      });

      if (memberError) throw memberError;

      localStorage.removeItem('vesta_onboarding_org_id');
      localStorage.removeItem('vesta_pending_google_signup');

      toast.success('Property saved. Welcome to Vesta CFO.');
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('[HotelOnboarding] Error:', err);
      const message = err instanceof Error ? err.message : 'Failed to save your hotel. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressValue = (step / TOTAL_STEPS) * 100;

  const stepIcons = [
    <Hotel key="hotel" className="w-5 h-5" />,
    <MapPin key="map" className="w-5 h-5" />,
    <Target key="target" className="w-5 h-5" />,
    <Database key="db" className="w-5 h-5" />,
  ];

  const stepTitles = ['Property basics', 'Location', 'Goals & data', 'Systems & finish'];

  const stepBlocked =
    (step === 1 && !canProceedStep1) ||
    (step === 2 && !canProceedStep2) ||
    (step === 3 && !canProceedStep3) ||
    (step === 4 && !canComplete);

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg flex flex-col items-center mb-6">
        <VestaLogo size="md" />
      </div>

      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center justify-between mb-3 gap-4">
          <span className="text-slate-400 text-sm font-medium whitespace-nowrap">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-slate-300 text-sm font-medium text-right truncate">{stepTitles[step - 1]}</span>
        </div>
        <Progress value={progressValue} className="h-1 bg-slate-800 [&>div]:bg-amber-500" />
      </div>

      <Card className="w-full max-w-lg bg-slate-900 border border-slate-800 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              {stepIcons[step - 1]}
            </div>
            <CardTitle className="text-white text-xl">{stepTitles[step - 1]}</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            {step === 1 && 'Official name, type, and room count for this property.'}
            {step === 2 && 'Where you operate and how we should format numbers.'}
            {step === 3 && 'Helps us prioritize alerts, integrations, and your dashboard.'}
            {step === 4 && 'Primary PMS (if any). You can connect or import data next from Integrations.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Hotel name *</label>
                <Input
                  placeholder="e.g. The Grand Meridian"
                  value={form.hotelName}
                  onChange={(e) => set('hotelName', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Property type *</label>
                <Select value={form.propertyType} onValueChange={(v) => set('propertyType', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:ring-amber-500/40 [&>span]:text-white">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {PROPERTY_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value} className={DARK_SELECT_ITEM}>
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Number of keys / rooms *</label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 120"
                  value={form.roomCount}
                  onChange={(e) => set('roomCount', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/40"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Street address (optional)</label>
                <Input
                  placeholder="123 Ocean Drive"
                  value={form.addressLine}
                  onChange={(e) => set('addressLine', e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/40"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">City *</label>
                  <Input
                    placeholder="Dubai"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">State / region (optional)</label>
                  <Input
                    placeholder="Dubai"
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/40"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Postal code (optional)</label>
                  <Input
                    placeholder="00000"
                    value={form.zip}
                    onChange={(e) => set('zip', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Country *</label>
                  <Input
                    placeholder="United Arab Emirates"
                    value={form.country}
                    onChange={(e) => set('country', e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Timezone *</label>
                <Select value={form.timezone} onValueChange={(v) => set('timezone', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:ring-amber-500/40 [&>span]:text-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value} className={DARK_SELECT_ITEM}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Reporting currency *</label>
                <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:ring-amber-500/40 [&>span]:text-white">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className={DARK_SELECT_ITEM}>
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
                <label className="text-sm font-medium text-slate-200">Your role *</label>
                <Select value={form.role} onValueChange={(v) => set('role', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:ring-amber-500/40 [&>span]:text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value} className={DARK_SELECT_ITEM}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Portfolio size *</label>
                <Select value={form.portfolioSize} onValueChange={(v) => set('portfolioSize', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:ring-amber-500/40 [&>span]:text-white">
                    <SelectValue placeholder="How many properties do you oversee?" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {PORTFOLIO_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value} className={DARK_SELECT_ITEM}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Top priorities * (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((g) => {
                    const on = form.primaryGoals.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGoal(g.id)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-xs sm:text-sm font-medium transition-colors',
                          on
                            ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                            : 'border-slate-600 bg-slate-800/80 text-slate-300 hover:border-slate-500 hover:text-white'
                        )}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">How do you get financial / PMS data today? *</label>
                <Select value={form.dataApproach} onValueChange={(v) => set('dataApproach', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:ring-amber-500/40 [&>span]:text-white">
                    <SelectValue placeholder="Select the closest option" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {DATA_APPROACH_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value} className={DARK_SELECT_ITEM}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Primary PMS *</label>
                <Select value={form.pmsProvider} onValueChange={(v) => set('pmsProvider', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white focus:ring-amber-500/40 [&>span]:text-white">
                    <SelectValue placeholder="Select your system" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {PMS_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value} className={DARK_SELECT_ITEM}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Anything else we should know? (optional)</label>
                <Textarea
                  placeholder="e.g. We use a channel manager, fiscal year ends in March, multi-currency deposits…"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={4}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/40 resize-none"
                />
              </div>

              <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-4 py-3">
                <p className="text-slate-300 text-sm leading-relaxed">
                  After setup, open <span className="text-amber-400 font-medium">Integrations</span> to connect your PMS, upload
                  CSVs, or enter manual metrics. You can change PMS in Settings later.
                </p>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-2 gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
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
                onClick={() => setStep((s) => s + 1)}
                disabled={stepBlocked}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold disabled:opacity-40 shrink-0"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting || !canComplete}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold disabled:opacity-40 shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Complete setup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-slate-500 text-xs text-center max-w-md">
        Vesta CFO — encrypted setup. By continuing you confirm information is accurate for your property.
      </p>
    </div>
  );
};

export default HotelOnboarding;
