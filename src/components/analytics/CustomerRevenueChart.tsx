import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChatIconButton } from './ChatIconButton';

interface CustomerRevenueChartProps {
  customers: Array<{
    name: string;
    totalRevenue: number;
    status: 'active' | 'declining' | 'at-risk';
  }>;
}

export const CustomerRevenueChart = ({ customers }: CustomerRevenueChartProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const topCustomer = customers[0];
  const reference = {
    id: 'customer-revenue-chart',
    name: 'Customer Revenue',
    type: 'Chart',
    icon: 'users',
    data: `Customer revenue data - Top customer: ${topCustomer?.name} with ${formatCurrency(topCustomer?.totalRevenue || 0)}.`
  };

  return (
    <Card className="bg-white border border-gray-200 group hover:shadow-md transition-all">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium text-gray-700">Top Customers</CardTitle>
        <ChatIconButton reference={reference} />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={customers.slice(0, 10)} 
            layout="vertical"
            margin={{ left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" horizontal={false} />
            <XAxis 
              type="number" 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: '#5f6368' }}
              axisLine={{ stroke: '#e8eaed' }}
            />
            <YAxis 
              type="category" 
              dataKey="name"
              tick={{ fontSize: 12, fill: '#5f6368' }}
              width={120}
              axisLine={{ stroke: '#e8eaed' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e8eaed',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Bar 
              dataKey="totalRevenue" 
              fill="#1a73e8"
              name="Revenue"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
