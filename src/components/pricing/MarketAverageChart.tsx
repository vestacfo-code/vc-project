import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MarketDataPoint } from '@/hooks/useMarketTrends';
import { BarChart3 } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#14b8a6'];

interface MarketAverageChartProps {
  data: MarketDataPoint[];
  supplierNames: string[];
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="text-xs font-semibold text-zinc-500 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-zinc-700">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-zinc-900">${Number(entry.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export function MarketAverageChart({ data, supplierNames }: MarketAverageChartProps) {
  const [hiddenSuppliers, setHiddenSuppliers] = useState<Set<string>>(new Set());

  const toggleSupplier = (name: string) => {
    setHiddenSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 mb-4">
          <BarChart3 className="w-8 h-8 text-zinc-400" />
        </div>
        <p className="text-lg font-semibold text-zinc-700 mb-1">No market data yet</p>
        <p className="text-sm text-zinc-400">Import supplier price lists to see market trends</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-zinc-50/50 to-white rounded-xl border border-zinc-200 p-6">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="marketAvgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
            {supplierNames.map((name, i) => (
              <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }}
            onClick={(e: any) => {
              if (e.dataKey && e.dataKey !== 'avgPrice') toggleSupplier(e.dataKey);
            }}
          />

          {/* Market Average - always visible, bold */}
          <Area
            type="monotone"
            dataKey="avgPrice"
            name="Market Avg"
            stroke="#a78bfa"
            strokeWidth={2.5}
            strokeDasharray="6 3"
            fill="url(#marketAvgGrad)"
            dot={false}
            animationDuration={800}
          />

          {/* Individual supplier lines */}
          {supplierNames.map((name, i) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={1.5}
              fill={`url(#grad-${i})`}
              dot={false}
              hide={hiddenSuppliers.has(name)}
              animationDuration={1000 + i * 200}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
