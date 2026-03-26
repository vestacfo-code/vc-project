import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Edit, DollarSign, TrendingUp, TrendingDown, BarChart3, Sparkles, Package, Calendar, Hash } from 'lucide-react';
import { ProductWithPrices } from '@/hooks/usePricingProducts';
import { usePricingSuppliers } from '@/hooks/usePricingSuppliers';
import { PriceHistoryChart } from './PriceHistoryChart';
import { useDashboardReference } from '@/contexts/DashboardReferenceContext';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProductPortfolioProps {
  product: ProductWithPrices;
  onBack: () => void;
  onEdit?: (product: ProductWithPrices) => void;
}

export function ProductPortfolio({ product, onBack, onEdit }: ProductPortfolioProps) {
  const { suppliers } = usePricingSuppliers();
  const { setPendingReference } = useDashboardReference();

  // Fetch AI recommendation for this product
  const { data: aiRec } = useQuery({
    queryKey: ['ai-recommendation', product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_ai_recommendations')
        .select('optimal_price, reasoning')
        .eq('product_id', product.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const supplierPrices = product.supplier_prices?.filter(sp => sp.price > 0) || [];
    const avgMarket = supplierPrices.length > 0
      ? supplierPrices.reduce((sum, sp) => sum + sp.price, 0) / supplierPrices.length
      : 0;
    const yourPrice = product.base_cost || 0;
    const variance = avgMarket > 0 ? ((yourPrice - avgMarket) / avgMarket) * 100 : 0;
    const optimalPrice = aiRec?.optimal_price ? Number(aiRec.optimal_price) : null;

    return { avgMarket, yourPrice, variance, optimalPrice, supplierCount: supplierPrices.length };
  }, [product, aiRec]);

  const handleAskAI = () => {
    const context = {
      id: `portfolio-${product.id}`,
      name: `${product.description || product.upc}`,
      type: 'Product Portfolio',
      icon: 'sparkles',
      data: `
Product: ${product.description || product.upc}
UPC: ${product.upc}
Brand: ${product.brand || 'Unknown'}
Your Price: $${stats.yourPrice.toFixed(2)}
Market Average: $${stats.avgMarket.toFixed(2)}
Variance: ${stats.variance > 0 ? '+' : ''}${stats.variance.toFixed(1)}%
${stats.optimalPrice ? `AI Optimal: $${stats.optimalPrice.toFixed(2)}` : ''}
Suppliers: ${stats.supplierCount}
      `.trim()
    };
    setPendingReference(context);
    window.dispatchEvent(new CustomEvent('navigateToChat'));
  };

  const supplierBreakdown = useMemo(() => {
    return (product.supplier_prices || [])
      .filter(sp => sp.price > 0)
      .map(sp => {
        const supplier = suppliers.find(s => s.id === sp.supplier_id);
        return {
          id: sp.id,
          name: supplier?.name || 'Unknown',
          price: sp.price,
          availability: sp.availability,
          date: sp.effective_date,
          currency: sp.currency || 'USD',
        };
      })
      .sort((a, b) => a.price - b.price);
  }, [product.supplier_prices, suppliers]);

  const statCards = [
    {
      label: 'Your Price',
      value: stats.yourPrice > 0 ? `$${stats.yourPrice.toFixed(2)}` : '—',
      icon: DollarSign,
      accent: 'border-t-blue-500',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Market Avg',
      value: stats.avgMarket > 0 ? `$${stats.avgMarket.toFixed(2)}` : '—',
      icon: Package,
      accent: 'border-t-zinc-400',
      iconBg: 'bg-zinc-100',
      iconColor: 'text-zinc-500',
    },
    {
      label: 'Variance',
      value: stats.avgMarket > 0 ? `${stats.variance > 0 ? '+' : ''}${stats.variance.toFixed(1)}%` : '—',
      icon: stats.variance < 0 ? TrendingDown : TrendingUp,
      accent: stats.variance < -2 ? 'border-t-emerald-500' : stats.variance > 2 ? 'border-t-red-500' : 'border-t-blue-500',
      iconBg: stats.variance < -2 ? 'bg-emerald-50' : stats.variance > 2 ? 'bg-red-50' : 'bg-blue-50',
      iconColor: stats.variance < -2 ? 'text-emerald-500' : stats.variance > 2 ? 'text-red-500' : 'text-blue-500',
    },
    {
      label: 'AI Optimal',
      value: stats.optimalPrice ? `$${stats.optimalPrice.toFixed(2)}` : '—',
      icon: Sparkles,
      accent: 'border-t-violet-500',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
    },
  ];

  return (
    <div className="flex-1 p-6 pt-16 space-y-6 overflow-y-auto bg-zinc-50">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              {product.description || product.upc}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{product.upc}</span>
              {product.brand && <span>• {product.brand}</span>}
              {product.gender && <span>• {product.gender}</span>}
              {product.size && <span>• {product.size}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleAskAI}>
            <MessageSquare className="w-4 h-4" />
            Ask AI
          </Button>
          {onEdit && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => onEdit(product)}>
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Card className={`bg-white border-zinc-200 border-t-2 ${card.accent} transition-all duration-200 hover:shadow-md`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 font-medium">{card.label}</p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Price History Chart */}
      <Card className="bg-white border-zinc-200">
        <CardContent className="p-6">
          <PriceHistoryChart
            productId={product.id}
            productName={product.description || product.upc}
            suppliers={suppliers}
            yourPrice={product.base_cost}
          />
        </CardContent>
      </Card>

      {/* Supplier Breakdown */}
      <Card className="bg-white border-zinc-200">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4">Supplier Breakdown</h3>
          {supplierBreakdown.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">No supplier prices available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left py-2 text-xs font-medium text-zinc-500">Supplier</th>
                    <th className="text-right py-2 text-xs font-medium text-zinc-500">Price</th>
                    <th className="text-right py-2 text-xs font-medium text-zinc-500">Availability</th>
                    <th className="text-right py-2 text-xs font-medium text-zinc-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierBreakdown.map((sp) => (
                    <tr key={sp.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                      <td className="py-2.5 font-medium text-zinc-900">{sp.name}</td>
                      <td className="py-2.5 text-right text-zinc-700">${sp.price.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-zinc-500">
                        {sp.availability != null ? sp.availability.toLocaleString() : '—'}
                      </td>
                      <td className="py-2.5 text-right text-zinc-400">
                        {new Date(sp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      {aiRec?.reasoning && (
        <Card className="bg-white border-zinc-200 border-l-4 border-l-violet-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-zinc-700">AI Recommendation</h3>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">{aiRec.reasoning}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
