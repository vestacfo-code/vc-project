import React from 'react';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart2 } from 'lucide-react';

interface RevenueByChannelChartProps {
  hotelId: string;
}

interface RevenueByChannelRow {
  id: string;
  hotel_id: string;
  date: string;
  channel: string;
  room_nights: number | null;
  bookings_count: number | null;
  revenue: number | null;
  commission_rate: number | null;
  commission_amount: number | null;
  net_revenue: number | null;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  [channel: string]: string | number;
}

const CHANNEL_COLORS: Record<string, string> = {
  direct: '#f59e0b',
  booking_com: '#3b82f6',
  expedia: '#8b5cf6',
  corporate: '#10b981',
  ota_other: '#6b7280',
};

const FALLBACK_COLOR = '#94a3b8';

function getChannelColor(channel: string): string {
  return CHANNEL_COLORS[channel] ?? FALLBACK_COLOR;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    direct: 'Direct',
    booking_com: 'Booking.com',
    expedia: 'Expedia',
    corporate: 'Corporate',
    ota_other: 'OTA Other',
  };
  return labels[channel] ?? channel.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string; name: string }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[160px] rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-slate-500">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="mb-1 flex items-center justify-between gap-4 text-sm last:mb-0">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600">{entry.name}</span>
          </div>
          <span className="font-semibold text-slate-900">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

const RevenueByChannelChart: React.FC<RevenueByChannelChartProps> = ({ hotelId }) => {
  const thirtyDaysAgo = format(subDays(new Date(), 29), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: rows, isLoading } = useQuery({
    queryKey: ['revenue_by_channel', hotelId, thirtyDaysAgo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_by_channel')
        .select('id, hotel_id, date, channel, room_nights, bookings_count, revenue, commission_rate, commission_amount, net_revenue')
        .eq('hotel_id', hotelId)
        .gte('date', thirtyDaysAgo)
        .lte('date', today)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as RevenueByChannelRow[];
    },
    enabled: !!hotelId,
  });

  // Derive unique channels from data (preserving insertion order)
  const channels: string[] = React.useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const row of rows) {
      if (!seen.has(row.channel)) {
        seen.add(row.channel);
        result.push(row.channel);
      }
    }
    return result;
  }, [rows]);

  // Group rows by date into chart data points
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (!rows || rows.length === 0) return [];

    const byDate = new Map<string, ChartDataPoint>();

    for (const row of rows) {
      if (!byDate.has(row.date)) {
        byDate.set(row.date, {
          date: row.date,
          displayDate: format(new Date(row.date + 'T00:00:00'), 'MMM d'),
        });
      }
      const point = byDate.get(row.date)!;
      point[row.channel] = (Number(point[row.channel] ?? 0)) + (row.net_revenue ?? 0);
    }

    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  const isEmpty = !isLoading && chartData.length === 0;

  return (
    <div className="rounded-xl border border-vesta-navy/10 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <BarChart2 className="h-4 w-4 shrink-0 text-vesta-gold" />
        <h3 className="text-base font-semibold text-slate-900">Revenue by Channel</h3>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="h-64 animate-pulse rounded-lg bg-slate-200" />
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
          <BarChart2 className="h-8 w-8 text-slate-600" />
          <p className="text-sm">No channel data yet</p>
        </div>
      )}

      {/* Chart */}
      {!isLoading && !isEmpty && (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              width={52}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(27, 58, 92, 0.06)' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '12px' }}
              formatter={(value: string) => (
                <span style={{ color: '#475569', fontSize: '12px' }}>
                  {formatChannelLabel(value)}
                </span>
              )}
            />
            {channels.map((channel) => (
              <Bar
                key={channel}
                dataKey={channel}
                name={formatChannelLabel(channel)}
                stackId="revenue"
                fill={getChannelColor(channel)}
                radius={channel === channels[channels.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={40}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RevenueByChannelChart;
