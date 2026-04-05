import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, PieLabelRenderProps } from 'recharts';
import { ChatIconButton } from './ChatIconButton';

interface ExpenseBreakdownChartProps {
  vendors: Array<{
    name: string;
    amount: number;
  }>;
}

const COLORS = ['#1a73e8', '#1e8e3e', '#ea8600', '#9334e6', '#d93025'];

export const ExpenseBreakdownChart = ({ vendors }: ExpenseBreakdownChartProps) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  
  const chartData = vendors.slice(0, 5);

  const renderLabel = (props: PieLabelRenderProps) => {
    const percent = Number(props.percent) || 0;
    const name = (props as any).name || '';
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  const reference = {
    id: 'expense-breakdown-chart',
    name: 'Expense Distribution',
    type: 'Chart',
    icon: 'bar-chart',
    data: JSON.stringify(chartData)
  };
  
  return (
    <Card className="bg-white border border-vesta-navy/10 group hover:shadow-md transition-all">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium text-vesta-navy/90">Expense Distribution</CardTitle>
        <ChatIconButton reference={reference} />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="amount"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e8eaed',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-sm text-vesta-navy/90">{value}</span>}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
