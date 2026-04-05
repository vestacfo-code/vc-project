import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Search, Package, ChevronRight } from 'lucide-react';
import { usePricingSuppliers } from '@/hooks/usePricingSuppliers';
import { usePricingProducts, ProductWithPrices } from '@/hooks/usePricingProducts';
import { PricingUploadDialog } from './PricingUploadDialog';
import { ProductPortfolio } from './ProductPortfolio';
import { ManualPriceEditModal } from './ManualPriceEditModal';
import { CardsSkeleton } from './PricingSkeleton';
import { motion } from 'framer-motion';

export function CompetitivePricingDashboard() {
  const { products, isLoading, refetch } = usePricingProducts();
  const { suppliers } = usePricingSuppliers();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithPrices | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductWithPrices | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.upc.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.aliases?.some(a => a.alias_upc.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [products, searchQuery]);

  // Recent products (when no search)
  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 8);
  }, [products]);

  const getSupplierCount = (product: ProductWithPrices) => {
    const uniqueSuppliers = new Set(product.supplier_prices?.map(sp => sp.supplier_id) || []);
    return uniqueSuppliers.size;
  };

  const getAvgPrice = (product: ProductWithPrices) => {
    const prices = product.supplier_prices?.filter(sp => sp.price > 0).map(sp => sp.price) || [];
    if (prices.length === 0) return null;
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  };

  // Show ProductPortfolio if a product is selected
  if (selectedProduct) {
    return (
      <ProductPortfolio
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onEdit={(p) => {
          setEditingProduct(p);
          setEditModalOpen(true);
        }}
      />
    );
  }

  const showResults = searchQuery.trim().length > 0;

  return (
    <div className="flex-1 p-6 pt-16 space-y-6 overflow-y-auto bg-vesta-mist/25">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-vesta-navy">Product Search</h1>
          <p className="text-sm text-vesta-navy/65 mt-1">
            Find any product by UPC, name, or brand
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vesta-navy-muted" />
        <Input
          placeholder="Search UPC, description, brand..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-base rounded-xl border-vesta-navy/10 bg-white shadow-sm focus-visible:ring-vesta-navy/20"
        />
      </div>

      {isLoading ? (
        <CardsSkeleton count={8} />
      ) : showResults ? (
        /* Search Results List */
        <div className="max-w-2xl mx-auto space-y-1">
          {searchResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-vesta-mist/40 mb-4">
                <Search className="w-6 h-6 text-vesta-navy-muted" />
              </div>
              <p className="text-sm font-medium text-vesta-navy/80">No products found</p>
              <p className="text-xs text-vesta-navy-muted mt-1">Try a different search term or upload new data</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-vesta-navy/65 mb-3">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
              {searchResults.map((product, i) => {
                const avgPrice = getAvgPrice(product);
                const supplierCount = getSupplierCount(product);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg bg-white border border-vesta-navy/8 hover:border-vesta-navy/10 hover:shadow-sm transition-all duration-150 text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-vesta-navy-muted">{product.upc}</span>
                          {product.brand && (
                            <span className="text-xs text-vesta-navy/65 bg-vesta-mist/25 px-1.5 py-0.5 rounded">{product.brand}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-vesta-navy mt-0.5 truncate">
                          {product.description || product.upc}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {avgPrice && (
                          <span className="text-sm font-semibold text-vesta-navy/90">${avgPrice.toFixed(2)}</span>
                        )}
                        <span className="text-xs text-vesta-navy-muted">{supplierCount} supplier{supplierCount !== 1 ? 's' : ''}</span>
                        <ChevronRight className="w-4 h-4 text-vesta-navy/60 group-hover:text-vesta-navy/65 transition-colors" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        /* Recent Products Grid */
        <div>
          <p className="text-xs font-medium text-vesta-navy/65 uppercase tracking-wide mb-3">Recent Products</p>
          {recentProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-vesta-mist/40 mb-4">
                <Package className="w-6 h-6 text-vesta-navy-muted" />
              </div>
              <p className="text-sm font-medium text-vesta-navy/80">No products yet</p>
              <p className="text-xs text-vesta-navy-muted mt-1">Upload your catalog to get started</p>
              <Button onClick={() => setUploadDialogOpen(true)} className="mt-4 gap-2" size="sm">
                <Upload className="w-4 h-4" />
                Upload Catalog
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {recentProducts.map((product, i) => {
                const avgPrice = getAvgPrice(product);
                const supplierCount = getSupplierCount(product);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      className="bg-white border-vesta-navy/8 hover:border-vesta-navy/10 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <CardContent className="p-4">
                        <p className="text-[11px] font-mono text-vesta-navy-muted">{product.upc}</p>
                        <p className="text-sm font-medium text-vesta-navy mt-1 truncate">
                          {product.brand || 'Unknown Brand'}
                        </p>
                        <p className="text-xs text-vesta-navy/65 mt-0.5 truncate">
                          {product.description || '—'}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-vesta-mist/50">
                          {avgPrice ? (
                            <span className="text-sm font-semibold text-vesta-navy/90">${avgPrice.toFixed(2)}</span>
                          ) : (
                            <span className="text-xs text-vesta-navy/60">No price</span>
                          )}
                          <span className="text-[11px] text-vesta-navy-muted">{supplierCount} supplier{supplierCount !== 1 ? 's' : ''}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <PricingUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={refetch}
      />

      {/* Edit Modal */}
      {editingProduct && (
        <ManualPriceEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          product={editingProduct}
          suppliers={suppliers}
          onSuccess={() => {
            refetch();
            // Refresh the selected product
            const updated = products.find(p => p.id === editingProduct.id);
            if (updated) setSelectedProduct(updated);
          }}
        />
      )}
    </div>
  );
}

export default CompetitivePricingDashboard;
