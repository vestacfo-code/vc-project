import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuickBooksRecord {
  data_type: string;
  data: any;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch QuickBooks data
    const { data: qbData, error: qbError } = await supabase
      .from('quickbooks_data')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (qbError) throw qbError;

    const records = qbData as QuickBooksRecord[];
    
    // Calculate analytics
    const analytics = await calculateAnalytics(records);

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in quickbooks-analytics:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function calculateAnalytics(records: QuickBooksRecord[]) {
  console.log('Total records:', records.length);
  console.log('Record types:', [...new Set(records.map(r => r.data_type))]);
  
  const invoices = records.filter(r => r.data_type === 'invoices').map(r => r.data_json || r.data);
  const payments = records.filter(r => r.data_type === 'payments').map(r => r.data_json || r.data);
  const bills = records.filter(r => r.data_type === 'bills').map(r => r.data_json || r.data);
  const expenses = records.filter(r => r.data_type === 'expenses').map(r => r.data_json || r.data);
  const customers = records.filter(r => r.data_type === 'customers').map(r => r.data_json || r.data);
  
  console.log('Filtered counts:', { invoices: invoices.length, payments: payments.length, bills: bills.length, expenses: expenses.length, customers: customers.length });

  // Cash Flow Forecasting
  const cashFlowForecast = calculateCashFlowForecast(invoices, payments, bills, expenses);
  
  // AR Intelligence
  const arIntelligence = calculateARIntelligence(invoices, payments, customers);
  
  // Expense Analysis
  const expenseAnalysis = calculateExpenseAnalysis(expenses, bills);
  
  // Working Capital Metrics
  const workingCapital = calculateWorkingCapital(invoices, payments, bills);
  
  // Customer Profitability
  const customerProfitability = calculateCustomerProfitability(invoices, payments, customers);

  return {
    cashFlowForecast,
    arIntelligence,
    expenseAnalysis,
    workingCapital,
    customerProfitability,
    generatedAt: new Date().toISOString(),
  };
}

function calculateCashFlowForecast(invoices: any[], payments: any[], bills: any[], expenses: any[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Calculate historical collection rates by aging bucket
  const collectionRates = calculateCollectionRates(invoices, payments);
  
  // Calculate current AR by aging
  const currentAR = calculateARByAging(invoices, payments);
  
  // Calculate recurring expenses
  const recurringExpenses = detectRecurringExpenses(expenses, bills);
  
  // Forecast cash in for next 30/60/90 days
  const forecast30Days = forecastCashFlow(currentAR, collectionRates, recurringExpenses, 30);
  const forecast60Days = forecastCashFlow(currentAR, collectionRates, recurringExpenses, 60);
  const forecast90Days = forecastCashFlow(currentAR, collectionRates, recurringExpenses, 90);

  // Calculate runway
  const monthlyBurn = calculateMonthlyBurn(expenses, bills);
  const currentCash = calculateCurrentCash(payments, expenses, bills);
  const runway = currentCash / monthlyBurn;

  return {
    forecast: [
      { period: '30 days', cashIn: forecast30Days.cashIn, cashOut: forecast30Days.cashOut, net: forecast30Days.net },
      { period: '60 days', cashIn: forecast60Days.cashIn, cashOut: forecast60Days.cashOut, net: forecast60Days.net },
      { period: '90 days', cashIn: forecast90Days.cashIn, cashOut: forecast90Days.cashOut, net: forecast90Days.net },
    ],
    runway: Math.round(runway * 10) / 10,
    monthlyBurn,
    currentCash,
    insights: generateCashFlowInsights(forecast30Days, runway, monthlyBurn),
  };
}

function calculateCollectionRates(invoices: any[], payments: any[]) {
  const buckets = { '0-30': [], '31-60': [], '61-90': [], '90+': [] };
  
  invoices.forEach(invoice => {
    const payment = payments.find(p => p.CustomerRef?.value === invoice.CustomerRef?.value);
    if (payment && invoice.TxnDate && payment.TxnDate) {
      const daysToCollect = Math.floor(
        (new Date(payment.TxnDate).getTime() - new Date(invoice.TxnDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysToCollect <= 30) buckets['0-30'].push(daysToCollect);
      else if (daysToCollect <= 60) buckets['31-60'].push(daysToCollect);
      else if (daysToCollect <= 90) buckets['61-90'].push(daysToCollect);
      else buckets['90+'].push(daysToCollect);
    }
  });

  return {
    '0-30': buckets['0-30'].length / Math.max(1, invoices.length) || 0.95,
    '31-60': buckets['31-60'].length / Math.max(1, invoices.length) || 0.80,
    '61-90': buckets['61-90'].length / Math.max(1, invoices.length) || 0.60,
    '90+': buckets['90+'].length / Math.max(1, invoices.length) || 0.30,
  };
}

function calculateARByAging(invoices: any[], payments: any[]) {
  const now = new Date();
  const ar = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  
  invoices.forEach(invoice => {
    const isPaid = payments.some(p => 
      p.Line?.some((line: any) => line.LinkedTxn?.some((txn: any) => txn.TxnId === invoice.Id))
    );
    
    if (!isPaid && invoice.TxnDate) {
      const age = Math.floor((now.getTime() - new Date(invoice.TxnDate).getTime()) / (1000 * 60 * 60 * 24));
      const balance = parseFloat(invoice.Balance || 0);
      
      if (age <= 30) ar['0-30'] += balance;
      else if (age <= 60) ar['31-60'] += balance;
      else if (age <= 90) ar['61-90'] += balance;
      else ar['90+'] += balance;
    }
  });

  return ar;
}

function detectRecurringExpenses(expenses: any[], bills: any[]) {
  const vendors: { [key: string]: number[] } = {};
  
  [...expenses, ...bills].forEach(item => {
    const vendor = item.EntityRef?.name || 'Unknown';
    const amount = parseFloat(item.TotalAmt || 0);
    if (!vendors[vendor]) vendors[vendor] = [];
    vendors[vendor].push(amount);
  });

  let monthlyRecurring = 0;
  Object.entries(vendors).forEach(([vendor, amounts]) => {
    if (amounts.length >= 2) {
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length;
      if (variance < avg * 0.2) {
        monthlyRecurring += avg;
      }
    }
  });

  return monthlyRecurring;
}

function forecastCashFlow(currentAR: any, collectionRates: any, recurringExpenses: number, days: number) {
  const cashIn = 
    currentAR['0-30'] * collectionRates['0-30'] +
    currentAR['31-60'] * collectionRates['31-60'] +
    currentAR['61-90'] * collectionRates['61-90'] +
    currentAR['90+'] * collectionRates['90+'];
  
  const cashOut = (recurringExpenses / 30) * days;
  
  return {
    cashIn: Math.round(cashIn),
    cashOut: Math.round(cashOut),
    net: Math.round(cashIn - cashOut),
  };
}

function calculateMonthlyBurn(expenses: any[], bills: any[]) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const recentExpenses = [...expenses, ...bills]
    .filter(item => item.TxnDate && new Date(item.TxnDate) > thirtyDaysAgo)
    .reduce((sum, item) => sum + parseFloat(item.TotalAmt || 0), 0);
  
  return Math.round(recentExpenses);
}

function calculateCurrentCash(payments: any[], expenses: any[], bills: any[]) {
  const totalIn = payments.reduce((sum, p) => sum + parseFloat(p.TotalAmt || 0), 0);
  const totalOut = [...expenses, ...bills].reduce((sum, item) => sum + parseFloat(item.TotalAmt || 0), 0);
  return Math.max(0, Math.round(totalIn - totalOut));
}

function generateCashFlowInsights(forecast: any, runway: number, burn: number) {
  const insights = [];
  
  if (runway < 3) {
    insights.push({
      type: 'critical',
      title: 'Critical Runway Alert',
      message: `Only ${runway.toFixed(1)} months of runway remaining. Immediate action required.`,
      action: 'Accelerate collections or reduce burn rate urgently.',
    });
  } else if (runway < 6) {
    insights.push({
      type: 'warning',
      title: 'Low Runway Warning',
      message: `${runway.toFixed(1)} months runway - below healthy 6-month threshold.`,
      action: 'Focus on increasing cash reserves and reducing expenses.',
    });
  }

  if (forecast.net < 0) {
    insights.push({
      type: 'warning',
      title: 'Negative Cash Flow Predicted',
      message: `30-day forecast shows -$${Math.abs(forecast.net).toLocaleString()} net cash flow.`,
      action: 'Accelerate receivables collection or defer non-critical expenses.',
    });
  }

  return insights;
}

function calculateARIntelligence(invoices: any[], payments: any[], customers: any[]) {
  const customerStats: { [key: string]: any } = {};
  
  // Build customer payment profiles
  customers.forEach(customer => {
    const customerId = customer.Id;
    const customerInvoices = invoices.filter(inv => inv.CustomerRef?.value === customerId);
    const customerPayments = payments.filter(pay => pay.CustomerRef?.value === customerId);
    
    let totalPaid = 0;
    let onTimePaid = 0;
    let totalDaysLate = 0;
    let paymentCount = 0;

    customerInvoices.forEach(invoice => {
      const payment = customerPayments.find(p => 
        p.Line?.some((line: any) => line.LinkedTxn?.some((txn: any) => txn.TxnId === invoice.Id))
      );
      
      if (payment && invoice.DueDate && payment.TxnDate) {
        paymentCount++;
        const daysLate = Math.max(0, Math.floor(
          (new Date(payment.TxnDate).getTime() - new Date(invoice.DueDate).getTime()) / (1000 * 60 * 60 * 24)
        ));
        
        totalDaysLate += daysLate;
        if (daysLate === 0) onTimePaid++;
        totalPaid += parseFloat(payment.TotalAmt || 0);
      }
    });

    if (paymentCount > 0) {
      const score = (onTimePaid / paymentCount) * 0.6 + (1 - Math.min(totalDaysLate / paymentCount / 30, 1)) * 0.4;
      customerStats[customerId] = {
        name: customer.DisplayName || customer.CompanyName || 'Unknown',
        score: Math.round(score * 100),
        avgDaysLate: Math.round(totalDaysLate / paymentCount),
        totalRevenue: Math.round(totalPaid),
        paymentCount,
        riskLevel: score > 0.8 ? 'low' : score > 0.6 ? 'medium' : 'high',
      };
    }
  });

  // Sort by risk (worst first)
  const sortedCustomers = Object.values(customerStats).sort((a: any, b: any) => a.score - b.score);
  
  // Calculate at-risk AR
  const atRiskAR = sortedCustomers
    .filter((c: any) => c.riskLevel === 'high')
    .reduce((sum: number, c: any) => sum + c.totalRevenue, 0);

  return {
    customerProfiles: sortedCustomers.slice(0, 10),
    atRiskAmount: Math.round(atRiskAR),
    insights: generateARInsights(sortedCustomers, atRiskAR),
  };
}

function generateARInsights(customers: any[], atRiskAmount: number) {
  const insights = [];
  
  if (atRiskAmount > 0) {
    const highRiskCustomers = customers.filter((c: any) => c.riskLevel === 'high');
    insights.push({
      type: 'warning',
      title: 'High-Risk Receivables',
      message: `$${atRiskAmount.toLocaleString()} in receivables from ${highRiskCustomers.length} high-risk customers.`,
      action: `Focus collection efforts on: ${highRiskCustomers.slice(0, 3).map((c: any) => c.name).join(', ')}`,
    });
  }

  const slowPayers = customers.filter((c: any) => c.avgDaysLate > 15);
  if (slowPayers.length > 0) {
    insights.push({
      type: 'info',
      title: 'Slow Payment Patterns',
      message: `${slowPayers.length} customers averaging 15+ days late on payments.`,
      action: 'Consider early payment incentives or stricter payment terms.',
    });
  }

  return insights;
}

function calculateExpenseAnalysis(expenses: any[], bills: any[]) {
  const categories: { [key: string]: number[] } = {};
  const vendors: { [key: string]: number } = {};
  
  [...expenses, ...bills].forEach(item => {
    const category = item.AccountRef?.name || 'Uncategorized';
    const vendor = item.EntityRef?.name || 'Unknown';
    const amount = parseFloat(item.TotalAmt || 0);
    
    if (!categories[category]) categories[category] = [];
    categories[category].push(amount);
    
    vendors[vendor] = (vendors[vendor] || 0) + amount;
  });

  // Calculate anomalies
  const anomalies = [];
  Object.entries(categories).forEach(([category, amounts]) => {
    if (amounts.length >= 3) {
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const stdDev = Math.sqrt(amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length);
      
      const latest = amounts[amounts.length - 1];
      if (latest > mean + (2 * stdDev)) {
        anomalies.push({
          category,
          amount: Math.round(latest),
          expected: Math.round(mean),
          deviation: Math.round(((latest - mean) / mean) * 100),
        });
      }
    }
  });

  // Top vendors by spend
  const topVendors = Object.entries(vendors)
    .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
    anomalies: anomalies.slice(0, 5),
    topVendors,
    insights: generateExpenseInsights(anomalies, topVendors),
  };
}

function generateExpenseInsights(anomalies: any[], vendors: any[]) {
  const insights = [];
  
  if (anomalies.length > 0) {
    const worst = anomalies[0];
    insights.push({
      type: 'warning',
      title: 'Expense Anomaly Detected',
      message: `${worst.category} spending is ${worst.deviation}% above normal ($${worst.amount.toLocaleString()} vs $${worst.expected.toLocaleString()} avg).`,
      action: 'Review recent transactions in this category for errors or unusual activity.',
    });
  }

  if (vendors.length > 0) {
    const topVendor = vendors[0];
    const totalSpend = vendors.reduce((sum, v) => sum + v.amount, 0);
    const concentration = (topVendor.amount / totalSpend) * 100;
    
    if (concentration > 30) {
      insights.push({
        type: 'info',
        title: 'Vendor Concentration Risk',
        message: `${concentration.toFixed(0)}% of expenses with single vendor: ${topVendor.name}`,
        action: 'Consider diversifying suppliers to reduce risk.',
      });
    }
  }

  return insights;
}

function calculateWorkingCapital(invoices: any[], payments: any[], bills: any[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Calculate DSO (Days Sales Outstanding)
  const recentInvoices = invoices.filter(inv => inv.TxnDate && new Date(inv.TxnDate) > thirtyDaysAgo);
  const recentPayments = payments.filter(pay => pay.TxnDate && new Date(pay.TxnDate) > thirtyDaysAgo);
  
  const totalAR = recentInvoices.reduce((sum, inv) => sum + parseFloat(inv.Balance || 0), 0);
  const totalRevenue = recentInvoices.reduce((sum, inv) => sum + parseFloat(inv.TotalAmt || 0), 0);
  const dso = totalRevenue > 0 ? Math.round((totalAR / totalRevenue) * 30) : 0;
  
  // Calculate DPO (Days Payable Outstanding)
  const recentBills = bills.filter(bill => bill.TxnDate && new Date(bill.TxnDate) > thirtyDaysAgo);
  const totalAP = recentBills.reduce((sum, bill) => sum + parseFloat(bill.Balance || 0), 0);
  const totalCOGS = recentBills.reduce((sum, bill) => sum + parseFloat(bill.TotalAmt || 0), 0);
  const dpo = totalCOGS > 0 ? Math.round((totalAP / totalCOGS) * 30) : 0;
  
  // CCC = DSO + DIO - DPO (assuming DIO = 0 for service businesses)
  const ccc = dso - dpo;

  return {
    dso,
    dpo,
    ccc,
    insights: generateWorkingCapitalInsights(dso, dpo, ccc),
  };
}

function generateWorkingCapitalInsights(dso: number, dpo: number, ccc: number) {
  const insights = [];
  
  if (dso > 45) {
    insights.push({
      type: 'warning',
      title: 'High Days Sales Outstanding',
      message: `${dso} days to collect - industry avg is 30-45 days.`,
      action: 'Implement early payment discounts or tighten collection processes.',
    });
  }

  if (dpo < 30 && dpo > 0) {
    insights.push({
      type: 'info',
      title: 'Early Vendor Payments',
      message: `Paying vendors in ${dpo} days - most offer net-30 terms.`,
      action: 'Extend payment timing to improve cash flow (without damaging relationships).',
    });
  }

  if (ccc > 45) {
    insights.push({
      type: 'warning',
      title: 'High Cash Conversion Cycle',
      message: `${ccc} days to convert operations to cash.`,
      action: 'Optimize by reducing DSO and/or extending DPO.',
    });
  }

  return insights;
}

function calculateCustomerProfitability(invoices: any[], payments: any[], customers: any[]) {
  const customerMetrics: { [key: string]: any } = {};
  
  customers.forEach(customer => {
    const customerId = customer.Id;
    const customerInvoices = invoices.filter(inv => inv.CustomerRef?.value === customerId);
    
    const totalRevenue = customerInvoices.reduce((sum, inv) => sum + parseFloat(inv.TotalAmt || 0), 0);
    const invoiceCount = customerInvoices.length;
    
    if (totalRevenue > 0) {
      const avgInvoice = totalRevenue / invoiceCount;
      const lastInvoiceDate = customerInvoices.length > 0 
        ? new Date(Math.max(...customerInvoices.map(inv => new Date(inv.TxnDate).getTime())))
        : null;
      
      const daysSinceLastInvoice = lastInvoiceDate 
        ? Math.floor((Date.now() - lastInvoiceDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      customerMetrics[customerId] = {
        name: customer.DisplayName || customer.CompanyName || 'Unknown',
        totalRevenue: Math.round(totalRevenue),
        invoiceCount,
        avgInvoiceValue: Math.round(avgInvoice),
        daysSinceLastPurchase: daysSinceLastInvoice,
        status: daysSinceLastInvoice > 90 ? 'at-risk' : daysSinceLastInvoice > 60 ? 'declining' : 'active',
      };
    }
  });

  const sortedCustomers = Object.values(customerMetrics).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);
  
  // Calculate concentration
  const totalRevenue = sortedCustomers.reduce((sum: number, c: any) => sum + c.totalRevenue, 0);
  const top20Percent = Math.ceil(sortedCustomers.length * 0.2);
  const top20Revenue = sortedCustomers.slice(0, top20Percent).reduce((sum: number, c: any) => sum + c.totalRevenue, 0);
  const concentration = totalRevenue > 0 ? (top20Revenue / totalRevenue) * 100 : 0;

  return {
    topCustomers: sortedCustomers.slice(0, 10),
    concentration: Math.round(concentration),
    insights: generateCustomerInsights(sortedCustomers, concentration),
  };
}

function generateCustomerInsights(customers: any[], concentration: number) {
  const insights = [];
  
  if (concentration > 60) {
    insights.push({
      type: 'warning',
      title: 'High Customer Concentration',
      message: `Top 20% of customers generate ${concentration.toFixed(0)}% of revenue.`,
      action: 'Diversify customer base to reduce dependency risk.',
    });
  }

  const atRiskCustomers = customers.filter((c: any) => c.status === 'at-risk' && c.totalRevenue > 1000);
  if (atRiskCustomers.length > 0) {
    const atRiskRevenue = atRiskCustomers.reduce((sum: number, c: any) => sum + c.totalRevenue, 0);
    insights.push({
      type: 'warning',
      title: 'At-Risk Customer Revenue',
      message: `${atRiskCustomers.length} customers (${(atRiskRevenue).toLocaleString()} revenue) haven't purchased in 90+ days.`,
      action: `Re-engage: ${atRiskCustomers.slice(0, 3).map((c: any) => c.name).join(', ')}`,
    });
  }

  return insights;
}
