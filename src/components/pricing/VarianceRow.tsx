import { ChevronDown, ChevronUp, Sparkles, TrendingUp, TrendingDown, Pencil } from 'lucide-react';
import { ProductWithPrices } from '@/hooks/usePricingProducts';
import { PricingSupplier } from '@/hooks/usePricingSuppliers';
import { PriceHistoryChart } from './PriceHistoryChart';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EnrichedProduct extends ProductWithPrices {
  avgMarket: number;
  lowestMarket: number;
  variance: number;
  optimalPrice: number | null;
  status: 'competitive' | 'at-risk' | 'neutral';
  avg3m?: number | null;
  avg6m?: number | null;
  trendDown?: boolean;
  isStale?: boolean;
  daysSinceReport?: number | null;
}

interface VarianceRowProps {
  product: EnrichedProduct;
  suppliers: PricingSupplier[];
  isExpanded: boolean;
  onToggle: () => void;
  onAIPriceClick?: () => void;
  onEditClick?: () => void;
  editMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function VarianceRow({ 
  product, suppliers, isExpanded, onToggle, onAIPriceClick, onEditClick,
  editMode = false, isSelected = false, onToggleSelect,
}: VarianceRowProps) {
  const getSupplierPrice = (supplierId: string): number | null => {
    const sp = product.supplier_prices?.find(s => s.supplier_id === supplierId);
    return sp?.price || null;
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-checkbox]') || (e.target as HTMLElement).closest('[data-ai-price]')) return;
    onToggle();
  };

  // Determine how supplier price compares: lowest = green, highest = red, middle = default
  const getSupplierPriceColor = (price: number): string => {
    if (price === product.lowestMarket && product.lowestMarket > 0) return 'text-emerald-400 font-semibold';
    // Check if this is highest
    const allPrices = product.supplier_prices?.map(sp => sp.price).filter(p => p > 0) || [];
    const highest = allPrices.length > 0 ? Math.max(...allPrices) : 0;
    if (price === highest && allPrices.length > 1) return 'text-red-400 font-semibold';
    return 'text-zinc-400';
  };

  return (
    <>
      <tr
        className={cn(
          'cursor-pointer transition-colors duration-100 border-l-[3px]',
          product.status === 'competitive' && 'border-l-emerald-500 hover:bg-emerald-950/20',
          product.status === 'at-risk' && 'border-l-red-500 hover:bg-red-950/20',
          product.status === 'neutral' && 'border-l-transparent hover:bg-white/[0.03]'
        )}
        onClick={handleRowClick}
      >
        {/* Checkbox in edit mode */}
        {editMode && (
          <td className="px-3 py-2.5" data-checkbox>
            <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect?.()} className="border-zinc-500 data-[state=checked]:bg-white data-[state=checked]:text-black data-[state=checked]:border-white" />
          </td>
        )}

        {/* Expand + UPC + Last Updated Flag */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <button className="p-0.5 hover:bg-white/10 rounded flex-shrink-0">
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
            </button>
            <span className="font-mono text-xs text-zinc-300 truncate" title={product.upc}>
              {product.upc}
            </span>
            {product.daysSinceReport !== null && product.daysSinceReport !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className={cn(
                      'text-[9px] font-medium px-1 py-0.5 rounded flex-shrink-0',
                      product.daysSinceReport <= 7 && 'text-emerald-400 bg-emerald-500/10',
                      product.daysSinceReport > 7 && product.daysSinceReport <= 30 && 'text-zinc-500 bg-white/5',
                      product.daysSinceReport > 30 && 'text-amber-400 bg-amber-500/10',
                    )}>
                      {product.daysSinceReport}d
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Last updated {product.daysSinceReport} day{product.daysSinceReport !== 1 ? 's' : ''} ago</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </td>

        {/* Brand + Variance badge */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    product.isStale ? 'bg-amber-500' : 'bg-emerald-500'
                  )} />
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">{product.isStale ? `Stale: ${product.daysSinceReport}d` : 'Fresh'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs font-medium text-zinc-300 bg-white/[0.06] px-1.5 py-0.5 rounded truncate max-w-[100px]" title={product.brand || 'Unknown'}>
              {product.brand || '—'}
            </span>
            {product.variance !== 0 && product.base_cost && product.base_cost > 0 && (
              <span className={cn(
                'inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold flex-shrink-0',
                product.status === 'competitive' && 'text-emerald-400',
                product.status === 'at-risk' && 'text-red-400',
                product.status === 'neutral' && 'text-zinc-500'
              )}>
                {product.status === 'competitive' ? <TrendingDown className="w-2.5 h-2.5" /> : product.status === 'at-risk' ? <TrendingUp className="w-2.5 h-2.5" /> : null}
                {product.variance > 0 ? '+' : ''}{product.variance.toFixed(1)}%
              </span>
            )}
          </div>
        </td>

        {/* Description */}
        <td className="px-3 py-2.5">
          <p className="text-xs text-zinc-500 truncate max-w-[120px]" title={product.description || ''}>
            {product.description || '—'}
          </p>
        </td>

        {/* COGS */}
        <td className="px-3 py-2.5 text-right">
          {product.cogs && product.cogs > 0 ? (
            <span className="text-xs text-zinc-500 tabular-nums">${product.cogs.toFixed(2)}</span>
          ) : (
            <span className="text-xs text-zinc-600">—</span>
          )}
        </td>

        {/* Your Price — colored by variance severity */}
        <td className="px-3 py-2.5 text-right">
          {product.base_cost && product.base_cost > 0 ? (
            <span className={cn(
              'text-sm font-bold tabular-nums',
              product.variance > 50 && 'text-amber-400',
              product.variance > 2 && product.variance <= 50 && 'text-red-400',
              product.variance <= 2 && product.variance >= -2 && 'text-zinc-200',
              product.variance < -2 && 'text-emerald-400',
            )}>
              ${product.base_cost.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-zinc-600">—</span>
          )}
        </td>

        {/* Dynamic Supplier Price columns — green = lowest, red = highest */}
        {suppliers.map((supplier) => {
          const price = getSupplierPrice(supplier.id);
          return (
            <td key={supplier.id} className="px-3 py-2.5 text-right">
              {price ? (
                <span className={cn('text-xs tabular-nums', getSupplierPriceColor(price))}>
                  ${price.toFixed(2)}
                </span>
              ) : (
                <span className="text-xs text-zinc-700">—</span>
              )}
            </td>
          );
        })}

        {/* AI Optimal */}
        <td className="px-3 py-2.5 text-right" data-ai-price>
          {product.optimalPrice ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onAIPriceClick?.(); }}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors tabular-nums"
              title="Click to discuss with AI CFO"
            >
              ${product.optimalPrice.toFixed(2)}
              <Sparkles className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-xs text-zinc-700">—</span>
          )}
        </td>
      </tr>

      {/* Expanded: Price History Chart with animation */}
      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan={100}>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.05]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-sm font-medium text-zinc-300">Price History</span>
                      {product.avg3m !== null && product.avg3m !== undefined && (
                        <span className="ml-3 text-xs text-zinc-500">
                          3M: <span className="font-medium text-zinc-400">${product.avg3m.toFixed(2)}</span>
                          {product.avg6m !== null && product.avg6m !== undefined && (
                            <> · 6M: <span className="font-medium text-zinc-400">${product.avg6m.toFixed(2)}</span></>
                          )}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onEditClick?.(); }}
                      className="sticky right-4 h-7 px-3 text-zinc-300 bg-white/10 border-white/10 hover:bg-white/20 hover:text-white"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <PriceHistoryChart 
                    productId={product.id}
                    productName={product.description || product.upc}
                    suppliers={suppliers}
                    yourPrice={product.base_cost}
                  />
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
