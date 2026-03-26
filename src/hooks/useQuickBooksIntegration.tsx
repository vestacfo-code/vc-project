import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeamRole } from '@/hooks/useTeamRole';

interface QuickBooksIntegration {
  id: string;
  company_name: string;
  realm_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface QuickBooksData {
  id: string;
  data_type: string;
  quickbooks_id: string;
  data_json: any;
  last_synced: string;
}

export const useQuickBooksIntegration = () => {
  const { user } = useAuth();
  const { effectiveUserId, isMember, isLoading: teamLoading, canSyncData } = useTeamRole();
  const [integration, setIntegration] = useState<QuickBooksIntegration | null>(null);
  const [quickbooksData, setQuickBooksData] = useState<QuickBooksData[]>([]);
  // Start with loading false - don't block UI while we check for integrations
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);


  // Fetch integration status with race condition prevention
  // Uses effectiveUserId which is owner's ID for team members
  const fetchIntegration = async () => {
    if (!user || isFetching || teamLoading) return;
    
    // Use effectiveUserId to fetch data - this will be the owner's ID for team members
    const targetUserId = effectiveUserId || user.id;
    
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('quickbooks_integrations')
        .select('id, company_name, realm_id, is_active, created_at, updated_at')
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error fetching QB integration:', error);
      } else {
        setIntegration(data && data.length > 0 ? data[0] : null);
      }
    } catch (error) {
      console.error('Error fetching integration:', error);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Fetch QuickBooks data
  // Uses effectiveUserId which is owner's ID for team members
  const fetchQuickBooksData = async () => {
    if (!user || !integration) return;

    const targetUserId = effectiveUserId || user.id;

    try {
      const { data, error } = await supabase
        .from('quickbooks_data')
        .select('id, data_type, quickbooks_id, data_json, last_synced')
        .eq('user_id', targetUserId)
        .order('last_synced', { ascending: false });

      if (error) {
        console.error('Error fetching QB data:', error);
      } else {
        setQuickBooksData(data || []);
      }
    } catch (error) {
      console.error('Error fetching QB data:', error);
    }
  };

  // Sync specific data type
  // Only owners and authorized team members can sync
  const syncData = async (syncType: string = 'full') => {
    if (!integration) return false;
    
    // Check if user has permission to sync
    if (isMember && !canSyncData) {
      throw new Error('You do not have permission to sync data. Please contact your team owner.');
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-sync', {
        body: { syncType }
      });

      if (error) {
        console.error('Sync error:', error);
        // Check if it's a token refresh issue
        if (error.message?.includes('non-2xx status code')) {
          throw new Error('QuickBooks connection expired. Please reconnect your account.');
        }
        throw new Error(error.message || 'Sync failed');
      }

      if (data?.error) {
        console.error('Sync response error:', data.error);
        
        // Check for specific QuickBooks auth errors
        if (data.reconnect_required || 
            data.error.includes('Token refresh failed') || 
            data.error.includes('invalid_grant') ||
            data.error.includes('connection expired')) {
          // Mark integration as inactive
          await supabase
            .from('quickbooks_integrations')
            .update({ is_active: false })
            .eq('id', integration.id);
          
          setIntegration(null);
          throw new Error('QuickBooks connection expired. Please reconnect your account from the dashboard.');
        }
        
        throw new Error(data.error);
      }

      console.log('Sync successful:', data);
      
      // Refresh data after sync
      await fetchQuickBooksData();
      return true;
    } catch (error) {
      console.error('Error syncing QB data:', error);
      
      // Re-throw the error so the UI can handle it
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  // Get formatted knowledge base for AI chat
  const getKnowledgeBase = () => {
    if (!integration || !quickbooksData.length) return '';

    const sections = [];

    // Company info
    sections.push(`Company: ${integration.company_name}`);
    sections.push(`QuickBooks Account ID: ${integration.realm_id}`);
    sections.push(`Last Updated: ${new Date(integration.updated_at).toLocaleDateString()}`);

    // Group data by type
    const dataByType = quickbooksData.reduce((acc, item) => {
      if (!acc[item.data_type]) acc[item.data_type] = [];
      
      // Handle both single items and arrays in data_json
      const itemData = Array.isArray(item.data_json) ? item.data_json : [item.data_json];
      acc[item.data_type].push(...itemData);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate revenue totals if invoice/sales data is available
    const revenueTypes = ['invoices', 'sales', 'salesreceipts'];
    let totalRevenue = 0;
    let revenueCount = 0;

    revenueTypes.forEach(type => {
      if (dataByType[type]?.length > 0) {
        dataByType[type].forEach(item => {
          const amount = parseFloat(item.TotalAmt || item.Amount || 0);
          totalRevenue += amount;
          revenueCount++;
        });
      }
    });

    if (totalRevenue > 0) {
      sections.push(`\n--- FINANCIAL SUMMARY ---`);
      sections.push(`Total Revenue: $${totalRevenue.toLocaleString()}`);
      sections.push(`Revenue Transactions: ${revenueCount}`);
    }

    // Add payment totals if available
    if (dataByType.payments?.length > 0) {
      const totalPayments = dataByType.payments.reduce((sum, payment) => {
        const amount = parseFloat(payment.TotalAmt || 0);
        return sum + amount;
      }, 0);
      
      sections.push(`Total Payments Received: $${totalPayments.toLocaleString()}`);
      sections.push(`Number of Payments: ${dataByType.payments.length}`);
    }

    // Calculate expense totals if available
    if (dataByType.expenses?.length > 0 || dataByType.bills?.length > 0) {
      let totalExpenses = 0;
      let expenseCount = 0;
      
      ['expenses', 'bills'].forEach(type => {
        if (dataByType[type]?.length > 0) {
          dataByType[type].forEach(item => {
            const amount = parseFloat(item.TotalAmt || item.Amount || 0);
            totalExpenses += amount;
            expenseCount++;
          });
        }
      });
      
      if (totalExpenses > 0) {
        sections.push(`Total Expenses: $${totalExpenses.toLocaleString()}`);
        sections.push(`Expense Transactions: ${expenseCount}`);
      }
    }

    // Format each data type with comprehensive details
    Object.entries(dataByType).forEach(([type, items]) => {
      sections.push(`\n--- ${type.toUpperCase()} (${items.length} items) ---`);
      
      // For revenue-related data, show detailed financial info
      if (['invoices', 'payments', 'salesreceipts', 'sales'].includes(type)) {
        items.forEach((item, index) => {
          const customerName = item.CustomerRef?.name || item.CustomerRef || 'Unknown Customer';
          const amount = item.TotalAmt || item.Amount || '0';
          const date = item.TxnDate || item.Date || item.MetaData?.CreateTime?.split('T')[0] || 'Unknown Date';
          const docNum = item.DocNumber || item.PaymentRefNum || item.Id;
          sections.push(`${index + 1}. ${customerName}: $${amount} (${date}) - Doc: ${docNum}`);
        });
      }
      // For expense data, show vendor and account details
      else if (['expenses', 'bills'].includes(type)) {
        items.forEach((item, index) => {
          const vendorName = item.VendorRef?.name || item.Vendor || 'Unknown Vendor';
          const amount = item.TotalAmt || item.Amount || '0';
          const date = item.TxnDate || item.Date || 'Unknown Date';
          const account = item.AccountRef?.name || item.Account || '';
          sections.push(`${index + 1}. ${vendorName}: $${amount} (${date}) - ${account}`);
        });
      }
      // For customers, show balance and contact info
      else if (type === 'customers') {
        items.forEach((item, index) => {
          const name = item.Name || item.DisplayName || `ID: ${item.Id}`;
          const balance = item.Balance ? ` - Balance: $${item.Balance}` : '';
          const active = item.Active !== undefined ? ` (${item.Active ? 'Active' : 'Inactive'})` : '';
          const email = item.PrimaryEmailAddr?.Address ? ` - Email: ${item.PrimaryEmailAddr.Address}` : '';
          sections.push(`${index + 1}. ${name}${balance}${active}${email}`);
        });
      }
      // For items/products, show pricing and inventory
      else if (type === 'items') {
        items.forEach((item, index) => {
          const name = item.Name || `ID: ${item.Id}`;
          const price = item.UnitPrice ? ` - Price: $${item.UnitPrice}` : '';
          const qty = item.QtyOnHand !== null && item.QtyOnHand !== undefined ? ` - Qty: ${item.QtyOnHand}` : '';
          const type = item.Type ? ` (${item.Type})` : '';
          sections.push(`${index + 1}. ${name}${type}${price}${qty}`);
        });
      }
      // For accounts, show type and balance
      else if (type === 'accounts') {
        items.forEach((item, index) => {
          const name = item.Name || `ID: ${item.Id}`;
          const accountType = item.AccountType ? ` (${item.AccountType})` : '';
          const balance = item.CurrentBalance ? ` - Balance: $${item.CurrentBalance}` : '';
          const active = item.Active !== undefined ? ` ${item.Active ? 'Active' : 'Inactive'}` : '';
          sections.push(`${index + 1}. ${name}${accountType}${balance}${active}`);
        });
      }
      // For other data types, show basic info
      else {
        items.forEach((item, index) => {
          const name = item.Name || item.DisplayName || item.CompanyName || `ID: ${item.Id}`;
          const detail = item.Active !== undefined ? ` (${item.Active ? 'Active' : 'Inactive'})` : '';
          sections.push(`${index + 1}. ${name}${detail}`);
        });
      }
    });

    return sections.join('\n');
  };

  // Get summary stats
  const getStats = () => {
    if (!quickbooksData || quickbooksData.length === 0) {
      return {
        totalItems: 0,
        byType: {},
        lastSync: null
      };
    }

    const stats = quickbooksData.reduce((acc, item) => {
      acc[item.data_type] = (acc[item.data_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems: quickbooksData.length,
      byType: stats,
      lastSync: quickbooksData[0]?.last_synced
    };
  };

  useEffect(() => {
    if (user && !teamLoading) {
      fetchIntegration();
    }
  }, [user, teamLoading, effectiveUserId]);

  useEffect(() => {
    if (integration) {
      fetchQuickBooksData();
    }
  }, [integration, effectiveUserId]);

  // Set up realtime subscription to detect integration changes
  useEffect(() => {
    if (!user || teamLoading) return;

    const targetUserId = effectiveUserId || user.id;
    console.log('[QB Integration Hook] Setting up realtime subscription for user:', targetUserId);

    const channel = supabase
      .channel('quickbooks-integration-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quickbooks_integrations',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          console.log('[QB Integration Hook] Realtime change detected:', payload);
          fetchIntegration();
        }
      )
      .subscribe((status) => {
        console.log('[QB Integration Hook] Subscription status:', status);
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.warn('[QB Integration Hook] Realtime subscription failed, will rely on manual refresh');
        }
      });

    return () => {
      console.log('[QB Integration Hook] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user, teamLoading, effectiveUserId]);

  // Add a function to refresh integration after OAuth with retry logic
  const refreshAfterOAuth = async (retries = 3) => {
    console.log('[QB Integration Hook] Manual refresh triggered, retries left:', retries);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('quickbooks_integrations')
        .select('id, company_name, realm_id, is_active, created_at, updated_at')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.error('[QB Integration Hook] Error fetching integration:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('[QB Integration Hook] Integration found:', data[0]);
        setIntegration(data[0]);
        setLoading(false);
        return true;
      } else if (retries > 0) {
        // Retry after 1 second if integration not found yet
        console.log('[QB Integration Hook] Integration not found, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return refreshAfterOAuth(retries - 1);
      } else {
        console.log('[QB Integration Hook] Integration not found after retries');
        setIntegration(null);
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('[QB Integration Hook] Error in refreshAfterOAuth:', error);
      setLoading(false);
      return false;
    }
  };

  // Disconnect integration
  const disconnectIntegration = async () => {
    if (!integration || !user) return false;

    try {
      console.log('[QB Integration Hook] Disconnecting integration:', integration.id);
      
      const { error } = await supabase
        .from('quickbooks_integrations')
        .update({ is_active: false })
        .eq('id', integration.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[QB Integration Hook] Error disconnecting:', error);
        return false;
      }

      console.log('[QB Integration Hook] Successfully disconnected, clearing local state');
      
      // Clear local state immediately
      setIntegration(null);
      setQuickBooksData([]);
      
      return true;
    } catch (error) {
      console.error('[QB Integration Hook] Error disconnecting integration:', error);
      return false;
    }
  };

  return {
    integration,
    quickbooksData,
    // Only report loading if we're actually fetching, not waiting for team role
    loading: isFetching,
    syncing,
    syncData,
    getKnowledgeBase,
    getStats,
    refreshIntegration: fetchIntegration,
    refreshData: fetchQuickBooksData,
    refreshAfterOAuth,
    disconnectIntegration,
    isMember,
    canSyncData,
  };
};