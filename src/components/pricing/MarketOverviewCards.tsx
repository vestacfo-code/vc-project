import { Card, CardContent } from '@/components/ui/card';
import { MarketOverview, MarketDataPoint } from '@/hooks/useMarketTrends';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface MarketOverviewCardsProps {
  overview: MarketOverview;
  marketData?: MarketDataPoint[];
}

export function MarketOverviewCards({ overview, marketData = [] }: MarketOverviewCardsProps) {
  const priceTrend = overview.priceMovement > 0 ? 'up' : overview.priceMovement < 0 ? 'down' : 'stable';

  // Derive sparkline data from real market data
  const avgPriceSparkline = marketData.map(d => ({ v: d.avgPrice }));

  // Build a simple "movement" sparkline — cumulative delta from first point
  const movementSparkline = marketData.length > 1
    ? marketData.map((d, i) => ({ v: i === 0 ? 0 : d.avgPrice - marketData[0].avgPrice }))
    : [];

  // For "most volatile" — reuse avg price sparkline (represents the brand's market)
  const volatilitySparkline = avgPriceSparkline;

  // For "suppliers tracked" — count unique suppliers per date point
  const supplierSparkline = marketData.map(d => {
    const supplierKeys = Object.keys(d).filter(k => k !== 'date' && k !== 'avgPrice');
    return { v: supplierKeys.length };
  });

  const cards = [
    {
      label: 'Avg Market Price',
      value: `$${overview.avgMarketPrice.toFixed(2)}`,
      sub: `${overview.productCount} products tracked`,
      change: null as string | null,
      changeColor: '',
      sparkColor: '#60a5fa',
      sparkData: avgPriceSparkline,
    },
    {
      label: 'Price Movement',
      value: `${overview.priceMovement > 0 ? '+' : ''}${overview.priceMovement}%`,
      sub: priceTrend === 'up' ? 'Prices rising' : priceTrend === 'down' ? 'Prices falling' : 'Stable',
      change: `${overview.priceMovement > 0 ? '↗' : overview.priceMovement < 0 ? '↘' : '→'} ${Math.abs(overview.priceMovement)}%`,
      changeColor: overview.priceMovement > 0 ? 'text-red-400' : overview.priceMovement < 0 ? 'text-emerald-400' : 'text-vesta-navy/65',
      sparkColor: overview.priceMovement > 0 ? '#f87171' : overview.priceMovement < 0 ? '#34d399' : '#71717a',
      sparkData: movementSparkline,
    },
    {
      label: 'Most Volatile',
      value: overview.mostVolatileBrand,
      sub: 'Highest price variation',
      change: null,
      changeColor: '',
      sparkColor: '#f59e0b',
      sparkData: volatilitySparkline,
    },
    {
      label: 'Suppliers Tracked',
      value: String(overview.supplierCount),
      sub: overview.dateRange.to ? `Latest: ${new Date(overview.dateRange.to).toLocaleDateString()}` : 'No data yet',
      change: null,
      changeColor: '',
      sparkColor: '#a78bfa',
      sparkData: supplierSparkline,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <Card className="overflow-hidden border border-vesta-navy/10 bg-white transition-all duration-200 hover:border-vesta-navy/15">
            <CardContent className="p-4 pb-0">
              <div className="flex items-start justify-between mb-1">
                <p className="text-xs text-vesta-navy/65 font-medium">{card.label}</p>
                {card.change && (
                  <span className={`text-xs font-semibold ${card.changeColor}`}>{card.change}</span>
                )}
              </div>
              <p className="text-xl font-bold text-vesta-navy">{card.value}</p>
              <p className="text-[11px] text-vesta-navy/80 mt-0.5">{card.sub}</p>
            </CardContent>
            {/* Sparkline at bottom — real data */}
            <div className="h-12 mt-2 relative">
              {card.sparkData.length > 1 ? (
                <>
                  <div className="absolute inset-x-0 h-px border-t border-dashed border-vesta-navy/50" style={{ top: '50%' }} />
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={card.sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={card.sparkColor} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={card.sparkColor} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={card.sparkColor}
                        strokeWidth={1.5}
                        fill={`url(#grad-${i})`}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-[10px] text-vesta-navy/80">No trend data</span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
