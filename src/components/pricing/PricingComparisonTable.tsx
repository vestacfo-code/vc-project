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
      <div className="text-center py-16 text-vesta-navy/65 bg-white rounded-xl border border-vesta-navy/10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vesta-mist/40 mb-4">
          <TrendingUp className="w-8 h-8 text-vesta-navy/65" />
        </div>
        <p className="text-lg font-semibold text-vesta-navy/90 mb-1">No products yet</p>
        <p className="text-sm text-vesta-navy/65">Upload a price list to get started</p>
      </div>
    );
  }

  const selectedSupplier = suppliers[selectedSupplierIndex] || suppliers[0];
  const useSegmented = suppliers.length >= 2 && suppliers.length <= 3;

  return (
    <div>
      {/* Segmented supplier tabs when 2-3 suppliers */}
      {useSegmented && (
        <div className="flex items-center gap-1 bg-white border border-vesta-navy/10 rounded-lg p-1 mb-3 w-fit">
          {suppliers.map((supplier, index) => (
            <Button
              key={supplier.id}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSupplierIndex(index)}
              className={cn(
                'h-7 px-4 text-xs font-medium rounded-md transition-all duration-200',
                selectedSupplierIndex === index
                  ? 'bg-vesta-gold/20 text-vesta-navy shadow-sm ring-1 ring-vesta-gold/35 hover:bg-vesta-gold/25'
                  : 'text-vesta-navy/65 hover:bg-vesta-mist/25 hover:text-vesta-navy/90'
              )}
            >
              {supplier.name}
            </Button>
          ))}
        </div>
      )}

      <div className="border border-vesta-navy/10 rounded-xl overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-vesta-mist/25 hover:bg-vesta-mist/25">
              <TableHead className="font-semibold text-vesta-navy/90">UPC</TableHead>
              <TableHead className="font-semibold text-vesta-navy/90">Brand</TableHead>
              <TableHead className="font-semibold text-vesta-navy/90">Description</TableHead>
              <TableHead className="font-semibold text-vesta-navy/90 text-right">Your Price</TableHead>
              {suppliers.length > 0 && (
                <TableHead className="font-semibold text-vesta-navy/90 text-right">
                  {!useSegmented && suppliers.length > 1 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-1 px-2 font-semibold text-vesta-navy/90 hover:bg-vesta-mist/40 hover:text-vesta-navy rounded-md"
                        >
                          {selectedSupplier?.name || 'Supplier'}
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="bg-white border border-vesta-navy/10 shadow-lg z-50 min-w-[200px]"
                      >
                        {suppliers.map((supplier, index) => (
                          <DropdownMenuItem 
                            key={supplier.id}
                            onClick={() => setSelectedSupplierIndex(index)}
                            className={`cursor-pointer ${selectedSupplierIndex === index ? 'bg-vesta-mist/40 font-medium' : 'hover:bg-vesta-mist/25'}`}
                          >
                            {supplier.name}
                            {selectedSupplierIndex === index && (
                              <span className="ml-auto text-vesta-navy/65">✓</span>
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
              <TableHead className="font-semibold text-vesta-navy/90 text-right">Variance</TableHead>
              <TableHead className="font-semibold text-vesta-navy/90 text-right">Avail.</TableHead>
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
                    rowIndex % 2 === 1 ? 'bg-vesta-mist/50' : 'bg-white',
                    'hover:bg-vesta-mist/50'
                  )}
                >
                  <TableCell className="font-mono text-sm text-vesta-navy/80">
                    {product.upc}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium text-vesta-navy bg-vesta-mist/25 border-vesta-navy/15">
                      {product.brand || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-vesta-navy/90">
                    {product.description || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {yourPrice > 0 ? formatCurrency(yourPrice) : '-'}
                  </TableCell>
                  {suppliers.length > 0 && (
                    <TableCell className="text-right text-vesta-navy/80">
                      {theirPrice > 0 ? formatCurrency(theirPrice) : '-'}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    {theirPrice > 0 && yourPrice > 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        {/* Inline variance bar */}
                        <div className="w-12 h-1.5 rounded-full bg-vesta-mist/40 overflow-hidden">
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
                      <span className="text-vesta-navy/65">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-vesta-navy/80">
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
          <span className="text-[11px] text-vesta-navy/65">
            Last updated {new Date(selectedSupplier.last_updated).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}
