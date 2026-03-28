import React from 'react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';

interface RevPARTrendChartProps {
  data: Array<{ date: string; revpar: number; budgetRevpar?: number }>;
  title?: string;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
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
      className="rounded-xl shadow-lg px-4 py-3 flex flex-col gap-1.5 border"
      style={{
        backgroundColor: '#1B3A5C',
        borderColor: 'rgba(200,150,62,0.3)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <p
        className="text-xs font-semibold mb-1"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="inline-block w-2.5 h-0.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span
            className="text-xs font-semibold text-white"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            ${entry.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

const monoStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', 'Courier New', monospace",
  fontSize: 10,
  fill: 'rgba(27,58,92,0.55)',
};

export const RevPARTrendChart: React.FC<RevPARTrendChartProps> = ({
  data,
  title = 'RevPAR Trend',
}) => {
  const hasBudget = data.some((d) => d.budgetRevpar !== undefined);

  // Show ticks every ~5 data points
  const tickCount = Math.max(1, Math.floor(data.length / 5));
  const xTicks = data
    .filter((_, i) => i % tickCount === 0)
    .map((d) => d.date);

  return (
    <div
      className="rounded-2xl p-6 shadow-sm flex flex-col gap-4"
      style={{ backgroundColor: '#F7F4EE' }}
    >
      <div>
        <h3
          className="font-semibold"
          style={{ color: '#1B3A5C', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18 }}
        >
          {title}
        </h3>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'rgba(27,58,92,0.5)', fontFamily: "'DM Sans', sans-serif" }}
        >
          Revenue per available room over time
          {hasBudget ? ' vs. budget' : ''}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="revparGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C8963E" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#C8963E" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(27,58,92,0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tickFormatter={formatDate}
            tick={monoStyle}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            tick={monoStyle}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(27,58,92,0.65)',
              paddingTop: 8,
            }}
          />

          {/* Actual RevPAR area */}
          <Area
            type="monotone"
            dataKey="revpar"
            name="RevPAR"
            stroke="#C8963E"
            strokeWidth={2.5}
            fill="url(#revparGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#C8963E', strokeWidth: 0 }}
          />

          {/* Budget line (dashed navy) — only if data includes budget */}
          {hasBudget && (
            <Line
              type="monotone"
              dataKey="budgetRevpar"
              name="Budget"
              stroke="#1B3A5C"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 3, fill: '#1B3A5C', strokeWidth: 0 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
