import React from 'react';
import { format, subDays } from 'date-fns';
import { Building2, BedDouble, TrendingUp, DollarSign, UploadCloud } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';

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

const NoDataBanner = () => {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <UploadCloud className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-300">No data yet for today</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect a PMS to sync automatically, or use the sample CSVs to get started.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate('/integrations')}
        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 shrink-0"
      >
        Connect Integration
      </Button>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { hotelId, hotel, loading: hotelLoading } = useHotelDashboard();

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Fetch today and yesterday's metrics to compute change %
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-amber-400">
                {hotelLoading ? '...' : (hotel?.name ?? 'Your Hotel')}
              </h2>
              {hotel?.city && (
                <span className="text-sm text-slate-500">&mdash; {hotel.city}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* No data banner */}
        {!isMetricsLoading && hotelId && !hasRealData && <NoDataBanner />}

        {/* Row 1: KPI Metric Cards */}
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

        {/* Row 2: Daily Briefing */}
        {hotelId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <DailyBriefingCard hotelId={hotelId} />
            </div>
          </div>
        ) : !hotelLoading ? (
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-8 text-center">
            <Building2 className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No hotel linked to your account</p>
            <p className="text-sm text-gray-500 mt-1">Complete onboarding to set up your hotel.</p>
          </div>
        ) : null}

        {/* Row 3: Anomaly Feed + Budget vs Actual */}
        {hotelId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnomalyFeed hotelId={hotelId} />
            <BudgetVarianceCard hotelId={hotelId} />
          </div>
        )}

        {/* Row 4: RevPAR + Occupancy Trend Chart */}
        {hotelId && (
          <RevParChart hotelId={hotelId} />
        )}

        {/* Row 5: Revenue by Channel */}
        {hotelId && <RevenueByChannelChart hotelId={hotelId} />}

      </div>
    </div>
  );
};

export default Dashboard;
