import { supabase } from '@/integrations/supabase/client';

// Helper functions to distinguish between document-specific and cumulative financial data

export const getDocumentSpecificFinancialData = async (userId: string, documentId: string) => {
  const { data, error } = await supabase
    .from('financial_data')
    .select('*')
    .eq('user_id', userId)
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching document-specific financial data:', error);
    throw error;
  }

  return data || [];
};

export const getCumulativeFinancialData = async (userId: string, limit?: number) => {
  let query = supabase
    .from('financial_data')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cumulative financial data:', error);
    throw error;
  }

  return data || [];
};

export const calculateFinancialSummary = (financialData: any[]) => {
  const totalRevenue = financialData.reduce((sum, record) => sum + (record.revenue || 0), 0);
  const totalExpenses = financialData.reduce((sum, record) => sum + (record.expenses || 0), 0);
  const totalCashFlow = financialData.reduce((sum, record) => sum + (record.cash_flow || 0), 0);
  const profit = totalRevenue - totalExpenses;

  return {
    totalRevenue,
    totalExpenses,
    totalCashFlow,
    profit
  };
};

export const getDocumentFinancialSummary = async (userId: string, documentId: string) => {
  // First check if document has metadata with financial summary (from Excel processor)
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('metadata')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();
    
  if (docError) {
    console.error('Error fetching document metadata:', docError);
  }
  
  // If document has metadata summary (from Excel/CSV processor), use that
  if (document?.metadata && typeof document.metadata === 'object' && document.metadata !== null) {
    const metadata = document.metadata as any;
    if (metadata.summary) {
      const summary = metadata.summary;
      console.log('📊 Using document metadata summary:', summary);
      
      // Extract the correct values - use totalProfit if available, otherwise calculate
      const revenue = summary.totalRevenue || 0;
      const expenses = summary.totalExpenses || 0;
      const profit = summary.totalProfit !== undefined ? summary.totalProfit : (revenue - expenses);
      
      return {
        totalRevenue: revenue,
        totalExpenses: expenses,
        totalCashFlow: summary.totalCashFlow || 0,
        profit: profit
      };
    }
  }
  
  // Fallback: check financial_data table for individual records
  const data = await getDocumentSpecificFinancialData(userId, documentId);
  return calculateFinancialSummary(data);
};

export const getCumulativeFinancialSummary = async (userId: string, limit?: number) => {
  const data = await getCumulativeFinancialData(userId, limit);
  return calculateFinancialSummary(data);
};