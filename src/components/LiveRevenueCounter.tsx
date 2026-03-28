import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CountUpAnimation from '@/components/CountUpAnimation';
import { DollarSign, Users } from 'lucide-react';

interface RevenueStats {
  totalRevenue: number;
  userCount: number;
}

export const LiveRevenueCounter = () => {
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    userCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueStats = async () => {
      try {
        console.log('Fetching live revenue stats...');
        
        // Use the public stats function that bypasses RLS
        const { data, error } = await supabase.rpc('get_public_stats');

        if (error) {
          console.error('Error fetching public stats:', error);
          return;
        }

        if (data && data.length > 0) {
          const stats = data[0];
          console.log('Public stats received:', stats);
          
          setStats({
            totalRevenue: Number(stats.total_revenue) || 0,
            userCount: Number(stats.total_users) || 0
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenueStats();

    // Set up real-time subscription for live updates
    const subscription = supabase
      .channel('live-stats-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'financial_data' },
        () => {
          console.log('Financial data updated, refreshing stats...');
          fetchRevenueStats();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          console.log('Profiles updated, refreshing stats...');
          fetchRevenueStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="container px-4 py-20 mx-auto max-w-screen-xl">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          Powering Financial Success Globally
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Join businesses worldwide who trust Vesta to analyze their financial data and drive growth
        </p>
      </div>
      
      <div className="max-w-5xl mx-auto">
        {/* Live Stats */}
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 mb-20">
          {/* Total Revenue */}
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-2">
              {isLoading ? '...' : formatCurrency(stats.totalRevenue)}
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Total Revenue Analyzed</h3>
            </div>
            <p className="text-muted-foreground text-sm max-w-48">
              Cumulative revenue processed through Vesta's AI analysis
            </p>
          </div>

          {/* Active Users */}
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">
              {isLoading ? '...' : <CountUpAnimation end={stats.userCount} />}
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Active Users</h3>
            </div>
            <p className="text-muted-foreground text-sm max-w-48">
              Business owners and finance professionals using Vesta
            </p>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-white font-medium">Live Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};