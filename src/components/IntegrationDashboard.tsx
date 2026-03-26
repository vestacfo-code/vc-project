import { useQuickBooksIntegration } from '@/hooks/useQuickBooksIntegration';
import { useWaveIntegration } from '@/hooks/useWaveIntegration';
import { useZohoIntegration } from '@/hooks/useZohoIntegration';
import { useQuickBooksAnalytics } from '@/hooks/useQuickBooksAnalytics';
import { useDashboardReference } from '@/contexts/DashboardReferenceContext';
import { useCreditGuard, CREDIT_COSTS } from '@/hooks/useCreditGuard';
import { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CashFlowForecastCard } from '@/components/analytics/CashFlowForecastCard';
import { CashFlowChart } from '@/components/analytics/CashFlowChart';
import { CustomerRevenueChart } from '@/components/analytics/CustomerRevenueChart';
import { ExpenseBreakdownChart } from '@/components/analytics/ExpenseBreakdownChart';
import { ARIntelligenceCard } from '@/components/analytics/ARIntelligenceCard';
import { ExpenseAnalysisCard } from '@/components/analytics/ExpenseAnalysisCard';
import { CustomerProfitabilityCard } from '@/components/analytics/CustomerProfitabilityCard';
import { RefreshCw, TrendingUp, AlertTriangle, Loader2, Database, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLoadingSkeleton } from '@/components/DashboardLoadingSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const IntegrationDashboard = () => {
  const { integration: qbIntegration, syncing: qbSyncing } = useQuickBooksIntegration();
  const { integration: waveIntegration, syncing: waveSyncing } = useWaveIntegration();
  const { integration: zohoIntegration } = useZohoIntegration();
  const { analytics, loading, refetch } = useQuickBooksAnalytics();
  const { setAvailableReferences } = useDashboardReference();
  const { checkAndUseCredits } = useCreditGuard();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const hasAutoSyncedRef = useRef(false);

  // Determine active integration and company name
  const integration = qbIntegration || waveIntegration || zohoIntegration;
  const companyName = qbIntegration?.company_name || 
                      waveIntegration?.business_name || 
                      zohoIntegration?.organization_name || 
                      'Your Business';
  const providerName = qbIntegration ? 'QuickBooks' : 
                       waveIntegration ? 'Wave' : 
                       zohoIntegration ? 'Zoho Books' : 
                       'Financial';

  // Check if we have any meaningful data
  const hasData = analytics.cashFlowForecast?.forecast?.some(f => f.cashIn > 0 || f.cashOut > 0) ||
                  analytics.customerProfitability?.topCustomers?.length > 0 ||
                  analytics.expenseAnalysis?.topVendors?.length > 0;

  // Auto-sync when first connected (no data yet)
  useEffect(() => {
    const performAutoSync = async () => {
      // Only auto-sync if we have an integration but no data, and haven't already auto-synced
      if (integration && !hasData && !loading && !hasAutoSyncedRef.current && !isSyncing && !isAutoSyncing) {
        hasAutoSyncedRef.current = true;
        setIsAutoSyncing(true);
        setSyncProgress(0);
        
        // Simulate progress animation
        const progressInterval = setInterval(() => {
          setSyncProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 15;
          });
        }, 500);

        try {
          // Use credits for auto-sync
          const hasCredits = await checkAndUseCredits('integration_sync', `Auto-sync data from ${providerName}`);
          if (!hasCredits) {
            setIsAutoSyncing(false);
            clearInterval(progressInterval);
            return;
          }

          const { data, error } = await supabase.functions.invoke('quickbooks-sync', {
            body: { syncType: 'full' }
          });

          clearInterval(progressInterval);
          setSyncProgress(100);

          if (error) throw error;

          toast({
            title: "Initial Sync Complete",
            description: `Successfully imported your data from ${providerName}. (${CREDIT_COSTS.integration_sync} credits used)`,
          });

          // Wait for progress animation to complete, then refetch
          setTimeout(() => {
            setIsAutoSyncing(false);
            refetch();
          }, 500);
        } catch (error: any) {
          clearInterval(progressInterval);
          console.error('Auto-sync error:', error);
          toast({
            title: "Sync Failed",
            description: error.message || "Failed to sync data. Please try the sync button.",
            variant: "destructive",
          });
          setIsAutoSyncing(false);
        }
      }
    };

    performAutoSync();
  }, [integration, hasData, loading]);

  // Sync data function - costs 2 credits
  const handleSync = async () => {
    // Check and deduct credits before syncing
    const hasCredits = await checkAndUseCredits('integration_sync', `Sync data from ${providerName}`);
    if (!hasCredits) {
      return; // Credit guard will show the paywall
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-sync', {
        body: { syncType: 'full' }
      });

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.syncOperations?.filter((op: any) => op.status === 'success').length || 0} data types from ${providerName}. (${CREDIT_COSTS.integration_sync} credits used)`,
      });

      // Wait a moment then refetch analytics
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Register available dashboard references
  useEffect(() => {
    if (analytics && hasData) {
      const references = [
        { id: 'cash-flow-forecast', name: 'Cash Flow Forecast', type: 'Financial Metric', icon: 'dollar-sign', data: 'Cash flow metrics' },
        { id: 'ar-intelligence', name: 'AR Intelligence', type: 'Financial Metric', icon: 'users', data: 'AR analysis' },
        { id: 'expense-analysis', name: 'Expense Intelligence', type: 'Financial Metric', icon: 'bar-chart', data: 'Expense data' },
        { id: 'customer-profitability', name: 'Customer Profitability', type: 'Financial Metric', icon: 'users', data: 'Customer data' },
        { id: 'cash-flow-chart', name: 'Cash Flow Projection', type: 'Chart', icon: 'trending-up', data: 'Cash flow chart' },
        { id: 'customer-revenue-chart', name: 'Customer Revenue', type: 'Chart', icon: 'users', data: 'Revenue chart' },
        { id: 'expense-breakdown-chart', name: 'Expense Distribution', type: 'Chart', icon: 'bar-chart', data: 'Expense chart' },
      ];
      setAvailableReferences(references);
    }
  }, [analytics, hasData, setAvailableReferences]);

  // Show auto-sync loading screen
  if (isAutoSyncing) {
    return (
      <div className="dashboard-light flex items-center justify-center min-h-full p-8 bg-white">
        <Card className="max-w-md w-full bg-white border border-gray-200">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-3">
              Importing Your Data
            </h2>
            <p className="text-gray-600 mb-6">
              We're syncing your financial data from {providerName}. This usually takes about 30 seconds.
            </p>
            <div className="space-y-2">
              <Progress value={syncProgress} className="h-2" />
              <p className="text-sm text-gray-500">
                {syncProgress < 30 ? 'Connecting to ' + providerName + '...' : 
                 syncProgress < 60 ? 'Fetching customers & invoices...' :
                 syncProgress < 90 ? 'Processing financial data...' :
                 'Finalizing...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  // Show sync prompt if connected but no data
  if (integration && !hasData) {
    return (
      <div className="dashboard-light space-y-8 p-8 bg-white min-h-full">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-normal text-gray-900">
              {companyName}
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              {providerName} • Connected
            </p>
          </div>
        </div>

        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-3">
              {isSyncing ? 'Syncing Your Data...' : 'Ready to Sync Your Data'}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {isSyncing 
                ? `We're importing your financial data from ${providerName}. This may take a minute.`
                : `Your ${providerName} account is connected! Click below to import your financial data and see your analytics dashboard.`
              }
            </p>
            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
              size="lg"
              className="min-w-[200px]"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Sync Data Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard-light space-y-8 p-8 bg-white min-h-full">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-4xl font-normal text-gray-900">
            {companyName}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            {providerName} • Predictive analytics & actionable insights
          </p>
        </div>
      </div>

      {/* Refresh Button - Positioned below header */}
      <div className="flex justify-end -mt-4">
        <Button 
          onClick={isSyncing ? undefined : handleSync} 
          variant="outline" 
          size="sm" 
          className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? 'Syncing...' : 'Refresh'}
        </Button>
      </div>

      {/* Runway Alert - Only show if critical or warning */}
      {analytics.cashFlowForecast?.runway != null && analytics.cashFlowForecast.runway < 6 && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {analytics.cashFlowForecast.runway < 3 ? (
                  <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Cash Runway</p>
                  <p className="text-3xl font-medium text-gray-900 mt-1">
                    {analytics.cashFlowForecast.runway.toFixed(1)} <span className="text-lg text-gray-500 font-normal">months</span>
                  </p>
                </div>
              </div>
              <Badge 
                variant={analytics.cashFlowForecast.runway < 3 ? 'destructive' : 'secondary'}
                className={`text-sm px-3 py-1 ${analytics.cashFlowForecast.runway < 3 ? 'bg-red-100 text-red-800 border-0' : 'bg-amber-100 text-amber-800 border-0'}`}
              >
                {analytics.cashFlowForecast.runway < 3 ? 'Critical' : 'Warning'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Flow Chart */}
      {analytics.cashFlowForecast?.forecast && (
        <CashFlowChart data={analytics.cashFlowForecast.forecast} />
      )}

      {/* Revenue & Expense Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics.customerProfitability?.topCustomers && (
          <CustomerRevenueChart customers={analytics.customerProfitability.topCustomers} />
        )}
        {analytics.expenseAnalysis?.topVendors && (
          <ExpenseBreakdownChart vendors={analytics.expenseAnalysis.topVendors} />
        )}
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics.cashFlowForecast && (
          <CashFlowForecastCard data={analytics.cashFlowForecast} />
        )}
        {analytics.arIntelligence && (
          <ARIntelligenceCard data={analytics.arIntelligence} />
        )}
        {analytics.expenseAnalysis && (
          <ExpenseAnalysisCard data={analytics.expenseAnalysis} />
        )}
        {analytics.customerProfitability && (
          <CustomerProfitabilityCard data={analytics.customerProfitability} />
        )}
      </div>

      {/* Timestamp */}
      {analytics.generatedAt && (
        <p className="text-xs text-gray-500 text-center">
          Updated {new Date(analytics.generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default IntegrationDashboard;