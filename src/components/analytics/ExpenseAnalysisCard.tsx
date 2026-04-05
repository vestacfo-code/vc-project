import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { ExpenseAnalysis } from '@/hooks/useQuickBooksAnalytics';
import { ChatIconButton } from './ChatIconButton';

interface ExpenseAnalysisCardProps {
  data: ExpenseAnalysis;
}

export const ExpenseAnalysisCard = ({ data }: ExpenseAnalysisCardProps) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const anomaliesText = data.anomalies.length > 0 
    ? `${data.anomalies.length} spending anomalies detected`
    : 'No anomalies';
  
  const reference = {
    id: 'expense-analysis',
    name: 'Expense Intelligence',
    type: 'Financial Metric',
    icon: 'bar-chart',
    data: `Expense analysis: ${anomaliesText}. Top vendor: ${data.topVendors[0]?.name} at ${formatCurrency(data.topVendors[0]?.amount || 0)}.`
  };

  return (
    <Card className="bg-white border border-vesta-navy/10 group hover:shadow-md transition-all">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium text-vesta-navy/90">Expense Intelligence</CardTitle>
        <ChatIconButton reference={reference} />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Anomaly Alert - If exists */}
        {data.anomalies.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-amber-700" />
              <span className="text-xs font-medium text-amber-900">{data.anomalies[0].category}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-medium text-amber-900">+{data.anomalies[0].deviation}%</span>
              <span className="text-xs text-amber-700">vs expected</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-amber-800">
              <span>Expected: {formatCurrency(data.anomalies[0].expected)}</span>
              <span>•</span>
              <span>Actual: {formatCurrency(data.anomalies[0].amount)}</span>
            </div>
          </div>
        )}

        {/* Top Vendors - Clean List */}
        <div className="space-y-1">
          <p className="text-xs text-vesta-navy/65 mb-3">Top Spending</p>
          {data.topVendors.slice(0, 5).map((vendor, idx) => (
            <div key={vendor.name} className="flex items-center justify-between py-2 border-b border-vesta-mist/50 last:border-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs text-vesta-navy-muted w-4">{idx + 1}</span>
                <span className="text-sm text-vesta-navy truncate">{vendor.name}</span>
              </div>
              <span className="text-sm font-medium text-vesta-navy ml-4">{formatCurrency(vendor.amount)}</span>
            </div>
          ))}
        </div>

        {/* Top Insight Only */}
        {data.insights && data.insights.length > 0 && (
          <div className="pt-4 border-t border-vesta-navy/8">
            <p className="text-xs text-vesta-navy/90 leading-relaxed">{data.insights[0].action}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
