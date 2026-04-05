import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface VarianceData {
  brand: string;
  variance: number;
  count: number;
}

interface PricingVarianceChartProps {
  data: VarianceData[];
}

export function PricingVarianceChart({ data }: PricingVarianceChartProps) {
  // Sort by absolute variance descending
  const sortedData = [...data]
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 8);

  const maxVariance = Math.max(...sortedData.map(d => Math.abs(d.variance)), 20);

  const getBarColor = (variance: number) => {
    if (variance < -2) return 'bg-emerald-500'; // Below market (competitive)
    if (variance > 2) return 'bg-rose-500'; // Above market (at risk)
    return 'bg-blue-500'; // At market
  };

  const getTextColor = (variance: number) => {
    if (variance < -2) return 'text-emerald-600';
    if (variance > 2) return 'text-rose-600';
    return 'text-blue-600';
  };

  if (data.length === 0) {
    return (
      <Card className="bg-white border border-vesta-navy/10 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-vesta-navy">Variance by Brand</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-vesta-navy/65">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No variance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-vesta-navy/10 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-vesta-navy">Variance by Brand</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {sortedData.map((item) => (
            <div key={item.brand} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-vesta-navy/90 truncate max-w-[120px]" title={item.brand}>
                  {item.brand}
                </span>
                <span className={`font-semibold ${getTextColor(item.variance)}`}>
                  {item.variance > 0 ? '+' : ''}{item.variance.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-2 bg-vesta-mist/40 rounded-full overflow-hidden">
                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-vesta-mist" />
                
                {/* Bar */}
                <div
                  className={`absolute top-0 h-full ${getBarColor(item.variance)} rounded-full transition-all duration-300`}
                  style={{
                    left: item.variance >= 0 ? '50%' : `${50 - (Math.abs(item.variance) / maxVariance) * 50}%`,
                    width: `${(Math.abs(item.variance) / maxVariance) * 50}%`,
                  }}
                />
              </div>
              <div className="text-xs text-vesta-navy-muted">
                {item.count} SKU{item.count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-vesta-navy/8">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-vesta-navy/65">Below Market</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-vesta-navy/65">At Market</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-xs text-vesta-navy/65">Above Market</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
