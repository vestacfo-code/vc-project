import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Plus, X, Link2 } from 'lucide-react';
import { ProductWithPrices } from '@/hooks/usePricingProducts';
import { PricingSupplier } from '@/hooks/usePricingSuppliers';
import { supabase } from '@/lib/supabase-client-wrapper';
import { useToast } from '@/hooks/use-toast';

interface ManualPriceEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithPrices | null;
  suppliers: PricingSupplier[];
  onSuccess: () => void;
}

interface PriceEntry {
  supplierId: string;
  supplierName: string;
  price: string;
  existingPriceId?: string;
}

interface AliasEntry {
  id?: string;
  alias_upc: string;
  supplier_id: string | null;
  isNew?: boolean;
}

export function ManualPriceEditModal({ 
  open, 
  onOpenChange, 
  product, 
  suppliers,
  onSuccess 
}: ManualPriceEditModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [yourPrice, setYourPrice] = useState('');
  const [targetMargin, setTargetMargin] = useState('');
  const [supplierPrices, setSupplierPrices] = useState<PriceEntry[]>([]);
  const [aliases, setAliases] = useState<AliasEntry[]>([]);
  const [newAliasUpc, setNewAliasUpc] = useState('');

  // Initialize form when product changes
  useEffect(() => {
    if (product && open) {
      setYourPrice(product.base_cost?.toFixed(2) || '');
      setTargetMargin(product.target_margin?.toString() || '15');
      
      const prices: PriceEntry[] = suppliers.map(supplier => {
        const existingPrice = product.supplier_prices?.find(sp => sp.supplier_id === supplier.id);
        return {
          supplierId: supplier.id,
          supplierName: supplier.name,
          price: existingPrice?.price?.toFixed(2) || '',
          existingPriceId: existingPrice?.id,
        };
      });
      setSupplierPrices(prices);
      loadAliases(product.id);
    }
  }, [product, suppliers, open]);

  const loadAliases = async (productId: string) => {
    const { data, error } = await supabase
      .from('pricing_product_aliases')
      .select('id, alias_upc, supplier_id')
      .eq('product_id', productId);
    if (!error && data) {
      setAliases(data.map(a => ({ id: a.id, alias_upc: a.alias_upc, supplier_id: a.supplier_id })));
    }
  };

  const handleAddAlias = () => {
    if (!newAliasUpc.trim()) return;
    setAliases(prev => [...prev, { alias_upc: newAliasUpc.trim(), supplier_id: null, isNew: true }]);
    setNewAliasUpc('');
  };

  const handleRemoveAlias = async (index: number) => {
    const alias = aliases[index];
    if (alias.id) {
      await supabase.from('pricing_product_aliases').delete().eq('id', alias.id);
    }
    setAliases(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!product) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const productUpdate: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (yourPrice.trim()) {
        productUpdate.base_cost = parseFloat(yourPrice) || null;
      }
      if (targetMargin.trim()) {
        productUpdate.target_margin = parseFloat(targetMargin) || null;
      }

      const { error: productError } = await supabase
        .from('pricing_products')
        .update(productUpdate)
        .eq('id', product.id);

      if (productError) throw productError;

      const today = new Date().toISOString().split('T')[0];
      
      for (const entry of supplierPrices) {
        if (!entry.price.trim()) continue;
        const priceValue = parseFloat(entry.price);
        if (isNaN(priceValue)) continue;

        const { error: priceError } = await supabase
          .from('pricing_supplier_prices')
          .upsert({
            product_id: product.id,
            supplier_id: entry.supplierId,
            price: priceValue,
            effective_date: today,
            country: 'default',
          }, {
            onConflict: 'product_id,supplier_id,country,effective_date',
          });

        if (priceError) {
          console.error('Price update error:', priceError);
        }
      }

      const newAliases = aliases.filter(a => a.isNew);
      if (newAliases.length > 0) {
        const { error: aliasError } = await supabase
          .from('pricing_product_aliases')
          .insert(newAliases.map(a => ({
            product_id: product.id,
            alias_upc: a.alias_upc,
            supplier_id: a.supplier_id,
          })));
        if (aliasError) console.error('Alias save error:', aliasError);
      }

      toast({
        title: "Prices Updated",
        description: "Manual price overrides saved successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSupplierPriceChange = (supplierId: string, value: string) => {
    setSupplierPrices(prev => 
      prev.map(p => 
        p.supplierId === supplierId ? { ...p, price: value } : p
      )
    );
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 text-zinc-100 sm:rounded-xl shadow-2xl [&>button]:top-4 [&>button]:left-4 [&>button]:right-auto [&>button]:text-zinc-500 [&>button]:hover:text-white focus-visible:[&>button]:ring-0">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold text-white">
            Edit Prices
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            Manually override prices for this product
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto">
          {/* Product Info */}
          <div className="p-3 rounded-lg bg-[#1a1a1a] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-500 bg-transparent font-mono">
                {product.upc}
              </Badge>
              {product.brand && (
                <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-500 bg-transparent">
                  {product.brand}
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-snug">
              {product.description || 'No description'}
            </p>
          </div>

          {/* Your Prices */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Pricing</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-500 text-[10px] uppercase tracking-wider">Your Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={yourPrice}
                  onChange={(e) => setYourPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-9 bg-[#1a1a1a] border-white/[0.06] text-white placeholder:text-zinc-700 focus:border-white/20 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-500 text-[10px] uppercase tracking-wider">Target Margin (%)</Label>
                <Input
                  type="number"
                  step="1"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  placeholder="15"
                  className="h-9 bg-[#1a1a1a] border-white/[0.06] text-white placeholder:text-zinc-700 focus:border-white/20 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>

          {/* Supplier Prices */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Supplier Prices</h3>
            
            <div className="space-y-2">
              {supplierPrices.map((entry) => (
                <div key={entry.supplierId} className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500 min-w-[100px] truncate" title={entry.supplierName}>
                    {entry.supplierName}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={entry.price}
                    onChange={(e) => handleSupplierPriceChange(entry.supplierId, e.target.value)}
                    placeholder="0.00"
                    className="flex-1 h-8 bg-[#1a1a1a] border-white/[0.06] text-white placeholder:text-zinc-700 focus:border-white/20 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs"
                  />
                </div>
              ))}
              
              {supplierPrices.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-3">
                  No suppliers configured.
                </p>
              )}
            </div>
          </div>

          {/* UPC Aliases */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3 h-3" />
              UPC Aliases
            </h3>
            <p className="text-[10px] text-zinc-600">Map different supplier UPCs to this product</p>
            
            {aliases.length > 0 && (
              <div className="space-y-1">
                {aliases.map((alias, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#1a1a1a] border border-white/[0.06] rounded-md px-2.5 py-1.5">
                    <span className="font-mono text-[11px] text-zinc-400 flex-1">{alias.alias_upc}</span>
                    {alias.isNew && <span className="text-[9px] text-amber-500 font-medium">NEW</span>}
                    <button
                      onClick={() => handleRemoveAlias(idx)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Input
                value={newAliasUpc}
                onChange={(e) => setNewAliasUpc(e.target.value)}
                placeholder="Enter alternate UPC..."
                className="flex-1 h-8 bg-[#1a1a1a] border-white/[0.06] text-white placeholder:text-zinc-700 focus:border-white/20 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleAddAlias()}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddAlias}
                disabled={!newAliasUpc.trim()}
                className="h-8 px-2.5 text-zinc-500 hover:text-white hover:bg-white/10"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.06]">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-black hover:bg-zinc-200"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
