import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMarketTrends, DateRange } from '@/hooks/useMarketTrends';
import { MarketOverviewCards } from './MarketOverviewCards';
import { MarketAverageChart } from './MarketAverageChart';
import { BrandTrendGrid } from './BrandTrendGrid';
import { SupplierComparisonTable } from './SupplierComparisonTable';
import { CardsSkeleton, ChartSkeleton, BrandGridSkeleton, TableRowsSkeleton, SectionHeader } from './PricingSkeleton';
import { cn } from '@/lib/utils';

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: 'All', value: 'ALL' },
];

export function MarketTrendDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('6M');
  const { marketAverageByDate, supplierNames, brandTrends, supplierSummaries, overview, isLoading } = useMarketTrends(dateRange);

  return (
    <div className="flex-1 p-6 pt-16 space-y-6 overflow-y-auto">
      {/* Header + Date Range as full-width segmented control */}
      <div>
        <h1 className="text-2xl font-semibold text-vesta-navy">Market Trends</h1>
        <p className="text-sm text-vesta-navy/65 mt-1">
          {overview.supplierCount} supplier{overview.supplierCount !== 1 ? 's' : ''} • {overview.productCount} products tracked
          {overview.dateRange.from && overview.dateRange.to && (
            <> • {new Date(overview.dateRange.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(overview.dateRange.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
          )}
        </p>

        {/* Full-width segmented control */}
        <div className="flex items-center gap-1 bg-white border border-vesta-navy/10 rounded-lg p-1 mt-4 w-fit">
          {DATE_RANGES.map((r) => (
            <Button
              key={r.value}
              variant="ghost"
              size="sm"
              onClick={() => setDateRange(r.value)}
              className={cn(
                'h-8 px-5 text-xs font-semibold rounded-md transition-all duration-200',
                dateRange === r.value
                  ? 'bg-vesta-gold/20 text-vesta-navy shadow-sm ring-1 ring-vesta-gold/35 hover:bg-vesta-gold/25'
                  : 'text-vesta-navy/65 hover:bg-vesta-mist/25 hover:text-vesta-navy/90'
              )}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      {isLoading ? <CardsSkeleton /> : <MarketOverviewCards overview={overview} marketData={marketAverageByDate} />}

      {/* Hero Chart */}
      <div>
        <SectionHeader title="Market Average Over Time" />
        <div className="mt-3">
          {isLoading ? <ChartSkeleton /> : (
            <MarketAverageChart data={marketAverageByDate} supplierNames={supplierNames} />
          )}
        </div>
      </div>

      {/* Brand Trends */}
      <div>
        <SectionHeader title="Brand Trends" badge={isLoading ? undefined : `${brandTrends.length} brands`} />
        <div className="mt-3">
          {isLoading ? <BrandGridSkeleton /> : <BrandTrendGrid brands={brandTrends} />}
        </div>
      </div>

      {/* Supplier Comparison */}
      <div>
        <SectionHeader title="Supplier Comparison" badge={isLoading ? undefined : `${supplierSummaries.length} suppliers`} />
        <div className="mt-3">
          {isLoading ? <TableRowsSkeleton /> : <SupplierComparisonTable suppliers={supplierSummaries} />}
        </div>
      </div>
    </div>
  );
}
