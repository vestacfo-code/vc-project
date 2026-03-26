import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CashFlowForecast {
  forecast: Array<{
    period: string;
    cashIn: number;
    cashOut: number;
    net: number;
  }>;
  runway: number;
  monthlyBurn: number;
  currentCash: number;
  insights: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    action: string;
  }>;
}

export interface ARIntelligence {
  customerProfiles: Array<{
    name: string;
    score: number;
    avgDaysLate: number;
    totalRevenue: number;
    paymentCount: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  atRiskAmount: number;
  insights: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    action: string;
  }>;
}

export interface ExpenseAnalysis {
  anomalies: Array<{
    category: string;
    amount: number;
    expected: number;
    deviation: number;
  }>;
  topVendors: Array<{
    name: string;
    amount: number;
  }>;
  insights: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    action: string;
  }>;
}

export interface WorkingCapital {
  dso: number;
  dpo: number;
  ccc: number;
  insights: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    action: string;
  }>;
}

export interface CustomerProfitability {
  topCustomers: Array<{
    name: string;
    totalRevenue: number;
    invoiceCount: number;
    avgInvoiceValue: number;
    daysSinceLastPurchase: number;
    status: 'active' | 'declining' | 'at-risk';
  }>;
  concentration: number;
  insights: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    action: string;
  }>;
}

export interface QuickBooksAnalytics {
  cashFlowForecast: CashFlowForecast | null;
  arIntelligence: ARIntelligence | null;
  expenseAnalysis: ExpenseAnalysis | null;
  workingCapital: WorkingCapital | null;
  customerProfitability: CustomerProfitability | null;
  generatedAt: string | null;
}

export const useQuickBooksAnalytics = () => {
  const [analytics, setAnalytics] = useState<QuickBooksAnalytics>({
    cashFlowForecast: null,
    arIntelligence: null,
    expenseAnalysis: null,
    workingCapital: null,
    customerProfitability: null,
    generatedAt: null,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching QuickBooks analytics...');
      const { data, error } = await supabase.functions.invoke('quickbooks-analytics');
      
      if (error) {
        console.error('Analytics function error:', error);
        throw error;
      }
      
      console.log('Analytics data received:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching QuickBooks analytics:', error);
      toast({
        title: 'Analytics Error',
        description: 'Failed to load analytics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    refetch: fetchAnalytics,
  };
};
