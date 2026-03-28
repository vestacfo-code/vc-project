import React from 'react';
import { format, subDays } from 'date-fns';
import { Building2, BedDouble, TrendingUp, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHotelDashboard } from '@/hooks/useHotelDashboard';
import MetricCard from '@/components/hotel/MetricCard';
import DailyBriefingCard from '@/components/hotel/DailyBriefingCard';
import RevParChart from '@/components/hotel/RevParChart';
import AnomalyFeed from '@/components/hotel/AnomalyFeed';

// Fallback mock data shown when no real DB records exist yet
const MOCK_METRICS = {
  revpar: 127.50,
  revpar_change: +5.2,
  adr: 189.00,
  adr_change: +2.1,
  occupancy: 0.674,
  occupancy_change: +3.1,
  goppar: 89.30,
  goppar_change: -1.4,
};

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

  // Use real data if available, otherwise fall back to mock
  const hasRealData = todayMetrics !== null;

  const revpar = hasRealData ? (todayMetrics!.revpar ?? 0) : MOCK_METRICS.revpar;
  const revparChange = hasRealData
    ? calcChange(todayMetrics!.revpar, yesterdayMetrics?.revpar ?? null)
    : MOCK_METRICS.revpar_change;

  const adr = hasRealData ? (todayMetrics!.adr ?? 0) : MOCK_METRICS.adr;
  const adrChange = hasRealData
    ? calcChange(todayMetrics!.adr, yesterdayMetrics?.adr ?? null)
    : MOCK_METRICS.adr_change;

  const occupancy = hasRealData ? (todayMetrics!.occupancy_rate ?? 0) : MOCK_METRICS.occupancy;
  const occupancyChange = hasRealData
    ? calcChange(todayMetrics!.occupancy_rate, yesterdayMetrics?.occupancy_rate ?? null)
    : MOCK_METRICS.occupancy_change;

  const goppar = hasRealData ? (todayMetrics!.goppar ?? 0) : MOCK_METRICS.goppar;
  const gopparChange = hasRealData
    ? calcChange(todayMetrics!.goppar, yesterdayMetrics?.goppar ?? null)
    : MOCK_METRICS.goppar_change;

  const isMetricsLoading = hotelLoading || metricsLoading;

  const userName = user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.email?.split('@')[0]
    ?? 'there';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-indigo-400">
                {hotelLoading ? '...' : (hotel?.name ?? 'Your Hotel')}
              </h2>
              {hotel?.city && (
                <span className="text-sm text-gray-500">&mdash; {hotel.city}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
              {!hasRealData && !isMetricsLoading && (
                <span className="ml-2 text-xs text-gray-500 italic">(showing sample data)</span>
              )}
            </p>
          </div>
        </div>

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
            value={`${(occupancy * 100).toFixed(1)}`}
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

        {/* Row 2: Daily Briefing + Anomaly Feed */}
        {hotelId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <DailyBriefingCard hotelId={hotelId} />
            </div>
            <div className="lg:col-span-1">
              <AnomalyFeed hotelId={hotelId} />
            </div>
          </div>
        ) : !hotelLoading ? (
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-8 text-center">
            <Building2 className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No hotel linked to your account</p>
            <p className="text-sm text-gray-500 mt-1">
              Ask your administrator to add you to a hotel.
            </p>
          </div>
        ) : null}

        {/* Row 3: RevPAR + Occupancy Trend Chart */}
        {hotelId && (
          <RevParChart hotelId={hotelId} />
        )}

      </div>
    </div>
  );
};

export default Dashboard;
