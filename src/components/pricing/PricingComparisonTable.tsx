import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ProductWithPrices } from '@/hooks/usePricingProducts';
import { PricingSupplier } from '@/hooks/usePricingSuppliers';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface PricingComparisonTableProps {
  products: ProductWithPrices[];
  suppliers: PricingSupplier[];
  onAskAI?: (product: ProductWithPrices) => void;
}

export function PricingComparisonTable({ products, suppliers, onAskAI }: PricingComparisonTableProps) {
  const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(0);

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getVarianceColor = (variance: number) => {
    if (variance < -2) return 'text-emerald-600';
    if (variance > 2) return 'text-red-500';
    return 'text-blue-500';
  };

  const getVarianceBarColor = (variance: number) => {
    if (variance < -2) return 'bg-emerald-500';
    if (variance > 2) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const getSupplierPriceForProduct = (product: ProductWithPrices, supplierId: string) => {
    const prices = product.supplier_prices?.filter(sp => sp.supplier_id === supplierId) || [];
    if (prices.length === 0) return null;
    const sorted = [...prices].sort((a, b) => 
      new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
    );
    return sorted[0];
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500 bg-white rounded-xl border border-zinc-200">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 mb-4">
          <TrendingUp className="w-8 h-8 text-zinc-400" />
        </div>
        <p className="text-lg font-semibold text-zinc-700 mb-1">No products yet</p>
        <p className="text-sm text-zinc-400">Upload a price list to get started</p>
      </div>
    );
  }

  const selectedSupplier = suppliers[selectedSupplierIndex] || suppliers[0];
  const useSegmented = suppliers.length >= 2 && suppliers.length <= 3;

  return (
    <div>
      {/* Segmented supplier tabs when 2-3 suppliers */}
      {useSegmented && (
        <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1 mb-3 w-fit">
          {suppliers.map((supplier, index) => (
            <Button
              key={supplier.id}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSupplierIndex(index)}
              className={cn(
                'h-7 px-4 text-xs font-medium rounded-md transition-all duration-200',
                selectedSupplierIndex === index
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
              )}
            >
              {supplier.name}
            </Button>
          ))}
        </div>
      )}

      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
              <TableHead className="font-semibold text-zinc-700">UPC</TableHead>
              <TableHead className="font-semibold text-zinc-700">Brand</TableHead>
              <TableHead className="font-semibold text-zinc-700">Description</TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right">Your Price</TableHead>
              {suppliers.length > 0 && (
                <TableHead className="font-semibold text-zinc-700 text-right">
                  {!useSegmented && suppliers.length > 1 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-1 px-2 font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 rounded-md"
                        >
                          {selectedSupplier?.name || 'Supplier'}
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="bg-white border border-zinc-200 shadow-lg z-50 min-w-[200px]"
                      >
                        {suppliers.map((supplier, index) => (
                          <DropdownMenuItem 
                            key={supplier.id}
                            onClick={() => setSelectedSupplierIndex(index)}
                            className={`cursor-pointer ${selectedSupplierIndex === index ? 'bg-zinc-100 font-medium' : 'hover:bg-zinc-50'}`}
                          >
                            {supplier.name}
                            {selectedSupplierIndex === index && (
                              <span className="ml-auto text-zinc-400">✓</span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    selectedSupplier?.name
                  )}
                </TableHead>
              )}
              <TableHead className="font-semibold text-zinc-700 text-right">Variance</TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right">Avail.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, rowIndex) => {
              const supplierPrice = selectedSupplier 
                ? getSupplierPriceForProduct(product, selectedSupplier.id)
                : null;
              const yourPrice = product.base_cost || 0;
              const theirPrice = supplierPrice?.price || 0;
              const variance = theirPrice > 0 ? ((yourPrice - theirPrice) / theirPrice) * 100 : 0;
              const absVariance = Math.min(Math.abs(variance), 30); // Cap at 30% for bar width

              return (
                <TableRow 
                  key={product.id}
                  className={cn(
                    'transition-colors duration-150',
                    rowIndex % 2 === 1 ? 'bg-zinc-50/50' : 'bg-white',
                    'hover:bg-zinc-100/50'
                  )}
                >
                  <TableCell className="font-mono text-sm text-zinc-600">
                    {product.upc}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium text-zinc-800 bg-zinc-50 border-zinc-300">
                      {product.brand || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-zinc-700">
                    {product.description || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {yourPrice > 0 ? formatCurrency(yourPrice) : '-'}
                  </TableCell>
                  {suppliers.length > 0 && (
                    <TableCell className="text-right text-zinc-600">
                      {theirPrice > 0 ? formatCurrency(theirPrice) : '-'}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    {theirPrice > 0 && yourPrice > 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        {/* Inline variance bar */}
                        <div className="w-12 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getVarianceBarColor(variance)}`}
                            style={{ width: `${(absVariance / 30) * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getVarianceColor(variance)}`}>
                          {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-zinc-600">
                    {supplierPrice?.availability?.toLocaleString() || '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Last updated timestamp */}
      {suppliers.length > 0 && selectedSupplier?.last_updated && (
        <div className="flex justify-end mt-2">
          <span className="text-[11px] text-zinc-400">
            Last updated {new Date(selectedSupplier.last_updated).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}
