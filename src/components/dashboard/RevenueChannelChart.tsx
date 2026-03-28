import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

interface RevenueChannelChartProps {
  data: Array<{
    channel: string;
    revenue: number;
    commission: number;
  }>;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-xl shadow-lg px-4 py-3 flex flex-col gap-1.5 text-sm border"
      style={{
        backgroundColor: '#1B3A5C',
        borderColor: 'rgba(200,150,62,0.3)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span
            className="font-semibold"
            style={{ color: '#fff', fontFamily: "'DM Mono', monospace" }}
          >
            ${entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

const monoStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', 'Courier New', monospace",
  fontSize: 11,
  fill: 'rgba(27,58,92,0.65)',
};

export const RevenueChannelChart: React.FC<RevenueChannelChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    channel: d.channel,
    Revenue: d.revenue,
    'Net Revenue': d.revenue - d.commission,
  }));

  return (
    <div
      className="rounded-2xl p-6 shadow-sm flex flex-col gap-4"
      style={{ backgroundColor: '#F7F4EE' }}
    >
      <div>
        <h3
          className="text-base font-semibold"
          style={{ color: '#1B3A5C', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18 }}
        >
          Revenue by Channel
        </h3>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'rgba(27,58,92,0.5)', fontFamily: "'DM Sans', sans-serif" }}
        >
          Gross vs. net after commissions
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
          barGap={4}
          barCategoryGap="28%"
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 3"
            stroke="rgba(27,58,92,0.1)"
          />
          <XAxis
            type="number"
            tick={monoStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="channel"
            tick={{ ...monoStyle, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(27,58,92,0.05)' }} />
          <Legend
            wrapperStyle={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(27,58,92,0.65)',
              paddingTop: 8,
            }}
          />
          <Bar dataKey="Revenue" fill="#1B3A5C" radius={[0, 4, 4, 0]}>
            {chartData.map((_, idx) => (
              <Cell key={`revenue-${idx}`} fill="#1B3A5C" />
            ))}
          </Bar>
          <Bar dataKey="Net Revenue" fill="#C8963E" radius={[0, 4, 4, 0]}>
            {chartData.map((_, idx) => (
              <Cell key={`net-${idx}`} fill="#C8963E" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
