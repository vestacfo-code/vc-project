import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BrandTrend } from '@/hooks/useMarketTrends';
import { cn } from '@/lib/utils';

interface BrandTrendGridProps {
  brands: BrandTrend[];
}

export function BrandTrendGrid({ brands }: BrandTrendGridProps) {
  if (brands.length === 0) {
    return (
      <div className="text-center py-8 text-vesta-navy-muted text-sm">
        No brand data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {brands.map((brand, i) => (
        <motion.div
          key={brand.brand}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className={cn(
            'bg-white rounded-xl border border-vesta-navy/10 p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-default border-l-[3px]',
            brand.trendDirection === 'up' && 'border-l-red-400',
            brand.trendDirection === 'down' && 'border-l-emerald-400',
            brand.trendDirection === 'stable' && 'border-l-vesta-mist',
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-vesta-navy truncate" title={brand.brand}>
              {brand.brand}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
              brand.trendDirection === 'up' && 'bg-red-100 text-red-700',
              brand.trendDirection === 'down' && 'bg-emerald-100 text-emerald-700',
              brand.trendDirection === 'stable' && 'bg-vesta-mist/40 text-vesta-navy/80',
            )}>
              {brand.trendDirection === 'up' && <TrendingUp className="w-3 h-3" />}
              {brand.trendDirection === 'down' && <TrendingDown className="w-3 h-3" />}
              {brand.trendDirection === 'stable' && <Minus className="w-3 h-3" />}
              {brand.trendPercent > 0 ? '+' : ''}{brand.trendPercent}%
            </span>
          </div>

          <div className="text-xl font-bold text-vesta-navy mb-1">
            ${brand.currentAvg.toFixed(2)}
          </div>
          <div className="text-xs text-vesta-navy-muted mb-3">
            {brand.productCount} product{brand.productCount !== 1 ? 's' : ''} • 3M: ${brand.avg3m.toFixed(2)} • 6M: ${brand.avg6m.toFixed(2)}
          </div>

          {/* Taller sparkline */}
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={brand.sparklineData}>
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={brand.trendDirection === 'up' ? '#ef4444' : brand.trendDirection === 'down' ? '#10b981' : '#71717a'}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
