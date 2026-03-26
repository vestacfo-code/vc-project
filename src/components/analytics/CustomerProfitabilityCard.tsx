import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, AlertCircle } from 'lucide-react';
import { CustomerProfitability } from '@/hooks/useQuickBooksAnalytics';
import { ChatIconButton } from './ChatIconButton';

interface CustomerProfitabilityCardProps {
  data: CustomerProfitability;
}

export const CustomerProfitabilityCard = ({ data }: CustomerProfitabilityCardProps) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const reference = {
    id: 'customer-profitability',
    name: 'Customer Profitability',
    type: 'Financial Metric',
    icon: 'users',
    data: `Customer profitability: ${data.concentration}% revenue concentration. Top customer generates ${formatCurrency(data.topCustomers[0]?.totalRevenue || 0)}.`
  };

  const hasHighConcentration = data.concentration > 60;

  return (
    <Card className="bg-white border border-gray-200 group hover:shadow-md transition-all">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium text-gray-700">Customer Profitability</CardTitle>
        <ChatIconButton reference={reference} />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue Concentration */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Revenue Concentration</span>
            {hasHighConcentration && (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-medium text-gray-900">{data.concentration}%</span>
            <span className="text-xs text-gray-600">from top customers</span>
          </div>
        </div>

        {/* Top Customers - Minimal Cards */}
        <div className="space-y-2 pt-2">
          {data.topCustomers.slice(0, 4).map((customer, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">#{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{customer.name}</span>
                  {customer.status === 'at-risk' && (
                    <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{formatCurrency(customer.totalRevenue)}</span>
                  <span>•</span>
                  <span>{customer.invoiceCount} invoices</span>
                  {customer.daysSinceLastPurchase > 0 && (
                    <>
                      <span>•</span>
                      <span>{customer.daysSinceLastPurchase}d ago</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Insight Only */}
        {data.insights && data.insights.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-700 leading-relaxed">{data.insights[0].action}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
