import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type DateRange = '1M' | '3M' | '6M' | 'ALL';

export interface MarketDataPoint {
  date: string;
  avgPrice: number;
  [supplierName: string]: number | string;
}

export interface BrandTrend {
  brand: string;
  currentAvg: number;
  avg3m: number;
  avg6m: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercent: number;
  sparklineData: { date: string; price: number }[];
  productCount: number;
}

export interface SupplierSummary {
  id: string;
  name: string;
  avgPrice: number;
  productCount: number;
  lastUpdated: string;
  trend3m: 'up' | 'down' | 'stable';
  trendPercent: number;
  priceRange: [number, number];
}

export interface MarketOverview {
  avgMarketPrice: number;
  priceMovement: number;
  mostVolatileBrand: string;
  supplierCount: number;
  productCount: number;
  dateRange: { from: string; to: string };
}

function getDateCutoff(range: DateRange): Date | null {
  if (range === 'ALL') return null;
  const now = new Date();
  const months = range === '1M' ? 1 : range === '3M' ? 3 : 6;
  return new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
}

export function useMarketTrends(dateRange: DateRange = '6M') {
  const { user } = useAuth();

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['market-trends', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('pricing_supplier_prices')
        .select(`
          id, price, effective_date, supplier_id, product_id,
          supplier:pricing_suppliers(id, name, country, currency),
          product:pricing_products(id, upc, brand, description)
        `)
        .order('effective_date', { ascending: true });

      const cutoff = getDateCutoff(dateRange);
      if (cutoff) {
        query = query.gte('effective_date', cutoff.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const marketAverageByDate = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const dateMap = new Map<string, Map<string, number[]>>();
    
    rawData.forEach((entry: any) => {
      const date = entry.effective_date;
      const supplierName = entry.supplier?.name || 'Unknown';
      if (!dateMap.has(date)) dateMap.set(date, new Map());
      const suppliers = dateMap.get(date)!;
      if (!suppliers.has(supplierName)) suppliers.set(supplierName, []);
      suppliers.get(supplierName)!.push(entry.price);
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, suppliers]) => {
        const point: MarketDataPoint = {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          avgPrice: 0,
        };
        let total = 0, count = 0;
        suppliers.forEach((prices, name) => {
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          point[name] = parseFloat(avg.toFixed(2));
          total += avg;
          count++;
        });
        point.avgPrice = count > 0 ? parseFloat((total / count).toFixed(2)) : 0;
        return point;
      });
  }, [rawData]);

  const supplierNames = useMemo(() => {
    if (!rawData) return [];
    const names = new Set<string>();
    rawData.forEach((e: any) => {
      if (e.supplier?.name) names.add(e.supplier.name);
    });
    return Array.from(names);
  }, [rawData]);

  const brandTrends = useMemo((): BrandTrend[] => {
    if (!rawData || rawData.length === 0) return [];

    const now = new Date();
    const cutoff3m = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const cutoff6m = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

    const brandMap = new Map<string, { prices: { date: string; price: number }[]; products: Set<string> }>();

    rawData.forEach((entry: any) => {
      const brand = entry.product?.brand;
      if (!brand) return;
      if (!brandMap.has(brand)) brandMap.set(brand, { prices: [], products: new Set() });
      const b = brandMap.get(brand)!;
      b.prices.push({ date: entry.effective_date, price: entry.price });
      b.products.add(entry.product_id);
    });

    return Array.from(brandMap.entries()).map(([brand, { prices, products }]) => {
      const sorted = prices.sort((a, b) => a.date.localeCompare(b.date));
      const allAvg = sorted.reduce((s, p) => s + p.price, 0) / sorted.length;
      
      const prices3m = sorted.filter(p => new Date(p.date) >= cutoff3m);
      const prices6m = sorted.filter(p => new Date(p.date) >= cutoff6m);
      
      const avg3m = prices3m.length > 0 ? prices3m.reduce((s, p) => s + p.price, 0) / prices3m.length : allAvg;
      const avg6m = prices6m.length > 0 ? prices6m.reduce((s, p) => s + p.price, 0) / prices6m.length : allAvg;

      const trendPercent = avg6m > 0 ? ((avg3m - avg6m) / avg6m) * 100 : 0;
      const trendDirection: 'up' | 'down' | 'stable' = trendPercent > 2 ? 'up' : trendPercent < -2 ? 'down' : 'stable';

      // Build sparkline: group by date, average
      const dateAvg = new Map<string, number[]>();
      sorted.forEach(p => {
        if (!dateAvg.has(p.date)) dateAvg.set(p.date, []);
        dateAvg.get(p.date)!.push(p.price);
      });
      const sparklineData = Array.from(dateAvg.entries()).map(([date, vals]) => ({
        date,
        price: vals.reduce((a, b) => a + b, 0) / vals.length,
      }));

      return {
        brand,
        currentAvg: parseFloat(allAvg.toFixed(2)),
        avg3m: parseFloat(avg3m.toFixed(2)),
        avg6m: parseFloat(avg6m.toFixed(2)),
        trendDirection,
        trendPercent: parseFloat(trendPercent.toFixed(1)),
        sparklineData,
        productCount: products.size,
      };
    }).sort((a, b) => Math.abs(b.trendPercent) - Math.abs(a.trendPercent));
  }, [rawData]);

  const supplierSummaries = useMemo((): SupplierSummary[] => {
    if (!rawData || rawData.length === 0) return [];

    const now = new Date();
    const cutoff3m = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

    const supplierMap = new Map<string, {
      id: string; name: string; prices: number[]; products: Set<string>;
      lastDate: string; recentPrices: number[]; olderPrices: number[];
    }>();

    rawData.forEach((entry: any) => {
      const s = entry.supplier;
      if (!s) return;
      if (!supplierMap.has(s.id)) {
        supplierMap.set(s.id, {
          id: s.id, name: s.name, prices: [], products: new Set(),
          lastDate: '', recentPrices: [], olderPrices: [],
        });
      }
      const sm = supplierMap.get(s.id)!;
      sm.prices.push(entry.price);
      sm.products.add(entry.product_id);
      if (!sm.lastDate || entry.effective_date > sm.lastDate) sm.lastDate = entry.effective_date;
      
      if (new Date(entry.effective_date) >= cutoff3m) {
        sm.recentPrices.push(entry.price);
      } else {
        sm.olderPrices.push(entry.price);
      }
    });

    return Array.from(supplierMap.values()).map(sm => {
      const avgPrice = sm.prices.reduce((a, b) => a + b, 0) / sm.prices.length;
      const recentAvg = sm.recentPrices.length > 0
        ? sm.recentPrices.reduce((a, b) => a + b, 0) / sm.recentPrices.length
        : avgPrice;
      const olderAvg = sm.olderPrices.length > 0
        ? sm.olderPrices.reduce((a, b) => a + b, 0) / sm.olderPrices.length
        : avgPrice;
      
      const tp = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      const trend3m: 'up' | 'down' | 'stable' = tp > 2 ? 'up' : tp < -2 ? 'down' : 'stable';

      return {
        id: sm.id,
        name: sm.name,
        avgPrice: parseFloat(avgPrice.toFixed(2)),
        productCount: sm.products.size,
        lastUpdated: sm.lastDate,
        trend3m,
        trendPercent: parseFloat(tp.toFixed(1)),
        priceRange: [Math.min(...sm.prices), Math.max(...sm.prices)] as [number, number],
      };
    }).sort((a, b) => b.productCount - a.productCount);
  }, [rawData]);

  const overview = useMemo((): MarketOverview => {
    if (!rawData || rawData.length === 0) {
      return { avgMarketPrice: 0, priceMovement: 0, mostVolatileBrand: '—', supplierCount: 0, productCount: 0, dateRange: { from: '', to: '' } };
    }

    const allPrices = rawData.map((e: any) => e.price);
    const avgMarketPrice = allPrices.reduce((a: number, b: number) => a + b, 0) / allPrices.length;

    // Price movement: first half vs second half
    const dates = rawData.map((e: any) => e.effective_date).sort();
    const midIdx = Math.floor(dates.length / 2);
    const firstHalf = rawData.filter((e: any) => e.effective_date <= dates[midIdx]);
    const secondHalf = rawData.filter((e: any) => e.effective_date > dates[midIdx]);
    
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s: number, e: any) => s + e.price, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s: number, e: any) => s + e.price, 0) / secondHalf.length : 0;
    const priceMovement = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    // Most volatile brand
    const mostVolatileBrand = brandTrends.length > 0 ? brandTrends[0].brand : '—';

    const products = new Set(rawData.map((e: any) => e.product_id));
    const suppliers = new Set(rawData.map((e: any) => e.supplier_id));

    return {
      avgMarketPrice: parseFloat(avgMarketPrice.toFixed(2)),
      priceMovement: parseFloat(priceMovement.toFixed(1)),
      mostVolatileBrand,
      supplierCount: suppliers.size,
      productCount: products.size,
      dateRange: { from: dates[0] || '', to: dates[dates.length - 1] || '' },
    };
  }, [rawData, brandTrends]);

  return {
    marketAverageByDate,
    supplierNames,
    brandTrends,
    supplierSummaries,
    overview,
    isLoading,
  };
}
