import { supabase } from '@/integrations/supabase/client';
import { computeHealthScorePartial } from './textFinancialExtractor';

interface FinancialData {
  revenue: number;
  expenses: number;
  cashFlow: number;
  profit?: number;
  period?: string;
}

interface AnalysisResult {
  summary: string;
  healthScore: number;
  insights: Array<{
    title: string;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
  trends: {
    profitability: 'improving' | 'declining' | 'stable';
    cashFlow: 'improving' | 'declining' | 'stable';
    efficiency: 'improving' | 'declining' | 'stable';
  };
}

export async function analyzeFinancialDataClientSide(
  financialData: FinancialData,
  userId: string,
  userContext?: string
): Promise<AnalysisResult> {
  console.log('Performing client-side financial analysis');
  
  const { revenue, expenses, cashFlow, profit = revenue - expenses } = financialData;
  
  // Calculate key metrics
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const expenseRatio = revenue > 0 ? (expenses / revenue) * 100 : 100;
  const cashFlowMargin = revenue > 0 ? (cashFlow / revenue) * 100 : 0;
  
  // Calculate health score (0-100) using unified normalized model
  const healthScore = computeHealthScorePartial({ revenue, expenses, cashFlow, profit });
  
  // Generate insights based on metrics
  const insights = [];
  
  if (profit > 0) {
    insights.push({
      title: 'Positive Profitability',
      description: `Your business generated $${profit.toLocaleString()} in profit with a ${profitMargin.toFixed(1)}% margin.`,
      type: 'positive' as const,
      impact: profitMargin > 20 ? 'high' as const : profitMargin > 10 ? 'medium' as const : 'low' as const
    });
  } else {
    insights.push({
      title: 'Profitability Challenge',
      description: `Your business had a loss of $${Math.abs(profit).toLocaleString()}. Focus on increasing revenue or reducing costs.`,
      type: 'negative' as const,
      impact: 'high' as const
    });
  }
  
  if (cashFlow !== profit) {
    if (cashFlow > profit) {
      insights.push({
        title: 'Strong Cash Position',
        description: 'Your cash flow exceeds profit, indicating good working capital management.',
        type: 'positive' as const,
        impact: 'medium' as const
      });
    } else {
      insights.push({
        title: 'Cash Flow Attention Needed',
        description: 'Cash flow is lower than profit, suggesting potential collection or timing issues.',
        type: 'negative' as const,
        impact: 'medium' as const
      });
    }
  }
  
  if (expenseRatio > 85) {
    insights.push({
      title: 'High Expense Ratio',
      description: `Expenses represent ${expenseRatio.toFixed(1)}% of revenue. Consider cost optimization opportunities.`,
      type: 'negative' as const,
      impact: 'medium' as const
    });
  } else if (expenseRatio < 70) {
    insights.push({
      title: 'Efficient Operations',
      description: `Your expense ratio of ${expenseRatio.toFixed(1)}% shows good cost management.`,
      type: 'positive' as const,
      impact: 'medium' as const
    });
  }
  
  // Generate recommendations
  const recommendations = [];
  
  if (profit < 0) {
    recommendations.push('Focus on increasing revenue through new customer acquisition or pricing optimization');
    recommendations.push('Conduct a detailed expense review to identify cost reduction opportunities');
  }
  
  if (cashFlow < profit) {
    recommendations.push('Review accounts receivable and collection processes to improve cash conversion');
    recommendations.push('Consider adjusting payment terms with customers and suppliers');
  }
  
  if (expenseRatio > 80) {
    recommendations.push('Analyze expense categories to identify the largest cost drivers');
    recommendations.push('Implement cost controls and budget monitoring systems');
  }
  
  if (revenue > 0 && profit > 0) {
    recommendations.push('Consider reinvesting profits into growth initiatives');
    recommendations.push('Build emergency reserves to improve financial resilience');
  }
  
  // Determine trends (simplified for client-side)
  const trends = {
    profitability: profit > 0 ? 'stable' as const : 'declining' as const,
    cashFlow: cashFlow > 0 ? 'stable' as const : 'declining' as const,
    efficiency: expenseRatio < 80 ? 'stable' as const : 'declining' as const
  };
  
  // Generate comprehensive summary
  const summary = generateAnalysisSummary({
    revenue,
    expenses,
    profit,
    cashFlow,
    profitMargin,
    expenseRatio,
    cashFlowMargin,
    healthScore,
    insights,
    recommendations
  });
  
  // Save analysis to database
  try {
    await supabase.from('business_health_scores').insert({
      user_id: userId,
      score: healthScore,
      ai_explanation: summary,
      factors: {
        revenue,
        expenses,
        profit,
        cashFlow,
        profitMargin,
        expenseRatio,
        metrics: { healthScore, profitMargin, cashFlowMargin, expenseRatio }
      }
    });
  } catch (dbError) {
    console.warn('Failed to save analysis to database:', dbError);
  }
  
  return {
    summary,
    healthScore,
    insights,
    recommendations,
    trends
  };
}

function generateAnalysisSummary({
  revenue,
  expenses,
  profit,
  cashFlow,
  profitMargin,
  expenseRatio,
  cashFlowMargin,
  healthScore,
  insights,
  recommendations
}: any): string {
  return `Financial Analysis Summary

Overall Health Score: ${healthScore}/100

Your business shows ${healthScore >= 70 ? 'strong' : healthScore >= 50 ? 'moderate' : 'concerning'} financial health based on current metrics.

Key Metrics Analysis

Revenue Performance: $${revenue.toLocaleString()}
Total Expenses: $${expenses.toLocaleString()} (${expenseRatio.toFixed(1)}% of revenue)
Net Profit: ${profit >= 0 ? '+' : ''}$${profit.toLocaleString()} (${profitMargin.toFixed(1)}% margin)
Cash Flow: ${cashFlow >= 0 ? '+' : ''}$${cashFlow.toLocaleString()} (${cashFlowMargin.toFixed(1)}% of revenue)

Professional Insights

${insights.map((insight, index) => 
  `${index + 1}. ${insight.title}
   ${insight.description} This has a ${insight.impact} impact on your business.`
).join('\n\n')}

Strategic Recommendations

${recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

Forward Outlook

${profit > 0 
  ? `With positive profitability, focus on scaling operations and building reserves. ${cashFlow > profit ? 'Strong cash position supports growth initiatives.' : 'Monitor cash flow timing to ensure liquidity.'}`
  : `Immediate attention needed on profitability. ${revenue > expenses * 0.8 ? 'You are close to breakeven - small improvements could yield significant results.' : 'Significant restructuring may be required to achieve sustainability.'}`
}

${healthScore < 60 
  ? '⚠️ Action Required: Your business health score indicates immediate attention is needed. Focus on the recommendations above to improve financial stability.'
  : healthScore >= 80 
  ? '✅ Strong Position: Your business is performing well financially. Consider growth and expansion opportunities.'
  : '📊 Steady Progress: Your business has solid fundamentals. Focus on optimizing the areas highlighted above.'
}

Analysis generated on ${new Date().toLocaleDateString()} using client-side financial modeling.`;
}