import React from 'react';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface RevParChartProps {
  hotelId: string;
}

interface DailyMetric {
  date: string;
  revpar: number | null;
  occupancy_rate: number | null;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  revpar: number;
  occupancy: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-vesta-navy/10 bg-white p-3 shadow-lg">
        <p className="mb-2 text-xs text-vesta-navy/65">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-vesta-navy/80">{entry.name}:</span>
            <span className="font-semibold text-vesta-navy">
              {entry.dataKey === 'revpar'
                ? `$${Number(entry.value).toFixed(2)}`
                : `${(Number(entry.value) * 100).toFixed(1)}%`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RevParChart: React.FC<RevParChartProps> = ({ hotelId }) => {
  const thirtyDaysAgo = format(subDays(new Date(), 29), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['daily_metrics_chart', hotelId, thirtyDaysAgo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_metrics')
        .select('date, revpar, occupancy_rate')
        .eq('hotel_id', hotelId)
        .gte('date', thirtyDaysAgo)
        .lte('date', today)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as DailyMetric[];
    },
    enabled: !!hotelId,
  });

  const chartData: ChartDataPoint[] = (metrics ?? []).map((m) => ({
    date: m.date,
    displayDate: format(new Date(m.date + 'T00:00:00'), 'MMM d'),
    revpar: m.revpar ?? 0,
    occupancy: m.occupancy_rate ?? 0,
  }));

  return (
    <Card className="border border-vesta-navy/10 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-vesta-navy">
          30-Day RevPAR &amp; Occupancy Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-64 w-full rounded-lg bg-vesta-mist/50" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-vesta-navy/65">
            <p className="text-sm">No data available for the last 30 days</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="displayDate"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="revpar"
                orientation="left"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis
                yAxisId="occupancy"
                orientation="right"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                domain={[0, 1]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '12px' }}
                formatter={(value) => (
                  <span style={{ color: '#475569', fontSize: '12px' }}>{value}</span>
                )}
              />
              <Line
                yAxisId="revpar"
                type="monotone"
                dataKey="revpar"
                name="RevPAR"
                stroke="#6366F1"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, fill: '#6366F1' }}
              />
              <Line
                yAxisId="occupancy"
                type="monotone"
                dataKey="occupancy"
                name="Occupancy"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default RevParChart;
