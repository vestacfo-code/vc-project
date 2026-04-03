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
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="text-white font-semibold">
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
    <Card className="bg-slate-900/50 border border-slate-700/80 backdrop-blur-sm shadow-lg shadow-black/15">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-white">
          30-Day RevPAR &amp; Occupancy Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-64 w-full bg-slate-700 rounded-lg" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <p className="text-sm">No data available for the last 30 days</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="displayDate"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                axisLine={{ stroke: '#4B5563' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="revpar"
                orientation="left"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                axisLine={{ stroke: '#4B5563' }}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis
                yAxisId="occupancy"
                orientation="right"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                axisLine={{ stroke: '#4B5563' }}
                tickLine={false}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                domain={[0, 1]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '12px' }}
                formatter={(value) => (
                  <span style={{ color: '#D1D5DB', fontSize: '12px' }}>{value}</span>
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
