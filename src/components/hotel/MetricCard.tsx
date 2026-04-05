import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { morphSpringSoft } from '@/lib/motion';
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
      <Card className="border border-vesta-navy/10 bg-white shadow-sm">
        <CardContent className="p-5">
          <Skeleton className="mb-3 h-4 w-24 bg-vesta-mist/50" />
          <Skeleton className="mb-2 h-8 w-32 bg-vesta-mist/50" />
          <Skeleton className="h-4 w-16 bg-vesta-mist/50" />
        </CardContent>
      </Card>
    );
  }

  const displayValue =
    value === null || value === undefined || value === ''
      ? '—'
      : typeof value === 'number'
        ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : value;

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  const sparkPoints = sparklineData?.map((v) => ({ v })) ?? [];

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015 }}
      transition={morphSpringSoft}
      className="h-full"
    >
    <Card className="h-full border border-vesta-navy/10 bg-white shadow-sm transition-all duration-300 hover:border-vesta-gold/35 hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-2 flex items-start justify-between">
          <p className="text-sm font-medium text-vesta-navy/80">{label}</p>
          {icon && (
            <span className="text-vesta-gold">{icon}</span>
          )}
        </div>
        <p className="text-2xl font-bold tracking-tight text-vesta-navy">
          {displayValue === '—' ? '—' : `${prefix}${displayValue}${suffix}`}
        </p>

      {/* Bottom row: change badge + sparkline */}
      <div className="flex items-end justify-between gap-2 mt-auto">
        {change !== undefined ? (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-600'
                : isNegative
                ? 'bg-red-50 text-red-500'
                : 'bg-vesta-mist/40 text-vesta-navy/65'
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
      </CardContent>
    </Card>
    </motion.div>
  );
};

export default MetricCard;
