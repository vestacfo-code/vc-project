import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PricingProduct {
  id: string;
  user_id: string;
  upc: string;
  brand: string | null;
  description: string | null;
  product_type: string | null;
  size: string | null;
  gender: string | null;
  base_cost: number | null;
  cogs: number | null;
  target_margin: number | null;
  created_at: string;
  updated_at: string;
}

export interface PricingSupplierPrice {
  id: string;
  product_id: string;
  supplier_id: string;
  price: number;
  currency: string;
  country: string | null;
  availability: number | null;
  min_order_qty: number | null;
  price_type: string | null;
  effective_date: string;
  created_at: string;
  supplier?: {
    id: string;
    name: string;
    country: string | null;
    currency: string;
  };
}

export interface PricingProductAlias {
  id: string;
  alias_upc: string;
  supplier_id: string | null;
  notes: string | null;
}

export interface ProductWithPrices extends PricingProduct {
  supplier_prices: PricingSupplierPrice[];
  aliases?: PricingProductAlias[];
}

export function usePricingProducts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['pricing-products', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('pricing_products')
        .select(`
          *,
          supplier_prices:pricing_supplier_prices(
            *,
            supplier:pricing_suppliers(id, name, country, currency)
          ),
          aliases:pricing_product_aliases(id, alias_upc, supplier_id, notes)
        `)
        .order('brand', { ascending: true });

      if (error) throw error;
      return (data || []) as ProductWithPrices[];
    },
    enabled: !!user,
  });

  const upsertProduct = useMutation({
    mutationFn: async (product: Partial<PricingProduct> & { upc: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pricing_products')
        .upsert({
          ...product,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,upc',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-products'] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('pricing_products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Product not found or you do not have permission to delete it');
      }
    },
  });

  // Get unique brands for filtering
  const brands = Array.from(new Set(products?.map(p => p.brand).filter(Boolean) || [])) as string[];
  
  // Get unique countries from supplier prices
  const countries = Array.from(new Set(
    products?.flatMap(p => p.supplier_prices?.map(sp => sp.country).filter(Boolean)) || []
  )) as string[];

  return {
    products: products || [],
    isLoading,
    error,
    refetch,
    upsertProduct,
    deleteProduct,
    brands,
    countries,
  };
}
