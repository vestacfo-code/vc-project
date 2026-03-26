import { useQuickBooksIntegration } from '@/hooks/useQuickBooksIntegration';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChartData {
  period: string;
  amount: number;
  category?: string;
}

export const useFinancialChartData = () => {
  const { integration } = useQuickBooksIntegration();
  const { user } = useAuth();

  const { data: financialData } = useQuery({
    queryKey: ['financial-chart-data', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_data')
        .select('revenue, expenses, cash_flow, profit, period_start, period_end')
        .eq('user_id', user!.id)
        .order('period_start', { ascending: true })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const detectChartType = (userQuery: string): 'revenue' | 'expenses' | 'cash_flow' | 'profit' | null => {
    const query = userQuery.toLowerCase();
    
    if (query.includes('revenue') || query.includes('sales') || query.includes('income')) {
      return 'revenue';
    }
    if (query.includes('expense') || query.includes('cost') || query.includes('spending')) {
      return 'expenses';
    }
    if (query.includes('cash flow') || query.includes('cashflow')) {
      return 'cash_flow';
    }
    if (query.includes('profit') || query.includes('margin') || query.includes('earnings')) {
      return 'profit';
    }
    
    return null;
  };

  const getChartDataFromDB = (type: 'revenue' | 'expenses' | 'cash_flow' | 'profit'): ChartData[] => {
    if (!financialData || financialData.length === 0) return [];

    const formatPeriod = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    switch (type) {
      case 'revenue':
        return financialData
          .filter(d => d.revenue != null)
          .map(d => ({ period: formatPeriod(d.period_start), amount: Number(d.revenue) || 0 }));
      
      case 'expenses':
        return financialData
          .filter(d => d.expenses != null)
          .map(d => ({ period: formatPeriod(d.period_start), amount: Number(d.expenses) || 0 }));
      
      case 'cash_flow':
        return financialData
          .filter(d => d.cash_flow != null)
          .map(d => ({ period: formatPeriod(d.period_start), amount: Number(d.cash_flow) || 0 }));
      
      case 'profit':
        return financialData
          .filter(d => d.profit != null)
          .map(d => ({ period: formatPeriod(d.period_start), amount: Number(d.profit) || 0 }));
      
      default:
        return [];
    }
  };

  const getChartTitle = (type: 'revenue' | 'expenses' | 'cash_flow' | 'profit'): string => {
    switch (type) {
      case 'revenue': return 'Revenue Trends';
      case 'expenses': return 'Expense Breakdown';
      case 'cash_flow': return 'Cash Flow Analysis';
      case 'profit': return 'Profit Trends';
      default: return 'Financial Overview';
    }
  };

  return {
    detectChartType,
    generateMockData: getChartDataFromDB,
    getChartTitle,
    hasIntegration: !!integration
  };
};
