import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Json } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Sparkles, RefreshCw, Download, Trash2, MessageSquare, AlertTriangle, Settings2, HelpCircle, X } from 'lucide-react';
import { usePricingProducts, ProductWithPrices } from '@/hooks/usePricingProducts';
import { useAuth } from '@/hooks/useAuth';
import { usePricingSuppliers } from '@/hooks/usePricingSuppliers';
import { useDashboardReference } from '@/contexts/DashboardReferenceContext';
import { VarianceRow } from './VarianceRow';
import { ManualPriceEditModal } from './ManualPriceEditModal';
import { AIPricingStrategyModal, PricingStrategy } from './AIPricingStrategyModal';
import { CardsSkeleton, TableRowsSkeleton } from './PricingSkeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client-wrapper';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnimatePresence, motion } from 'framer-motion';
import * as XLSX from 'xlsx';

// Calculate AI optimal price with strategy
function calculateOptimalPrice(
  yourCost: number | null,
  supplierPrices: number[],
  strategy?: PricingStrategy
): number | null {
  if (supplierPrices.length === 0) return null;
  
  const targetMargin = strategy?.targetMarginPercent || 15;
  const minMargin = strategy?.minMarginFloor || 10;
  const lowestSupplier = Math.min(...supplierPrices);
  const avgSupplier = supplierPrices.reduce((a, b) => a + b, 0) / supplierPrices.length;
  
  if (yourCost && yourCost > 0) {
    const minPriceForMargin = yourCost * (1 + minMargin / 100);
    const targetPrice = yourCost * (1 + targetMargin / 100);
    
    let competitorPrice: number;
    switch (strategy?.competitorStrategy) {
      case 'beat-all': competitorPrice = lowestSupplier * 0.95; break;
      case 'beat-lowest': competitorPrice = lowestSupplier * 0.98; break;
      case 'match-average': competitorPrice = avgSupplier; break;
      case 'premium': competitorPrice = avgSupplier * 1.05; break;
      default: competitorPrice = lowestSupplier * 0.98;
    }
    
    return Math.max(minPriceForMargin, Math.min(targetPrice, competitorPrice));
  }
  
  return avgSupplier * 0.95;
}

export function VarianceAnalysisDashboard() {
  const { products, isLoading, refetch, brands, deleteProduct } = usePricingProducts();
  const { suppliers } = usePricingSuppliers();
  const { setPendingReference } = useDashboardReference();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingProduct, setEditingProduct] = useState<ProductWithPrices | null>(null);
  const [priceEditModalOpen, setPriceEditModalOpen] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [pricingStrategy, setPricingStrategy] = useState<PricingStrategy | undefined>(() => {
    const saved = localStorage.getItem('ai-pricing-strategy');
    if (saved) {
      try { return JSON.parse(saved) as PricingStrategy; } catch { return undefined; }
    }
    return undefined;
  });
  const [aiRecommendations, setAiRecommendations] = useState<Record<string, { optimalPrice: number; reasoning?: string }>>({});
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const prevProductCountRef = useRef(products.length);

  // Load saved AI recommendations from database on mount
  useEffect(() => {
    const loadSavedRecommendations = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('pricing_ai_recommendations')
        .select('product_id, optimal_price, reasoning');
      if (error) { console.error('Failed to load AI recommendations:', error); return; }
      if (data && data.length > 0) {
        const loaded: Record<string, { optimalPrice: number; reasoning?: string }> = {};
        data.forEach(rec => {
          loaded[rec.product_id] = { optimalPrice: Number(rec.optimal_price), reasoning: rec.reasoning || undefined };
        });
        setAiRecommendations(loaded);
      }
    };
    loadSavedRecommendations();
  }, [user]);

  useEffect(() => {
    if (products.length > prevProductCountRef.current) setNeedsRefresh(true);
    prevProductCountRef.current = products.length;
  }, [products.length]);

  const handleRefreshAIPrices = async () => {
    if (products.length === 0) {
      toast({ title: "No Products", description: "Upload products first to get AI recommendations.", variant: "destructive" });
      return;
    }
    setIsRefreshing(true);
    try {
      const productData = products.map(p => ({
        id: p.id, upc: p.upc, brand: p.brand, description: p.description,
        your_price: p.base_cost, cogs: p.cogs,
        supplier_prices: p.supplier_prices?.map(sp => ({
          supplier_name: suppliers.find(s => s.id === sp.supplier_id)?.name || 'Unknown', price: sp.price
        })) || []
      }));
      const { data, error } = await supabase.functions.invoke('ai-pricing-strategy', {
        body: { products: productData, strategy: pricingStrategy || { targetMarginPercent: 15, competitorStrategy: 'beat-lowest', minMarginFloor: 10, customPrompt: '' } }
      });
      if (error) throw error;
      if (data?.recommendations) {
        const newRecommendations: Record<string, { optimalPrice: number; reasoning?: string }> = {};
        const dbRecords: { user_id: string; product_id: string; optimal_price: number; reasoning: string | null; strategy_used: Json }[] = [];
        data.recommendations.forEach((rec: { id: string; optimalPrice: number; reasoning?: string }) => {
          newRecommendations[rec.id] = { optimalPrice: rec.optimalPrice, reasoning: rec.reasoning };
          dbRecords.push({
            user_id: user!.id, product_id: rec.id, optimal_price: rec.optimalPrice,
            reasoning: rec.reasoning || null,
            strategy_used: JSON.parse(JSON.stringify(pricingStrategy || { targetMarginPercent: 15, competitorStrategy: 'beat-lowest', minMarginFloor: 10 }))
          });
        });
        setAiRecommendations(newRecommendations);
        if (dbRecords.length > 0) {
          const { error: saveError } = await supabase.from('pricing_ai_recommendations').upsert(dbRecords, { onConflict: 'user_id,product_id' });
          if (saveError) console.error('Failed to save AI recommendations:', saveError);
        }
        const creditsUsed = Math.round(products.length * 0.01 * 100) / 100;
        try {
          await supabase.functions.invoke('credit-manager', {
            body: { action: 'use_credits', credits_used: creditsUsed, action_type: 'ai_pricing_analysis', description: `AI pricing analysis for ${products.length} products` }
          });
        } catch (creditError) { console.warn('Credit deduction failed:', creditError); }
        toast({ title: "AI Analysis Complete", description: `Analyzed ${data.productsAnalyzed} products (${creditsUsed} credits used)` });
      } else { throw new Error("No recommendations returned from AI"); }
    } catch (error: any) {
      console.error('AI pricing error:', error);
      toast({ title: "AI Analysis Failed", description: error.message || "Could not get AI recommendations", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
      setNeedsRefresh(false);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleStrategyChange = (strategy: PricingStrategy) => {
    setPricingStrategy(strategy);
    localStorage.setItem('ai-pricing-strategy', JSON.stringify(strategy));
    setNeedsRefresh(true);
  };

  const enrichedProducts = useMemo(() => {
    const now = new Date();
    const cutoff3m = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const cutoff6m = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

    return products
      .filter((product) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch = product.upc.toLowerCase().includes(query) || product.description?.toLowerCase().includes(query) || product.brand?.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }
        if (selectedBrand !== 'all' && product.brand !== selectedBrand) return false;
        return true;
      })
      .map(product => {
        const supplierPrices = product.supplier_prices?.map(sp => sp.price).filter(p => p > 0) || [];
        const avgMarket = supplierPrices.length > 0 ? supplierPrices.reduce((a, b) => a + b, 0) / supplierPrices.length : 0;
        const lowestMarket = supplierPrices.length > 0 ? Math.min(...supplierPrices) : 0;
        const yourPrice = product.base_cost || 0;
        const variance = avgMarket > 0 ? ((yourPrice - avgMarket) / avgMarket) * 100 : 0;
        const prices3m = product.supplier_prices?.filter(sp => sp.price > 0 && new Date(sp.effective_date) >= cutoff3m) || [];
        const prices6m = product.supplier_prices?.filter(sp => sp.price > 0 && new Date(sp.effective_date) >= cutoff6m) || [];
        const avg3m = prices3m.length > 0 ? prices3m.reduce((s, sp) => s + sp.price, 0) / prices3m.length : null;
        const avg6m = prices6m.length > 0 ? prices6m.reduce((s, sp) => s + sp.price, 0) / prices6m.length : null;
        const trendDown = avg3m !== null && avg6m !== null && avg6m > 0 && ((avg3m - avg6m) / avg6m) * 100 < -5;
        const dates = product.supplier_prices?.map(sp => new Date(sp.effective_date).getTime()) || [];
        const lastReportedDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;
        const daysSinceReport = lastReportedDate ? Math.floor((now.getTime() - lastReportedDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const isStale = daysSinceReport !== null && daysSinceReport > 30;
        const aiRec = aiRecommendations[product.id];
        const optimalPrice = aiRec?.optimalPrice ?? calculateOptimalPrice(product.base_cost, supplierPrices, pricingStrategy);
        let status: 'competitive' | 'at-risk' | 'neutral' = 'neutral';
        if (yourPrice > 0 && avgMarket > 0) {
          if (variance < -2) status = 'competitive';
          else if (variance > 2) status = 'at-risk';
        }
        return { ...product, avgMarket, lowestMarket, variance, optimalPrice, aiReasoning: aiRec?.reasoning, status, avg3m, avg6m, trendDown, lastReportedDate, daysSinceReport, isStale };
      })
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  }, [products, searchQuery, selectedBrand, refreshKey, pricingStrategy, aiRecommendations]);

  // Deduplicate suppliers by name (keep first occurrence)
  const deduplicatedSuppliers = useMemo(() => {
    const seen = new Set<string>();
    return suppliers.filter(s => {
      const key = s.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [suppliers]);

  const canMakeAIRecommendations = useMemo(() => {
    const hasMultipleSuppliers = deduplicatedSuppliers.length > 1;
    const hasYourPrices = products.some(p => p.base_cost && p.base_cost > 0);
    const hasSupplierPrices = products.some(p => p.supplier_prices && p.supplier_prices.length > 0);
    return hasMultipleSuppliers || (hasYourPrices && hasSupplierPrices);
  }, [deduplicatedSuppliers, products]);

  const handleAIPriceClick = (product: ProductWithPrices & { optimalPrice: number | null }) => {
    if (!product.optimalPrice) return;
    const context = {
      id: `variance-${product.id}`, name: `AI Price: ${product.upc}`, type: 'Pricing Analysis', icon: 'sparkles',
      data: `
Product: ${product.description || product.upc}
UPC: ${product.upc}
Brand: ${product.brand || 'Unknown'}
Your Price: $${product.base_cost?.toFixed(2) || 'Not set'}
Avg Market Price: $${(product as any).avgMarket?.toFixed(2) || 'N/A'}
Lowest Market: $${(product as any).lowestMarket?.toFixed(2) || 'N/A'}
AI Recommended Price: $${product.optimalPrice.toFixed(2)}
Variance: ${(product as any).variance?.toFixed(1) || 0}%
Status: ${(product as any).status || 'neutral'}
      `.trim()
    };
    setPendingReference(context);
    window.dispatchEvent(new CustomEvent('navigateToChat'));
  };

  const handleExport = () => {
    const exportData = enrichedProducts.map(p => ({
      'UPC': p.upc, 'Brand': p.brand || '', 'Description': p.description || '',
      'Your Price': p.base_cost || '', 'Market Avg': p.avgMarket?.toFixed(2) || '',
      'Lowest Market': p.lowestMarket?.toFixed(2) || '', 'Variance %': p.variance?.toFixed(1) || '',
      'AI Optimal': p.optimalPrice?.toFixed(2) || '',
      'Status': p.status === 'competitive' ? 'Competitive' : p.status === 'at-risk' ? 'At Risk' : 'Neutral',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Variance Analysis');
    XLSX.writeFile(workbook, `variance-analysis-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Export Complete", description: `Exported ${exportData.length} products to Excel` });
  };

  const toggleRowSelection = (productId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId); else next.add(productId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === enrichedProducts.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(enrichedProducts.map(p => p.id)));
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    setIsDeleting(true);
    const idsToDelete = Array.from(selectedRows);
    const queryKey = ['pricing-products', user?.id];

    // Cancel in-flight queries to prevent them overwriting our optimistic update
    await queryClient.cancelQueries({ queryKey });

    const previousData = queryClient.getQueryData(queryKey);

    // Optimistically remove from cache
    queryClient.setQueryData(queryKey, (old: ProductWithPrices[] | undefined) =>
      old ? old.filter(p => !selectedRows.has(p.id)) : []
    );

    try {
      for (const id of idsToDelete) await deleteProduct.mutateAsync(id);
      toast({ title: "Products Deleted", description: `Deleted ${idsToDelete.length} product(s)` });
      setSelectedRows(new Set());
      setEditMode(false);
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['pricing-products'] });
    } catch (error: any) {
      // Rollback on failure
      queryClient.setQueryData(queryKey, previousData);
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => ({
    total: enrichedProducts.length,
    competitive: enrichedProducts.filter(p => p.status === 'competitive').length,
    atRisk: enrichedProducts.filter(p => p.status === 'at-risk').length,
    stale: enrichedProducts.filter(p => p.isStale).length,
    trendingDown: enrichedProducts.filter(p => p.trendDown).length,
  }), [enrichedProducts]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 pt-16 space-y-6 overflow-y-auto">
        <div>
          <div className="h-7 w-48 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-64 bg-zinc-800/50 rounded animate-pulse mt-2" />
        </div>
        <CardsSkeleton count={4} />
        <TableRowsSkeleton rows={8} cols={7} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 pt-16 space-y-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Pricing Intelligence</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {stats.total} products · {deduplicatedSuppliers.length} supplier{deduplicatedSuppliers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleRefreshAIPrices}
            disabled={isRefreshing}
            className="gap-2 relative bg-white/10 border-white/10 hover:bg-white/20 text-white"
          >
            {needsRefresh && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh AI'}
          </Button>
          <div className="flex items-center border border-white/10 rounded-lg bg-white/5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-lg rounded-r-none text-zinc-400 hover:text-white hover:bg-white/10" onClick={handleExport}>
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export Excel</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={editMode ? "default" : "ghost"} 
                    size="icon" 
                    className={`h-8 w-8 rounded-none ${editMode ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                    onClick={() => { setEditMode(!editMode); if (editMode) setSelectedRows(new Set()); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{editMode ? 'Done Editing' : 'Edit Rows'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-lg rounded-l-none text-zinc-400 hover:text-white hover:bg-white/10" onClick={() => setStrategyModalOpen(true)}>
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI Strategy</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {!canMakeAIRecommendations && !warningDismissed && (
        <div className="flex items-center justify-between bg-amber-950/30 border border-amber-800/30 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-amber-400">
              Upload your catalog & at least one supplier list for accurate AI recommendations.
            </span>
          </div>
          <button onClick={() => setWarningDismissed(true)} className="text-amber-500 hover:text-amber-300 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search UPC, product, or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:ring-0 focus:border-white/20 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-48 bg-white/5 border-white/10 text-zinc-300 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            <SelectValue placeholder="Filter by Brand" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mini Stats Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2.5 py-1">
          <span className="text-xs text-zinc-500">{stats.total}</span>
          <span className="text-xs text-zinc-400">products</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-zinc-400">{stats.competitive}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-xs text-zinc-400">{stats.atRisk}</span>
        </div>
        {stats.stale > 0 && (
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-xs text-zinc-400">{stats.stale} stale</span>
          </div>
        )}
      </div>

      {/* Table — dark, dense, scannable */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06]">
                {editMode && (
                  <th className="px-3 py-2.5 w-10">
                    <Checkbox 
                      checked={selectedRows.size === enrichedProducts.length && enrichedProducts.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="border-zinc-500 data-[state=checked]:bg-white data-[state=checked]:text-black data-[state=checked]:border-white"
                    />
                  </th>
                )}
                <th className="px-3 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">UPC</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Brand</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Description</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-right">COGS</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Your $</th>
                {deduplicatedSuppliers.map((s) => (
                  <th key={s.id} className="px-3 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-right whitespace-nowrap max-w-[100px]" title={s.name}>
                    {s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-right">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> AI
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="ml-0.5 text-zinc-600 hover:text-zinc-400">
                          <HelpCircle className="w-3 h-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 text-xs bg-zinc-900 border-white/10 text-zinc-300" side="left">
                        <div className="space-y-1.5">
                          <p className="font-medium text-zinc-200">Color Legend</p>
                          <div className="flex items-center gap-2"><span className="w-2 h-0.5 bg-emerald-400 rounded" /><span>Lowest / Below Market</span></div>
                          <div className="flex items-center gap-2"><span className="w-2 h-0.5 bg-red-400 rounded" /><span>Highest / Above Market</span></div>
                          <div className="flex items-center gap-2"><span className="w-2 h-0.5 bg-amber-400 rounded" /><span>Way Above Market (&gt;50%)</span></div>
                          <div className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-amber-400" /><span>Click AI → Chat</span></div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {enrichedProducts.length === 0 ? (
                <tr>
                  <td colSpan={100} className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 mb-3">
                      <Sparkles className="w-7 h-7 text-zinc-600" />
                    </div>
                    <p className="text-sm font-medium text-zinc-400 mb-1">No products found</p>
                    <p className="text-xs text-zinc-600">Upload your catalog to get started.</p>
                  </td>
                </tr>
              ) : (
                enrichedProducts.map((product) => (
                  <VarianceRow
                    key={product.id}
                    product={product}
                    suppliers={deduplicatedSuppliers}
                    isExpanded={expandedRow === product.id}
                    onToggle={() => setExpandedRow(expandedRow === product.id ? null : product.id)}
                    onAIPriceClick={() => handleAIPriceClick(product)}
                    onEditClick={() => { setEditingProduct(product); setPriceEditModalOpen(true); }}
                    editMode={editMode}
                    isSelected={selectedRows.has(product.id)}
                    onToggleSelect={() => toggleRowSelection(product.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {editMode && selectedRows.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 text-white rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4 border border-white/10"
          >
            <span className="text-sm font-medium">{selectedRows.size} selected</span>
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={isDeleting} className="gap-1.5">
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-white/10" onClick={() => { setSelectedRows(new Set()); setEditMode(false); }}>
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Strategy Modal */}
      <AIPricingStrategyModal
        open={strategyModalOpen}
        onOpenChange={setStrategyModalOpen}
        onSave={handleStrategyChange}
        initialStrategy={pricingStrategy}
      />

      {/* Manual Price Edit Modal */}
      <ManualPriceEditModal
        open={priceEditModalOpen}
        onOpenChange={setPriceEditModalOpen}
        product={editingProduct}
        suppliers={suppliers}
        onSuccess={() => { refetch(); setExpandedRow(null); }}
      />
    </div>
  );
}

export default VarianceAnalysisDashboard;
