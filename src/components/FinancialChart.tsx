import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FinancialChartProps {
  data: any[];
  chartType: 'revenue' | 'expenses' | 'cash_flow' | 'profit' | 'overview';
  title: string;
}

const FinancialChart = ({ data, chartType, title }: FinancialChartProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const colors = {
    revenue: '#06b6d4', // Cyan-500
    expenses: '#f43f5e', // Rose-500
    cash_flow: '#10b981', // Emerald-500
    profit: '#8b5cf6', // Violet-500
    overview: '#f59e0b' // Amber-500
  };

  const getIcon = () => {
    switch (chartType) {
      case 'revenue': return <TrendingUp className="w-4 h-4" />;
      case 'expenses': return <PieChart className="w-4 h-4" />;
      case 'cash_flow': return <DollarSign className="w-4 h-4" />;
      case 'profit': return <BarChart3 className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No financial data available for this period</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'revenue':
      case 'cash_flow':
      case 'profit':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id={`gradient-${chartType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[chartType]} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={colors[chartType]} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
              <XAxis 
                dataKey="period" 
                stroke="#6b7280"
                fontSize={12}
                fontWeight={500}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                fontWeight={500}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), title]}
                labelStyle={{ color: '#374151', fontWeight: '600' }}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke={colors[chartType]}
                strokeWidth={3}
                fill={`url(#gradient-${chartType})`}
                dot={{ 
                  fill: colors[chartType], 
                  strokeWidth: 2, 
                  r: 5,
                  stroke: 'white'
                }}
                activeDot={{ 
                  r: 7, 
                  stroke: colors[chartType], 
                  strokeWidth: 3,
                  fill: 'white'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'expenses':
        const expenseColors = ['#06b6d4', '#f43f5e', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
              <XAxis 
                dataKey="category" 
                stroke="#6b7280"
                fontSize={12}
                fontWeight={500}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                fontWeight={500}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                labelStyle={{ color: '#374151', fontWeight: '600' }}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}
              />
              <Bar 
                dataKey="amount"
                radius={[6, 6, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={expenseColors[index % expenseColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="overview-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.overview} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={colors.overview} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
              <XAxis dataKey="period" stroke="#6b7280" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickFormatter={formatCurrency} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), title]} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke={colors.overview}
                strokeWidth={3}
                fill="url(#overview-gradient)"
                dot={{ fill: colors.overview, strokeWidth: 2, r: 5, stroke: 'white' }}
                activeDot={{ r: 7, stroke: colors.overview, strokeWidth: 3, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="mb-4 border border-gray-200 shadow-sm bg-gradient-to-br from-white to-gray-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-800">
            <div 
              className="p-1.5 rounded-lg" 
              style={{ 
                backgroundColor: `${colors[chartType]}15`,
                color: colors[chartType]
              }}
            >
              {getIcon()}
            </div>
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0 hover:bg-gray-100 rounded-full transition-colors"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            )}
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="pt-0 pb-4">
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            {renderChart()}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default FinancialChart;