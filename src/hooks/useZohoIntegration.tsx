import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ZohoIntegration {
  id: string;
  organization_id: string;
  organization_name: string;
  data_center: string;
  currency_code: string;
  is_active: boolean;
  updated_at: string;
}

interface ZohoData {
  id: string;
  data_type: string;
  zoho_id: string;
  data_json: any;
  last_synced: string;
}

export const useZohoIntegration = () => {
  const [integration, setIntegration] = useState<ZohoIntegration | null>(null);
  const [data, setData] = useState<ZohoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchIntegration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: integrationData, error } = await supabase
        .from('zoho_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching Zoho integration:', error);
        return;
      }

      setIntegration(integrationData);
    } catch (error) {
      console.error('Error fetching Zoho integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchZohoData = async () => {
    try {
      if (!integration) return;

      const { data: zohoData, error } = await supabase
        .from('zoho_data')
        .select('*')
        .eq('integration_id', integration.id)
        .order('last_synced', { ascending: false });

      if (error) {
        console.error('Error fetching Zoho data:', error);
        return;
      }

      setData(zohoData || []);
    } catch (error) {
      console.error('Error fetching Zoho data:', error);
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      
      const { data: syncResult, error } = await supabase.functions.invoke('zoho-sync');

      if (error) {
        throw error;
      }

      toast({
        title: "Sync completed",
        description: "Your Zoho Books data has been synced successfully",
      });

      await fetchZohoData();
      return syncResult;
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync Zoho Books data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getKnowledgeBase = (): string => {
    if (!integration || data.length === 0) {
      return '';
    }

    let kb = `=== ZOHO BOOKS DATA ===\n\n`;
    kb += `Organization: ${integration.organization_name}\n`;
    kb += `Data Center: ${integration.data_center}\n`;
    kb += `Currency: ${integration.currency_code}\n`;
    kb += `Last Updated: ${new Date(integration.updated_at).toLocaleString()}\n\n`;

    const dataByType = data.reduce((acc, item) => {
      if (!acc[item.data_type]) acc[item.data_type] = [];
      acc[item.data_type].push(item);
      return acc;
    }, {} as Record<string, ZohoData[]>);

    Object.entries(dataByType).forEach(([type, items]) => {
      kb += `--- ${type.toUpperCase()} (${items.length} records) ---\n`;
      
      items.slice(0, 50).forEach(item => {
        kb += JSON.stringify(item.data_json, null, 2) + '\n';
      });
      
      kb += '\n';
    });

    return kb;
  };

  const getStats = () => {
    const stats = data.reduce((acc, item) => {
      acc[item.data_type] = (acc[item.data_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: data.length,
      byType: stats,
      lastSync: data[0]?.last_synced || null,
    };
  };

  const disconnectIntegration = async () => {
    try {
      if (!integration) return;

      const { error } = await supabase
        .from('zoho_integrations')
        .update({ is_active: false })
        .eq('id', integration.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Disconnected",
        description: "Zoho Books has been disconnected",
      });

      setIntegration(null);
      setData([]);
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Disconnect failed",
        description: error instanceof Error ? error.message : "Failed to disconnect Zoho Books",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchIntegration();
  }, []);

  useEffect(() => {
    if (integration) {
      fetchZohoData();
    }
  }, [integration]);

  return {
    integration,
    data,
    loading,
    syncing,
    syncData,
    getKnowledgeBase,
    getStats,
    disconnectIntegration,
    refetch: fetchIntegration,
  };
};
