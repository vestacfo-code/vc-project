import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PricingSupplier {
  id: string;
  user_id: string;
  name: string;
  country: string | null;
  currency: string;
  column_mapping: Record<string, string> | null;
  last_updated: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ColumnMapping {
  upc?: string;
  brand?: string;
  description?: string;
  price?: string;
  availability?: string;
  minOrderQty?: string;
  priceType?: string;
}

export function usePricingSuppliers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading, error, refetch } = useQuery({
    queryKey: ['pricing-suppliers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('pricing_suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as PricingSupplier[];
    },
    enabled: !!user,
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: { name: string; country?: string; currency?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pricing_suppliers')
        .insert({
          user_id: user.id,
          name: supplier.name,
          country: supplier.country || null,
          currency: supplier.currency || 'USD',
        })
        .select()
        .single();

      if (error) throw error;
      return data as PricingSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-suppliers'] });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingSupplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('pricing_suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PricingSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-suppliers'] });
    },
  });

  const saveColumnMapping = useMutation({
    mutationFn: async ({ supplierId, mapping }: { supplierId: string; mapping: ColumnMapping }) => {
      const { error } = await supabase
        .from('pricing_suppliers')
        .update({ column_mapping: mapping as unknown as Record<string, string> })
        .eq('id', supplierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-suppliers'] });
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (supplierId: string) => {
      const { error } = await supabase
        .from('pricing_suppliers')
        .update({ is_active: false })
        .eq('id', supplierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-suppliers'] });
    },
  });

  return {
    suppliers: suppliers || [],
    isLoading,
    error,
    refetch,
    createSupplier,
    updateSupplier,
    saveColumnMapping,
    deleteSupplier,
  };
}
