import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, TrendingUp, DollarSign, Target, Settings, Upload, FileText, LogOut, Building2, RefreshCw } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import CountUpAnimation from '@/components/CountUpAnimation';
import AIInsightsChat from '@/components/AIInsightsChat';

import BusinessHealthScore from '@/components/BusinessHealthScore';
import StrategicAlerts from '@/components/StrategicAlerts';
import IntelligentDataHub from '@/components/IntelligentDataHub';
import InteractiveFinancialModel from '@/components/InteractiveFinancialModel';
import ValuationEstimatorDialog from '@/components/ValuationEstimator/ValuationEstimatorDialog';
import WeeklyNotificationReport from '@/components/WeeklyEmailReport';
import NotificationCenter from '@/components/NotificationCenter';
import heroImage from '@/assets/hero-financial.jpg';
import ScenarioSimulator from '@/components/ScenarioSimulator';
import BlurredDashboard from '@/components/BlurredDashboard';
import DocumentManager from '@/components/DocumentManager';
import UserSettings from '@/components/UserSettings';
import TermsOfServiceModal from '@/components/TermsOfServiceModal';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import { computeHealthScorePartial } from '@/lib/textFinancialExtractor';
import { Loader2 } from 'lucide-react';
import { CreditTab } from '@/components/CreditTab';
import { CreditNotifications } from '@/components/CreditNotifications';
import { TeamManagement } from '@/components/TeamManagement';
import { useCredits } from '@/hooks/useCredits';
import { toast } from 'sonner';
import { CreditInfoTooltip } from '@/components/CreditInfoTooltip';
import { useQuickBooksIntegration } from '@/hooks/useQuickBooksIntegration';
import { useNavigate } from 'react-router-dom';
import QuickBooksButton from '@/components/QuickBooksButton';
import { WaveButton } from '@/components/WaveButton';
import { useWaveIntegration } from '@/hooks/useWaveIntegration';
import { ZohoButton } from '@/components/ZohoButton';
import { useZohoIntegration } from '@/hooks/useZohoIntegration';
import { MainDashboardLoadingSkeleton } from '@/components/MainDashboardLoadingSkeleton';

const Dashboard = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { integration, quickbooksData, loading: qbLoading, syncData, getStats } = useQuickBooksIntegration();
  const { integration: waveIntegration, loading: waveLoading, syncData: waveSyncData } = useWaveIntegration();
  const { integration: zohoIntegration, loading: zohoLoading, syncData: zohoSyncData } = useZohoIntegration();
  const navigate = useNavigate();
  const [healthScore, setHealthScore] = useState(0);
  const [insights, setInsights] = useState<string[]>([]);
  const [financialData, setFinancialData] = useState(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [hasData, setHasData] = useState(false);
  const [currentRevenue, setCurrentRevenue] = useState(0);
  const [currentExpenses, setCurrentExpenses] = useState(0);
  const [currentProfit, setCurrentProfit] = useState(0);
  const [currentCashFlow, setCurrentCashFlow] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showValuation, setShowValuation] = useState(false);
  const { credits } = useCredits();

  // Control count-up animations: initial load and on new data only
  const ANIMATION_DURATION = 2000;
  const [hasAnimatedOnce, setHasAnimatedOnce] = useState(false);
  const [animateOnNewData, setAnimateOnNewData] = useState(false);
  const animationTimeoutRef = useRef<number | null>(null);

  const {
    hasAcceptedTerms,
    isLoading: termsLoading,
    showTermsModal,
    handleTermsAccepted,
    handleTermsDeclined,
    showTermsForReview
  } = useTermsAcceptance();

  // Handle post-payment success flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const upgraded = urlParams.get('upgraded');
    const tier = urlParams.get('tier');
    const sessionId = urlParams.get('session_id');

    if (upgraded && tier) {
      console.log('[DASHBOARD] Payment success detected:', { upgraded, tier, sessionId });
      toast.success(`🎉 Welcome to ${tier === 'scale' ? 'Scale' : 'CFO'} tier! Your subscription is now active.`);
      
      // Clean up URL without causing redirect
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    // Handle navigation state for tab switching
    const tabFromUrl = urlParams.get('tab');
    
    // Check for navigation state (from BlurredDashboard upload button)
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    } else if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [location.state]);

  useEffect(() => {
    if (user && !qbLoading) {
      loadDashboardData();
      loadUnreadAlerts();
    }
  }, [user, integration, quickbooksData, qbLoading]);

  // Listen for dashboard updates from document uploads/deletions
  useEffect(() => {
    const handleDashboardUpdate = () => {
      if (user) {
        setAnimateOnNewData(true);
        if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = window.setTimeout(() => setAnimateOnNewData(false), ANIMATION_DURATION);
        loadDashboardData();
      }
    };

    window.addEventListener('dashboardUpdate', handleDashboardUpdate);
    return () => {
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate);
    };
  }, [user]);

  // Mark first animation as done after initial metrics are shown
  useEffect(() => {
    if (
      !hasAnimatedOnce &&
      (hasData || currentRevenue !== 0 || currentExpenses !== 0 || currentProfit !== 0 || currentCashFlow !== 0)
    ) {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = window.setTimeout(
        () => setHasAnimatedOnce(true),
        ANIMATION_DURATION
      );
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [hasData, currentRevenue, currentExpenses, currentProfit, currentCashFlow, hasAnimatedOnce]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // If QuickBooks integration is active, use QB data
      if (integration && quickbooksData && quickbooksData.length > 0) {
        console.log('Loading data from QuickBooks integration');
        await loadQuickBooksMetrics();
        setHasData(true);
        return;
      }

      // Otherwise, fall back to document/financial_data tables
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const { data: finDataCheck } = await supabase
        .from('financial_data')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      setHasData((documents && documents.length > 0) || (finDataCheck && finDataCheck.length > 0));
      console.log('hasData check:', {
        documents: documents?.length || 0,
        finData: finDataCheck?.length || 0,
        hasData: (documents && documents.length > 0) || (finDataCheck && finDataCheck.length > 0)
      });

      // Load latest business health score
      const { data: healthData } = await supabase
        .from('business_health_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (healthData && healthData.length > 0) {
        const latest = healthData[0];
        setHealthScore(latest.score);
      }

      // Load financial data
      const { data: finData } = await supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (finData && finData.length > 0) {
        setFinancialData(finData);
        
        // Calculate current totals from real data
        const totalRevenue = finData.reduce((sum, record) => sum + (record.revenue || 0), 0);
        const totalExpenses = finData.reduce((sum, record) => sum + (record.expenses || 0), 0);
        const totalCashFlow = finData.reduce((sum, record) => sum + (record.cash_flow || 0), 0);
        const totalProfit = totalRevenue - totalExpenses;
        
        setCurrentRevenue(totalRevenue);
        setCurrentExpenses(totalExpenses);
        setCurrentProfit(totalProfit);
        setCurrentCashFlow(totalCashFlow);
        
        // Update overall Business Health Score based on available metrics
        const computedHS = computeHealthScorePartial({ revenue: totalRevenue, expenses: totalExpenses, cashFlow: totalCashFlow, profit: totalProfit });
        setHealthScore(computedHS);
      }

      // Generate fresh AI insights if we have data
      if (finData && finData.length > 0) {
        await generateAIInsights(finData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadQuickBooksMetrics = async () => {
    try {
      console.log('[QB METRICS] Processing QuickBooks data:', quickbooksData.length, 'items');
      
      // Helper function to safely parse amounts
      const parseAmount = (value: any): number => {
        if (!value) return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      // Helper function to process array or single item
      const getItems = (data: any): any[] => {
        if (!data) return [];
        return Array.isArray(data) ? data : [data];
      };

      // Calculate revenue from multiple sources
      let totalRevenue = 0;
      
      // Invoices
      const invoiceData = quickbooksData.filter(item => item.data_type === 'invoices');
      invoiceData.forEach(item => {
        getItems(item.data_json).forEach(invoice => {
          totalRevenue += parseAmount(invoice.TotalAmt || invoice.Balance);
        });
      });

      // Payments received
      const paymentData = quickbooksData.filter(item => item.data_type === 'payments');
      paymentData.forEach(item => {
        getItems(item.data_json).forEach(payment => {
          totalRevenue += parseAmount(payment.TotalAmt || payment.Total);
        });
      });

      // Sales receipts
      const salesReceiptData = quickbooksData.filter(item => item.data_type === 'salesreceipts');
      salesReceiptData.forEach(item => {
        getItems(item.data_json).forEach(receipt => {
          totalRevenue += parseAmount(receipt.TotalAmt);
        });
      });

      console.log('[QB METRICS] Total Revenue:', totalRevenue);

      // Calculate expenses from multiple sources
      let totalExpenses = 0;
      
      // Purchase orders and expenses
      const expenseData = quickbooksData.filter(item => item.data_type === 'expenses');
      expenseData.forEach(item => {
        getItems(item.data_json).forEach(expense => {
          totalExpenses += parseAmount(expense.TotalAmt || expense.Amount);
        });
      });

      // Bills
      const billData = quickbooksData.filter(item => item.data_type === 'bills');
      billData.forEach(item => {
        getItems(item.data_json).forEach(bill => {
          totalExpenses += parseAmount(bill.TotalAmt || bill.Balance);
        });
      });

      // Vendor credits (negative expenses)
      const vendorCreditData = quickbooksData.filter(item => item.data_type === 'vendorcredits');
      vendorCreditData.forEach(item => {
        getItems(item.data_json).forEach(credit => {
          totalExpenses -= parseAmount(credit.TotalAmt);
        });
      });

      console.log('[QB METRICS] Total Expenses:', totalExpenses);

      // Calculate cash flow from account balances
      let totalCashFlow = 0;
      const accountData = quickbooksData.filter(item => item.data_type === 'accounts');
      
      accountData.forEach(item => {
        getItems(item.data_json).forEach(account => {
          const balance = parseAmount(account.CurrentBalance);
          const accountType = account.AccountType || account.Type;
          
          // Cash and bank accounts
          if (accountType === 'Bank' || accountType === 'Cash' || accountType === 'Other Current Asset') {
            totalCashFlow += balance;
          }
          // Accounts Receivable (money owed to us)
          else if (accountType === 'Accounts Receivable') {
            totalCashFlow += balance;
          }
          // Accounts Payable (money we owe - subtract)
          else if (accountType === 'Accounts Payable') {
            totalCashFlow -= balance;
          }
        });
      });

      console.log('[QB METRICS] Total Cash Flow:', totalCashFlow);

      const totalProfit = totalRevenue - totalExpenses;

      // Update state
      setCurrentRevenue(totalRevenue);
      setCurrentExpenses(totalExpenses);
      setCurrentProfit(totalProfit);
      setCurrentCashFlow(totalCashFlow);

      // Calculate health score
      const computedHS = computeHealthScorePartial({ 
        revenue: totalRevenue, 
        expenses: totalExpenses, 
        cashFlow: totalCashFlow, 
        profit: totalProfit 
      });
      setHealthScore(computedHS);

      // Generate AI insights with QuickBooks data
      const financialSummary = {
        totalRevenue,
        totalExpenses,
        totalCashFlow,
        profit: totalProfit,
        source: 'QuickBooks'
      };

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'generate',
          financialData: financialSummary,
          profile
        }
      });

      if (!error && data?.insights) {
        setInsights(data.insights);
      }

      console.log('QuickBooks metrics loaded:', {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: totalProfit,
        cashFlow: totalCashFlow,
        healthScore: computedHS
      });
    } catch (error) {
      console.error('Error loading QuickBooks metrics:', error);
    }
  };

  const generateAIInsights = async (finData: any[]) => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Calculate financial summary
      const totalRevenue = finData.reduce((sum, record) => sum + (record.revenue || 0), 0);
      const totalExpenses = finData.reduce((sum, record) => sum + (record.expenses || 0), 0);
      const totalCashFlow = finData.reduce((sum, record) => sum + (record.cash_flow || 0), 0);
      const profit = totalRevenue - totalExpenses;

      const financialSummary = {
        totalRevenue,
        totalExpenses,
        totalCashFlow,
        profit
      };

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'generate',
          financialData: financialSummary,
          profile
        }
      });

      if (!error && data?.insights) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  };

  const loadUnreadAlerts = async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadAlerts(count || 0);
    } catch (error) {
      console.error('Error loading unread alerts:', error);
    }
  };

  const QuickStatsCard = ({ title, value, change, icon: Icon, positive = true }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
              <h3 className="text-lg sm:text-2xl font-bold truncate">
                {typeof value === 'string' && value.includes('$') ? (
                  <CountUpAnimation 
                    end={parseFloat(value.replace(/[$,K,M]/g, '')) * (value.includes('K') ? 1000 : value.includes('M') ? 1000000 : 1)} 
                    prefix="$" 
                    decimals={0}
                    animate={!hasAnimatedOnce || animateOnNewData}
                  />
                ) : typeof value === 'string' && value.includes('/') ? (
                  value.split('/').map((part, index) => (
                    <span key={index}>
                      {index === 0 ? <CountUpAnimation end={parseInt(part)} decimals={0} animate={!hasAnimatedOnce || animateOnNewData} /> : `/${part}`}
                    </span>
                  ))
                ) : (
                  value
                )}
              </h3>
              {change && (
                <Badge variant={positive ? "default" : "secondary"} className="text-xs shrink-0">
                  {positive ? "+" : ""}{change}
                </Badge>
              )}
            </div>
          </div>
          <div className={`p-2 sm:p-3 rounded-full ${positive ? 'bg-success/10' : 'bg-muted/10'} shrink-0 ml-2`}>
            <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${positive ? 'text-success' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleInsightsUpdate = (newInsights: string[]) => {
    setInsights(newInsights);
  };

  const getFinancialSummary = () => {
    return {
      totalRevenue: currentRevenue,
      totalExpenses: currentExpenses,
      totalCashFlow: currentCashFlow,
      profit: currentProfit
    };
  };

  // Render dashboard content
  const dashboardContent = (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg">Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          <Button
            variant="outline"
            size="sm" 
            onClick={() => setActiveTab('settings')}
            className="hidden sm:flex items-center space-x-1"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Button>
          <div className="flex items-center gap-2">
            <CreditTab />
            <CreditInfoTooltip />
          </div>
          <div className="flex-shrink-0">
            <NotificationCenter />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="flex items-center space-x-1 text-destructive hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      {!hasData && (
        <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">Get started by uploading your financial data</h3>
              <p className="text-sm text-muted-foreground">Unlock AI insights, projections, and personalized recommendations.</p>
            </div>
            <Button size="sm" onClick={() => setActiveTab('intelligence')}>
              <Upload className="w-4 h-4 mr-2" />
              Upload documents
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Quick Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <QuickStatsCard
          title="Health Score"
          value={hasData ? `${healthScore}/100` : "0/100"}
          change={hasData ? "+6" : undefined}
          icon={Target}
          positive={true}
        />
        <QuickStatsCard
          title="Revenue"
          value={formatCurrency(currentRevenue)}
          change={hasData && currentRevenue > 0 ? "+12%" : undefined}
          icon={DollarSign}
          positive={true}
        />
        <QuickStatsCard
          title="Profit"
          value={formatCurrency(currentProfit)}
          change={hasData && currentProfit !== 0 ? (currentProfit > 0 ? "+5%" : "-2%") : undefined}
          icon={TrendingUp}
          positive={currentProfit >= 0}
        />
        <QuickStatsCard
          title="Cash Flow"
          value={formatCurrency(currentCashFlow)}
          change={hasData && currentCashFlow !== 0 ? (currentCashFlow > 0 ? "+8%" : "-3%") : undefined}
          icon={TrendingUp}
          positive={currentCashFlow >= 0}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 bg-secondary/50 h-auto p-1 max-w-fit">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-3 py-2">Overview</TabsTrigger>
            <TabsTrigger value="intelligence" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-3 py-2">AI Hub</TabsTrigger>
            <TabsTrigger value="model" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-3 py-2">Model</TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-3 py-2">Alerts</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-3 py-2">Reports</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-3 py-2">Settings</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
            {!hasData ? (
              <BlurredDashboard />
            ) : (
              <>
                {/* Top Section - Health Score and AI Insights */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Health Score */}
                  <div className="lg:col-span-1">
                    <BusinessHealthScore 
                      score={healthScore} 
                      insights={[]}
                    />
                  </div>
                  
                  {/* AI Insights Chat */}
                  <div className="lg:col-span-2">
                    <AIInsightsChat 
                      insights={insights} 
                      financialData={getFinancialSummary()}
                      onInsightsUpdate={handleInsightsUpdate}
                    />
                  </div>
                </div>

                {/* Revenue Chart - Full Width */}
                <div className="w-full">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Revenue Trends</CardTitle>
                      <CardDescription>Financial performance over time with projections</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="w-full h-[300px] overflow-hidden">
                        <ChartContainer
                          config={{
                            revenue: { label: "Revenue", color: "hsl(var(--primary))" },
                            expenses: { label: "Expenses", color: "hsl(var(--destructive))" },
                            projected: { label: "Projected", color: "hsl(var(--muted-foreground))" },
                          }}
                          className="w-full h-full"
                         >
                           <div className="h-full w-full flex items-center justify-center">
                             <div className="text-center text-zinc-500">
                               <TrendingUp className="w-8 h-8 mx-auto mb-3" />
                               <p className="font-medium">Financial Chart</p>
                               <p className="text-sm">Revenue and expense trends</p>
                             </div>
                           </div>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Financial Metrics Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Financial Metrics Overview</CardTitle>
                    <CardDescription>Real-time financial performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-success/10 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-success">
                          <CountUpAnimation end={currentRevenue} prefix="$" decimals={0} />
                        </p>
                      </div>
                      <div className="bg-destructive/10 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                        <p className="text-2xl font-bold text-destructive">
                          <CountUpAnimation end={currentExpenses} prefix="$" decimals={0} />
                        </p>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                        <p className="text-2xl font-bold text-primary">
                          <CountUpAnimation end={currentProfit} prefix="$" decimals={0} />
                        </p>
                      </div>
                      <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Cash Flow</p>
                        <p className="text-2xl font-bold text-blue-600">
                          <CountUpAnimation end={currentCashFlow} prefix="$" decimals={0} />
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* AI Intelligence Hub */}
          <TabsContent value="intelligence" className="space-y-6">
            
            {/* Accounting Integrations */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* QuickBooks Integration Card */}
              <Card className="border-2 border-dashed border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">QuickBooks</CardTitle>
                        <CardDescription>
                          {integration 
                            ? `Connected to ${integration.company_name}` 
                            : 'Connect your QuickBooks account'
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!integration && (
                      <QuickBooksButton 
                        onConnected={() => {
                          toast.success('QuickBooks connected successfully! Your data is now syncing.');
                          loadDashboardData();
                        }}
                      />
                    )}
                    {integration && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">AI Chat Available</Badge>
                          <Badge variant="outline">Auto-Sync Enabled</Badge>
                        </div>
                        <Button
                          onClick={() => navigate('/chat')}
                          variant="outline"
                          className="w-full"
                        >
                          Open AI Chat Hub
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Wave Integration Card */}
              <Card className="border-2 border-dashed border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6 text-[#266FE8]" />
                      <div>
                        <CardTitle className="text-lg">Wave Accounting</CardTitle>
                        <CardDescription>
                          {waveIntegration 
                            ? `Connected to ${waveIntegration.business_name}` 
                            : 'Connect your Wave account'
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!waveIntegration && (
                      <WaveButton 
                        onConnected={() => {
                          toast.success('Wave Accounting connected successfully! Your data is now syncing.');
                          loadDashboardData();
                        }}
                      />
                    )}
                    {waveIntegration && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">Connected</Badge>
                          <Badge variant="outline">Auto-Sync Enabled</Badge>
                        </div>
                        <Button
                          onClick={() => waveSyncData()}
                          variant="outline"
                          className="w-full"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync Now
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Zoho Books Integration Card */}
              <Card className="border-2 border-dashed border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6 text-[#1F4E79]" />
                      <div>
                        <CardTitle className="text-lg">Zoho Books</CardTitle>
                        <CardDescription>
                          {zohoIntegration 
                            ? `Connected to ${zohoIntegration.organization_name}` 
                            : 'Connect your Zoho Books account'
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!zohoIntegration && (
                      <ZohoButton 
                        onConnected={() => {
                          toast.success('Zoho Books connected successfully! Your data is now syncing.');
                          loadDashboardData();
                        }}
                      />
                    )}
                    {zohoIntegration && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">Connected</Badge>
                          <Badge variant="outline">Auto-Sync Enabled</Badge>
                        </div>
                        <Button
                          onClick={() => zohoSyncData()}
                          variant="outline"
                          className="w-full"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync Now
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <IntelligentDataHub />
            <Card className="overflow-hidden">
              <div className="relative">
                <div
                  className="h-32 sm:h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${heroImage})` }}
                  aria-label="Finlo valuation background"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="lg" onClick={() => setShowValuation(true)}>
                    Estimate my valuation (beta)
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Financial Model Tab */}
          <TabsContent value="model" className="space-y-6">
            <InteractiveFinancialModel />
            <Card className="overflow-hidden">
              <div className="relative">
                <div
                  className="h-32 sm:h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${heroImage})` }}
                  aria-label="Finlo valuation background"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="lg" onClick={() => setShowValuation(true)}>
                    Estimate my valuation (beta)
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <StrategicAlerts />
          </TabsContent>

          {/* Notification Reports Tab */}
          <TabsContent value="reports">
            <WeeklyNotificationReport />
          </TabsContent>

          {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <TeamManagement />
          <UserSettings onViewTerms={showTermsForReview} />
        </TabsContent>
      </Tabs>
    </div>
  );

  // Show loading skeleton while checking terms
  if (termsLoading || (user && !hasData && qbLoading)) {
    return <MainDashboardLoadingSkeleton />;
  }

  return (
    <div className="dashboard-light min-h-screen bg-white">
      {/* Dashboard content with conditional blur */}
      <div className={`${!hasAcceptedTerms ? 'blur-md pointer-events-none' : ''}`}>
        {dashboardContent}
      </div>
      
      {/* Terms Modal */}
      <TermsOfServiceModal
        isOpen={!hasAcceptedTerms && !termsLoading || showTermsModal}
        onAccept={handleTermsAccepted}
        onDecline={handleTermsDeclined}
      />

      {/* Valuation Estimator Dialog */}
      <ValuationEstimatorDialog isOpen={showValuation} onClose={() => setShowValuation(false)} />

      {/* Credit Notifications */}
      <CreditNotifications onUpgradeRequested={() => {
        window.dispatchEvent(new CustomEvent('openSettings', { 
          detail: { tab: 'plan-credits' } 
        }));
      }} />
    </div>
  );
};

export default Dashboard;