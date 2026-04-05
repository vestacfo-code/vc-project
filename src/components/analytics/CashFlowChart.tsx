import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChatIconButton } from './ChatIconButton';

interface CashFlowChartProps {
  data: Array<{
    period: string;
    cashIn: number;
    cashOut: number;
    net: number;
  }>;
}

export const CashFlowChart = ({ data }: CashFlowChartProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const reference = {
    id: 'cash-flow-chart',
    name: 'Cash Flow Projection',
    type: 'Chart',
    icon: 'trending-up',
    data: `Cash flow projection data: ${data.map(d => `${d.period}: ${formatCurrency(d.net)} net`).join(', ')}.`
  };

  return (
    <Card className="bg-white border border-vesta-navy/10 group hover:shadow-md transition-all">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium text-vesta-navy/90">Cash Flow Projection</CardTitle>
        <ChatIconButton reference={reference} />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12, fill: '#5f6368' }}
              axisLine={{ stroke: '#e8eaed' }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: '#5f6368' }}
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
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar dataKey="cashIn" fill="#1e8e3e" name="Cash In" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cashOut" fill="#d93025" name="Cash Out" radius={[4, 4, 0, 0]} />
            <Bar dataKey="net" fill="#1a73e8" name="Net" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
