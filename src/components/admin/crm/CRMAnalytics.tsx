import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Users, TrendingUp, DollarSign, Target, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  totalContacts: number;
  totalDeals: number;
  totalDealValue: number;
  wonDeals: number;
  wonValue: number;
  callsMade: number;
  callsConnected: number;
  activitiesLogged: number;
  conversionRate: number;
  avgDealValue: number;
  contactsByStatus: { status: string; count: number }[];
  dealsByStage: { stage: string; count: number; value: number }[];
}

export const CRMAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - parseInt(timeRange));

      // Fetch contacts
      const { data: contacts } = await supabase
        .from('crm_contacts')
        .select('status')
        .gte('created_at', dateFilter.toISOString());

      // Fetch deals
      const { data: deals } = await supabase
        .from('crm_deals')
        .select('stage, value, currency')
        .gte('created_at', dateFilter.toISOString());

      // Fetch call logs
      const { data: calls } = await supabase
        .from('crm_call_logs')
        .select('outcome')
        .gte('created_at', dateFilter.toISOString());

      // Fetch activities
      const { data: activities } = await supabase
        .from('crm_activities')
        .select('id')
        .gte('created_at', dateFilter.toISOString());

      // Calculate metrics
      const totalContacts = contacts?.length || 0;
      const totalDeals = deals?.length || 0;
      const totalDealValue = deals?.reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 0;
      
      const wonDeals = deals?.filter(d => d.stage === 'closed_won') || [];
      const wonValue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      
      const callsMade = calls?.length || 0;
      const callsConnected = calls?.filter(c => c.outcome === 'connected')?.length || 0;
      const activitiesLogged = activities?.length || 0;
      
      const conversionRate = totalContacts > 0 ? (wonDeals.length / totalContacts) * 100 : 0;
      const avgDealValue = wonDeals.length > 0 ? wonValue / wonDeals.length : 0;

      // Group by status
      const contactsByStatus = contacts?.reduce((acc: any[], contact) => {
        const existing = acc.find(x => x.status === contact.status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ status: contact.status, count: 1 });
        }
        return acc;
      }, []) || [];

      // Group by stage
      const dealsByStage = deals?.reduce((acc: any[], deal) => {
        const existing = acc.find(x => x.stage === deal.stage);
        if (existing) {
          existing.count++;
          existing.value += Number(deal.value) || 0;
        } else {
          acc.push({ stage: deal.stage, count: 1, value: Number(deal.value) || 0 });
        }
        return acc;
      }, []) || [];

      setAnalytics({
        totalContacts,
        totalDeals,
        totalDealValue,
        wonDeals: wonDeals.length,
        wonValue,
        callsMade,
        callsConnected,
        activitiesLogged,
        conversionRate,
        avgDealValue,
        contactsByStatus,
        dealsByStage,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">CRM Analytics</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.contactsByStatus.length} different statuses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.totalDealValue)} pipeline value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.wonDeals}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.wonValue)} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.avgDealValue)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Made</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.callsMade}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.callsConnected} connected ({analytics.callsMade > 0 ? ((analytics.callsConnected / analytics.callsMade) * 100).toFixed(1) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities Logged</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activitiesLogged}</div>
            <p className="text-xs text-muted-foreground">
              All activity types
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contacts by Status</CardTitle>
            <CardDescription>Distribution of contact statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.contactsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{item.status.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deals by Stage</CardTitle>
            <CardDescription>Pipeline breakdown by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.dealsByStage.map((item) => (
                <div key={item.stage} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{item.stage.replace('_', ' ')}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{item.count} deals</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(item.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
