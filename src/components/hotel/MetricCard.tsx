import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { morphSpringSoft } from '@/lib/motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  prefix = '',
  suffix = '',
  icon,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24 mb-3 bg-slate-700" />
          <Skeleton className="h-8 w-32 mb-2 bg-slate-700" />
          <Skeleton className="h-4 w-16 bg-slate-700" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015 }}
      transition={morphSpringSoft}
      className="h-full"
    >
    <Card className="bg-slate-800/50 border border-slate-700 h-full transition-shadow duration-300 hover:shadow-[0_12px_40px_-12px_rgba(245,158,11,0.15)] hover:border-amber-500/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm text-slate-400 font-medium">{label}</p>
          {icon && (
            <span className="text-slate-500">{icon}</span>
          )}
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">
          {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}{suffix}
        </p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>
              {isPositive ? '+' : ''}{change.toFixed(1)}% vs yesterday
            </span>
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
};

export default MetricCard;
