import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PricingSupplier } from '@/hooks/usePricingSuppliers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, BarChart3 } from 'lucide-react';

interface PriceHistoryChartProps {
  productId: string;
  productName: string;
  suppliers: PricingSupplier[];
  yourPrice?: number | null;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

// Custom tooltip
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-vesta-navy/10 rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-semibold text-vesta-navy/65 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-vesta-navy/90">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-vesta-navy">${Number(entry.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export function PriceHistoryChart({ productId, productName, suppliers, yourPrice }: PriceHistoryChartProps) {
  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_supplier_prices')
        .select(`
          id, price, effective_date, supplier_id,
          supplier:pricing_suppliers(name)
        `)
        .eq('product_id', productId)
        .order('effective_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { chartData, marketAvgValue } = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return { chartData: [], marketAvgValue: null };

    const dateMap = new Map<string, Record<string, number>>();
    let totalPrice = 0, totalCount = 0;
    
    priceHistory.forEach((entry: any) => {
      const date = entry.effective_date;
      if (!dateMap.has(date)) dateMap.set(date, {});
      const supplierName = entry.supplier?.name || 'Unknown';
      dateMap.get(date)![supplierName] = entry.price;
      totalPrice += entry.price;
      totalCount++;
    });

    const overallAvg = totalCount > 0 ? parseFloat((totalPrice / totalCount).toFixed(2)) : null;

    const data = Array.from(dateMap.entries()).map(([date, prices]) => {
      const vals = Object.values(prices);
      const dateAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...prices,
        'Market Avg': parseFloat(dateAvg.toFixed(2)),
        ...(yourPrice ? { 'Your Price': yourPrice } : {}),
      };
    });

    return { chartData: data, marketAvgValue: overallAvg };
  }, [priceHistory, yourPrice]);

  const supplierNamesInHistory = useMemo(() => {
    if (!priceHistory) return [];
    const names = new Set<string>();
    priceHistory.forEach((entry: any) => {
      const name = entry.supplier?.name;
      if (name) names.add(name);
    });
    return Array.from(names);
  }, [priceHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-vesta-navy-muted" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-vesta-mist/40 mb-3">
          <BarChart3 className="w-6 h-6 text-vesta-navy-muted" />
        </div>
        <p className="text-sm font-medium text-vesta-navy/80 mb-1">No price history yet</p>
        <p className="text-xs text-vesta-navy-muted">Price history builds as you import data over time.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-vesta-navy/90 mb-4">
        Price History — {productName}
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          
          {yourPrice && (
            <Line type="monotone" dataKey="Your Price" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 3 }} strokeDasharray="5 5" />
          )}
          
          <Line type="monotone" dataKey="Market Avg" stroke="#a78bfa" strokeWidth={2.5} strokeDasharray="6 3" dot={false} />
          
          {supplierNamesInHistory.map((name, index) => (
            <Line key={name} type="monotone" dataKey={name} stroke={COLORS[index % COLORS.length]} strokeWidth={1.5} dot={{ fill: COLORS[index % COLORS.length], r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
