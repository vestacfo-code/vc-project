import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  label: string;
  value: string | number | null;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  sparklineData?: number[];
  accentColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  prefix = '',
  suffix = '',
  icon,
  loading = false,
  sparklineData,
  accentColor = '#1B3A5C',
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <Skeleton className="h-4 w-20 mb-4" />
        <Skeleton className="h-8 w-28 mb-3" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  const displayValue =
    value === null || value === undefined
      ? '—'
      : typeof value === 'number'
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : value;

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  const sparkPoints = sparklineData?.map((v) => ({ v })) ?? [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        {icon && (
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-bold tracking-tight" style={{ color: '#1B3A5C' }}>
          {prefix}{displayValue}{suffix}
        </p>
      </div>

      {/* Bottom row: change badge + sparkline */}
      <div className="flex items-end justify-between gap-2 mt-auto">
        {change !== undefined ? (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-600'
                : isNegative
                ? 'bg-red-50 text-red-500'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {isPositive ? '+' : ''}{change.toFixed(1)}%
            <span className="font-normal text-[10px] ml-0.5">vs yesterday</span>
          </div>
        ) : (
          <span />
        )}

        {/* Sparkline */}
        {sparkPoints.length > 1 && (
          <div className="w-20 h-9 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkPoints} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={accentColor}
                  strokeWidth={1.5}
                  fill={`url(#spark-${label})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
