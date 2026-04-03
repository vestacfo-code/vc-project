import React from 'react';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Building2,
  BedDouble,
  TrendingUp,
  DollarSign,
  UploadCloud,
  Plug,
  Target,
  AlertTriangle,
  FileText,
  Users,
  MessageCircle,
  Handshake,
  Settings,
  ChevronRight,
  Globe2,
  Clock3,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHotelDashboard } from '@/hooks/useHotelDashboard';
import MetricCard from '@/components/hotel/MetricCard';
import DailyBriefingCard from '@/components/hotel/DailyBriefingCard';
import RevParChart from '@/components/hotel/RevParChart';
import RevenueByChannelChart from '@/components/hotel/RevenueByChannelChart';
import AnomalyFeed from '@/components/hotel/AnomalyFeed';
import BudgetVarianceCard from '@/components/hotel/BudgetVarianceCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DailyMetricRow {
  date: string;
  revpar: number | null;
  adr: number | null;
  occupancy_rate: number | null;
  goppar: number | null;
}

function calcChange(current: number | null, previous: number | null): number | undefined {
  if (current == null || previous == null || previous === 0) return undefined;
  return ((current - previous) / Math.abs(previous)) * 100;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const PMS_LABELS: Record<string, string> = {
  mews: 'Mews',
  cloudbeds: 'Cloudbeds',
  opera: 'Oracle OPERA',
  apaleo: 'Apaleo',
  protel: 'Protel',
  littlehotelier: 'Little Hotelier',
  other: 'Other PMS',
};

function formatPropertyType(raw: string | null): string | null {
  if (!raw) return null;
  const map: Record<string, string> = {
    independent: 'Independent',
    boutique: 'Boutique',
    chain: 'Chain / flagged',
    resort: 'Resort',
    extended_stay: 'Extended stay',
    hostel: 'Hostel',
    serviced_apartment: 'Serviced apartments',
  };
  return map[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const QUICK_ACTIONS = [
  { to: '/integrations', label: 'Integrations', hint: 'PMS & data sources', icon: Plug },
  { to: '/budget', label: 'Budget', hint: 'Targets & variance', icon: Target },
  { to: '/anomalies', label: 'Anomalies', hint: 'Cost & revenue alerts', icon: AlertTriangle },
  { to: '/reports', label: 'Reports', hint: 'Exports & summaries', icon: FileText },
  { to: '/team', label: 'Team', hint: 'Members & access', icon: Users },
  { to: '/chat', label: 'Assistant', hint: 'Ask your AI CFO', icon: MessageCircle },
  { to: '/marketplace', label: 'Partners', hint: 'Marketplace & savings', icon: Handshake },
  { to: '/settings', label: 'Settings', hint: 'Property & profile', icon: Settings },
] as const;

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8963E]/85 font-semibold">{kicker}</p>
      <h2 className="text-lg font-semibold text-white mt-1 tracking-tight">{title}</h2>
    </div>
  );
}

function PropertySnapshot({
  hotel,
  loading,
}: {
  hotel: {
    room_count: number | null;
    currency: string | null;
    timezone: string | null;
    pms_provider: string | null;
    property_type: string | null;
    country: string | null;
  } | null;
  loading: boolean;
}) {
  const pmsLabel = hotel?.pms_provider
    ? PMS_LABELS[hotel.pms_provider] ?? hotel.pms_provider
    : null;
  const propType = formatPropertyType(hotel?.property_type ?? null);

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border border-slate-700/80 h-full min-h-[200px] animate-pulse">
        <CardContent className="p-5 h-full" />
      </Card>
    );
  }

  const rows: { icon: React.ReactNode; label: string; value: string }[] = [
    {
      icon: <BedDouble className="h-4 w-4 text-[#C8963E]/90" />,
      label: 'Keys / rooms',
      value: hotel?.room_count != null ? String(hotel.room_count) : '—',
    },
    {
      icon: <DollarSign className="h-4 w-4 text-[#C8963E]/90" />,
      label: 'Currency',
      value: hotel?.currency ?? '—',
    },
    {
      icon: <Clock3 className="h-4 w-4 text-[#C8963E]/90" />,
      label: 'Timezone',
      value: hotel?.timezone?.replace(/_/g, ' ') ?? '—',
    },
    {
      icon: <Plug className="h-4 w-4 text-[#C8963E]/90" />,
      label: 'PMS',
      value: pmsLabel ?? 'Not connected',
    },
  ];

  if (propType) {
    rows.push({
      icon: <Building2 className="h-4 w-4 text-[#C8963E]/90" />,
      label: 'Type',
      value: propType,
    });
  }

  return (
    <Card className="bg-slate-900/50 border border-slate-700/80 backdrop-blur-sm h-full shadow-lg shadow-black/20">
      <CardContent className="p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8963E]/85 font-semibold mb-4">Property</p>
        <ul className="space-y-3.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0">{r.icon}</span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{r.label}</p>
                <p className="text-sm font-medium text-slate-100 truncate">{r.value}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link
          to="/settings"
          className="mt-5 flex items-center justify-center gap-1 text-xs font-medium text-[#C8963E] hover:text-[#E8C77B] transition-colors"
        >
          Edit in settings
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

const NoDataBanner = () => {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-dashed border-[#C8963E]/35 bg-gradient-to-r from-[#C8963E]/[0.07] to-transparent px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#C8963E]/15 p-2 ring-1 ring-[#C8963E]/25">
          <UploadCloud className="h-5 w-5 text-[#E8C77B]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#E8C77B]">No KPI data for today yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Connect a PMS or upload sample CSVs so RevPAR, ADR, and occupancy populate automatically.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate('/integrations')}
        className="border-[#C8963E]/40 text-[#E8C77B] hover:bg-[#C8963E]/10 hover:border-[#C8963E]/55 shrink-0"
      >
        Open integrations
      </Button>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { hotelId, hotel, loading: hotelLoading } = useHotelDashboard();

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['kpi_metrics', hotelId, today, yesterday],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_metrics')
        .select('date, revpar, adr, occupancy_rate, goppar')
        .eq('hotel_id', hotelId!)
        .in('date', [today, yesterday])
        .order('date', { ascending: false });

      if (error) throw error;
      return data as DailyMetricRow[];
    },
    enabled: !!hotelId,
  });

  const todayMetrics = metricsData?.find((r) => r.date === today) ?? null;
  const yesterdayMetrics = metricsData?.find((r) => r.date === yesterday) ?? null;
  const hasRealData = todayMetrics !== null;

  const revpar = todayMetrics?.revpar ?? null;
  const revparChange = calcChange(todayMetrics?.revpar ?? null, yesterdayMetrics?.revpar ?? null);

  const adr = todayMetrics?.adr ?? null;
  const adrChange = calcChange(todayMetrics?.adr ?? null, yesterdayMetrics?.adr ?? null);

  const occupancy = todayMetrics?.occupancy_rate ?? null;
  const occupancyChange = calcChange(todayMetrics?.occupancy_rate ?? null, yesterdayMetrics?.occupancy_rate ?? null);

  const goppar = todayMetrics?.goppar ?? null;
  const gopparChange = calcChange(todayMetrics?.goppar ?? null, yesterdayMetrics?.goppar ?? null);

  const isMetricsLoading = hotelLoading || metricsLoading;

  const userName = user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.email?.split('@')[0]
    ?? 'there';

  const locationLine = [hotel?.city, hotel?.country].filter(Boolean).join(', ');

  return (
    <div className="min-h-full text-white relative">
      {/* Brand-aligned backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(27, 58, 92, 0.45), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(200, 150, 62, 0.08), transparent)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-24 lg:pb-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-700/70 bg-gradient-to-br from-[#1B3A5C]/35 via-slate-900/75 to-slate-950/90 p-6 sm:p-8 shadow-xl shadow-black/30">
          <div
            className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-[#C8963E]/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {getGreeting()}, {userName}
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Building2 className="h-5 w-5 text-[#C8963E] shrink-0" />
                <span className="text-lg font-semibold text-white">
                  {hotelLoading ? 'Loading property…' : (hotel?.name ?? 'Your hotel')}
                </span>
              </div>
              {locationLine ? (
                <p className="text-sm text-slate-400 flex items-center gap-1.5">
                  <Globe2 className="h-3.5 w-3.5 text-slate-500" />
                  {locationLine}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Quick links — every major app area */}
        <section>
          <SectionHeading kicker="Navigate" title="Hotel workspace" />
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ to, label, hint, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'group relative flex flex-col rounded-xl border border-slate-700/70 bg-slate-900/45 p-4 transition-all duration-200',
                  'hover:border-[#C8963E]/35 hover:bg-slate-900/75 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C8963E]/12 ring-1 ring-[#C8963E]/20 text-[#E8C77B]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-[#C8963E] transition-colors shrink-0 mt-1" />
                </div>
                <span className="text-sm font-semibold text-white">{label}</span>
                <span className="text-xs text-slate-500 mt-0.5 leading-snug">{hint}</span>
              </Link>
            ))}
          </div>
        </section>

        {!isMetricsLoading && hotelId && !hasRealData && <NoDataBanner />}

        {/* KPIs */}
        <section>
          <SectionHeading kicker="Performance" title="Today at a glance" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="RevPAR"
              value={revpar}
              change={revparChange}
              prefix="$"
              icon={<TrendingUp className="h-4 w-4" />}
              loading={isMetricsLoading}
            />
            <MetricCard
              label="ADR"
              value={adr}
              change={adrChange}
              prefix="$"
              icon={<DollarSign className="h-4 w-4" />}
              loading={isMetricsLoading}
            />
            <MetricCard
              label="Occupancy"
              value={occupancy !== null ? `${(occupancy * 100).toFixed(1)}` : null}
              change={occupancyChange}
              suffix="%"
              icon={<BedDouble className="h-4 w-4" />}
              loading={isMetricsLoading}
            />
            <MetricCard
              label="GOPPAR"
              value={goppar}
              change={gopparChange}
              prefix="$"
              icon={<TrendingUp className="h-4 w-4" />}
              loading={isMetricsLoading}
            />
          </div>
        </section>

        {/* Briefing + property snapshot */}
        {hotelId ? (
          <section>
            <SectionHeading kicker="Intelligence" title="Briefing & property context" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <DailyBriefingCard hotelId={hotelId} />
              </div>
              <div className="lg:col-span-1">
                <PropertySnapshot hotel={hotel} loading={hotelLoading} />
              </div>
            </div>
          </section>
        ) : !hotelLoading ? (
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/40 p-10 text-center">
            <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-200 font-semibold text-lg">No hotel linked yet</p>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Finish onboarding to attach a property. You will then see KPIs, briefings, and charts here.
            </p>
            <Button
              asChild
              className="mt-6 bg-[#C8963E] hover:bg-[#b88735] text-slate-950 font-semibold"
            >
              <Link to="/onboarding">Start onboarding</Link>
            </Button>
          </div>
        ) : null}

        {hotelId && (
          <section>
            <SectionHeading kicker="Alerts" title="Anomalies & budget" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnomalyFeed hotelId={hotelId} />
              <BudgetVarianceCard hotelId={hotelId} />
            </div>
          </section>
        )}

        {hotelId && (
          <section className="space-y-8">
            <div>
              <SectionHeading kicker="Trends" title="RevPAR & occupancy" />
              <RevParChart hotelId={hotelId} />
            </div>
            <div>
              <SectionHeading kicker="Channels" title="Revenue mix" />
              <RevenueByChannelChart hotelId={hotelId} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
