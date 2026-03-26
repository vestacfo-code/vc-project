import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WaveIntegration {
  id: string;
  user_id: string;
  business_id: string;
  business_name: string;
  currency: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WaveData {
  id: string;
  data_type: string;
  wave_id: string;
  data_json: any;
  last_synced: string;
}

export const useWaveIntegration = () => {
  const [integration, setIntegration] = useState<WaveIntegration | null>(null);
  const [data, setData] = useState<WaveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchIntegration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: integrationData, error } = await supabase
        .from('wave_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching Wave integration:', error);
        return;
      }

      setIntegration(integrationData);
    } catch (error) {
      console.error('Error fetching Wave integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaveData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !integration) return;

      const { data: waveData, error } = await supabase
        .from('wave_data')
        .select('*')
        .eq('user_id', user.id)
        .order('last_synced', { ascending: false });

      if (error) {
        console.error('Error fetching Wave data:', error);
        return;
      }

      setData(waveData || []);
    } catch (error) {
      console.error('Error fetching Wave data:', error);
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      
      const { error } = await supabase.functions.invoke('wave-sync', {
        method: 'POST',
      });

      if (error) {
        toast({
          title: "Sync failed",
          description: error.message || "Failed to sync Wave data",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sync complete",
        description: "Your Wave data has been synced successfully",
      });

      await fetchWaveData();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getKnowledgeBase = (): string => {
    if (!integration || data.length === 0) {
      return 'No Wave Accounting data available.';
    }

    const customers = data.filter(d => d.data_type === 'customer');
    const invoices = data.filter(d => d.data_type === 'invoice');
    const products = data.filter(d => d.data_type === 'product');

    let knowledgeBase = `=== WAVE ACCOUNTING DATA ===\n\n`;
    knowledgeBase += `Business: ${integration.business_name}\n`;
    knowledgeBase += `Currency: ${integration.currency || 'N/A'}\n\n`;

    knowledgeBase += `--- CUSTOMERS (${customers.length}) ---\n`;
    customers.slice(0, 50).forEach(c => {
      const customer = c.data_json;
      knowledgeBase += `• ${customer.name} (${customer.email || 'No email'})\n`;
    });

    knowledgeBase += `\n--- INVOICES (${invoices.length}) ---\n`;
    invoices.slice(0, 50).forEach(i => {
      const invoice = i.data_json;
      knowledgeBase += `• Invoice #${invoice.invoiceNumber}: ${invoice.customer?.name || 'Unknown'} - $${invoice.total} (${invoice.status})\n`;
    });

    knowledgeBase += `\n--- PRODUCTS (${products.length}) ---\n`;
    products.slice(0, 50).forEach(p => {
      const product = p.data_json;
      knowledgeBase += `• ${product.name}: $${product.unitPrice}\n`;
    });

    return knowledgeBase;
  };

  const getStats = () => {
    return {
      totalItems: data.length,
      customers: data.filter(d => d.data_type === 'customer').length,
      invoices: data.filter(d => d.data_type === 'invoice').length,
      products: data.filter(d => d.data_type === 'product').length,
    };
  };

  const disconnectIntegration = async () => {
    try {
      if (!integration) return;

      const { error } = await supabase
        .from('wave_integrations')
        .update({ is_active: false })
        .eq('id', integration.id);

      if (error) throw error;

      setIntegration(null);
      setData([]);
      
      toast({
        title: "Disconnected",
        description: "Wave Accounting has been disconnected",
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Wave Accounting",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchIntegration();
  }, []);

  useEffect(() => {
    if (integration) {
      fetchWaveData();
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
    refreshAfterOAuth: fetchIntegration,
    disconnectIntegration,
  };
};
