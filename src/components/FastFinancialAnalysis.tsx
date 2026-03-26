import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserDocument {
  id: string;
  file_name: string;
  file_type: string;
  markdown_content?: string;
  metadata?: any;
  processing_status: string;
}

interface FinancialMetrics {
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
}

interface FastFinancialAnalysisProps {
  document: UserDocument;
  onAnalysisComplete: (analysis: any) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

export const FastFinancialAnalysis = ({ document, onAnalysisComplete }: FastFinancialAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const extractFinancialData = (content: string): FinancialMetrics => {
    let revenue = 0;
    let expenses = 0;
    let profit = 0;

    // Extract Net Revenue: looking for patterns like "Net Revenue | $823,725.00"
    const netRevenueMatch = content.match(/Net Revenue[^$]*\$\s*([0-9,]+\.?[0-9]*)/i);
    if (netRevenueMatch) {
      revenue = parseFloat(netRevenueMatch[1].replace(/,/g, ''));
      console.log('✅ Found Net Revenue:', revenue);
    }

    // Extract Total Expenses: looking for patterns like "Total Expenses | $130,960.00"
    const totalExpensesMatch = content.match(/Total Expenses[^$]*\$\s*([0-9,]+\.?[0-9]*)/i);
    if (totalExpensesMatch) {
      expenses = parseFloat(totalExpensesMatch[1].replace(/,/g, ''));
      console.log('✅ Found Total Expenses:', expenses);
    }

    // Extract Net Profit: looking for patterns like "Net Profit | $621,971.00"
    const netProfitMatch = content.match(/Net Profit[^$]*\$\s*([0-9,]+\.?[0-9]*)/i);
    if (netProfitMatch) {
      profit = parseFloat(netProfitMatch[1].replace(/,/g, ''));
      console.log('✅ Found Net Profit:', profit);
    }

    return {
      revenue,
      expenses,
      profit,
      cashFlow: profit // Use profit as cash flow approximation
    };
  };

  const generateAnalysis = async () => {
    if (!user) return;
    
    setIsAnalyzing(true);

    try {
      let metrics: FinancialMetrics = { revenue: 0, expenses: 0, profit: 0, cashFlow: 0 };

      // First try to extract from document content
      if (document.markdown_content) {
        console.log('🔍 Extracting from document content...');
        metrics = extractFinancialData(document.markdown_content);
      }

      // If no data found, check database
      if (metrics.revenue === 0) {
        console.log('💾 Checking financial_data table...');
        const { data: financialData } = await supabase
          .from('financial_data')
          .select('*')
          .eq('user_id', user.id)
          .eq('document_id', document.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (financialData && financialData.length > 0) {
          const data = financialData[0];
          metrics = {
            revenue: data.revenue || 0,
            expenses: data.expenses || 0,
            profit: data.profit || 0,
            cashFlow: data.cash_flow || 0
          };
        }
      }

      // If still no data, check document metadata
      if (metrics.revenue === 0 && document.metadata) {
        console.log('📋 Checking document metadata...');
        metrics = {
          revenue: document.metadata.summary?.totalRevenue || document.metadata.totalRevenue || 0,
          expenses: document.metadata.summary?.totalExpenses || document.metadata.totalExpenses || 0,
          profit: document.metadata.summary?.totalProfit || document.metadata.totalProfit || 0,
          cashFlow: document.metadata.cashFlow || 0
        };
      }

      // Calculate health score
      const profitMargin = metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : 0;
      const healthScore = Math.min(Math.max(50 + profitMargin, 10), 100);

      const analysis = {
        healthScore: Math.round(healthScore),
        keyMetrics: metrics,
        summary: `Financial analysis of ${document.file_name} shows revenue of ${formatCurrency(metrics.revenue)}, expenses of ${formatCurrency(metrics.expenses)}, and net profit of ${formatCurrency(metrics.profit)}.`,
        insights: [
          `Revenue: ${formatCurrency(metrics.revenue)}`,
          `Expenses: ${formatCurrency(metrics.expenses)}`,
          `Net Profit: ${formatCurrency(metrics.profit)}`,
          `Profit Margin: ${profitMargin.toFixed(1)}%`
        ],
        recommendations: profitMargin > 20 ? 
          ['Strong profitability - consider expansion opportunities', 'Maintain current operational efficiency'] :
          ['Focus on cost optimization', 'Explore revenue growth strategies']
      };

      console.log('📊 Final analysis:', analysis);
      onAnalysisComplete(analysis);

      toast({
        title: "Analysis Complete",
        description: `Found revenue: ${formatCurrency(metrics.revenue)}, expenses: ${formatCurrency(metrics.expenses)}, profit: ${formatCurrency(metrics.profit)}`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error in fast analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze financial data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Fast Financial Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get instant financial analysis from your uploaded document data.
          </p>
          
          <Button 
            onClick={generateAnalysis}
            disabled={isAnalyzing || document.processing_status !== 'completed'}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate Analysis
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FastFinancialAnalysis;