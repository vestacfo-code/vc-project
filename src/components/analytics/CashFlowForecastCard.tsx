import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CashFlowForecast } from '@/hooks/useQuickBooksAnalytics';
import { ChatIconButton } from './ChatIconButton';

interface CashFlowForecastCardProps {
  data: CashFlowForecast;
}

export const CashFlowForecastCard = ({ data }: CashFlowForecastCardProps) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const reference = {
    id: 'cash-flow-forecast',
    name: 'Cash Flow Forecast',
    type: 'Financial Metric',
    icon: 'dollar-sign',
    data: `Cash flow forecast: ${data.runway ? `${data.runway.toFixed(1)} months runway, ` : ''}Monthly burn: ${formatCurrency(data.monthlyBurn || 0)}, Current cash: ${formatCurrency(data.currentCash || 0)}.`
  };

  return (
    <Card className="bg-white border border-gray-200 group hover:shadow-md transition-all">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium text-gray-700">Cash Flow Forecast</CardTitle>
        <ChatIconButton reference={reference} />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Metrics */}
        {(data.monthlyBurn != null || data.currentCash != null) && (
          <div className="flex items-center justify-between">
            {data.currentCash != null && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Current Cash</p>
                <p className="text-2xl font-medium text-gray-900">{formatCurrency(data.currentCash)}</p>
              </div>
            )}
            {data.monthlyBurn != null && (
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Monthly Burn</p>
                <p className="text-2xl font-medium text-gray-900">{formatCurrency(data.monthlyBurn)}</p>
              </div>
            )}
          </div>
        )}

        {/* Runway */}
        {data.runway != null && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium text-gray-900">{data.runway.toFixed(1)}</span>
              <span className="text-sm text-gray-600">months runway</span>
            </div>
          </div>
        )}

        {/* Forecast Periods - Minimalist */}
        {data.forecast && data.forecast.length > 0 && (
          <div className="space-y-2 pt-2">
            {data.forecast.slice(0, 3).map((period) => (
              <div key={period.period} className="flex items-center justify-between text-xs py-1.5">
                <span className="text-gray-600 w-16">{period.period}</span>
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className="text-gray-400">In</span>
                  <span className="font-medium text-green-700 w-20 text-right">{formatCurrency(period.cashIn)}</span>
                  <span className="text-gray-400">Out</span>
                  <span className="font-medium text-red-700 w-20 text-right">{formatCurrency(period.cashOut)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Insight Only */}
        {data.insights && data.insights.length > 0 && data.insights[0].type !== 'info' && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-start gap-2">
              {data.insights[0].type === 'critical' ? (
                <TrendingDown className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              ) : (
                <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-xs text-gray-700 leading-relaxed">{data.insights[0].action}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
