import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Minus, ArrowUpDown, Search } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { SupplierSummary } from '@/hooks/useMarketTrends';
import { cn } from '@/lib/utils';

interface SupplierComparisonTableProps {
  suppliers: SupplierSummary[];
}

type SortKey = 'name' | 'avgPrice' | 'productCount' | 'lastUpdated' | 'trendPercent';

export function SupplierComparisonTable({ suppliers }: SupplierComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('productCount');
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === 'name'); }
  };

  const filtered = suppliers.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortKey === 'name') return mul * a.name.localeCompare(b.name);
    if (sortKey === 'avgPrice') return mul * (a.avgPrice - b.avgPrice);
    if (sortKey === 'productCount') return mul * (a.productCount - b.productCount);
    if (sortKey === 'lastUpdated') return mul * a.lastUpdated.localeCompare(b.lastUpdated);
    return mul * (a.trendPercent - b.trendPercent);
  });

  if (suppliers.length === 0) {
    return <div className="text-center py-8 text-zinc-400 text-sm">No supplier data</div>;
  }

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => handleSort(field)}
      className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors"
    >
      {label}
      <ArrowUpDown className={cn('w-3 h-3', sortKey === field ? 'text-zinc-700' : 'text-zinc-300')} />
    </button>
  );

  // Generate simple sparkline data from price range for visual
  const getSparkData = (s: SupplierSummary) => {
    const base = s.avgPrice;
    const range = s.priceRange[1] - s.priceRange[0];
    const dir = s.trend3m === 'up' ? 1 : s.trend3m === 'down' ? -1 : 0;
    return Array.from({ length: 6 }, (_, i) => ({
      v: base + (range * 0.1 * (Math.sin(i * 1.2) + dir * i * 0.15)),
    }));
  };

  return (
    <div>
      {/* Search filter */}
      <div className="relative max-w-xs mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm bg-white border-zinc-200 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
              <TableHead className="font-semibold text-zinc-700"><SortHeader label="Supplier" field="name" /></TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right"><SortHeader label="Avg Price" field="avgPrice" /></TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right"><SortHeader label="Products" field="productCount" /></TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right"><SortHeader label="Last Updated" field="lastUpdated" /></TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right"><SortHeader label="3M Trend" field="trendPercent" /></TableHead>
              <TableHead className="font-semibold text-zinc-700 text-right">Price Range</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s) => (
              <TableRow
                key={s.id}
                className={cn(
                  'transition-colors duration-150 hover:bg-zinc-50',
                  'border-l-2 border-l-transparent hover:border-l-zinc-300'
                )}
              >
                <TableCell className="font-medium text-zinc-800">{s.name}</TableCell>
                <TableCell className="text-right text-zinc-700">${s.avgPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right text-zinc-600">{s.productCount}</TableCell>
                <TableCell className="text-right text-zinc-500 text-sm">
                  {s.lastUpdated ? new Date(s.lastUpdated).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Mini sparkline */}
                    <div className="w-10 h-5">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getSparkData(s)}>
                          <Line
                            type="monotone"
                            dataKey="v"
                            stroke={s.trend3m === 'up' ? '#ef4444' : s.trend3m === 'down' ? '#10b981' : '#a1a1aa'}
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1 text-sm font-medium',
                      s.trend3m === 'up' && 'text-red-500',
                      s.trend3m === 'down' && 'text-emerald-600',
                      s.trend3m === 'stable' && 'text-zinc-400',
                    )}>
                      {s.trend3m === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                      {s.trend3m === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                      {s.trend3m === 'stable' && <Minus className="w-3.5 h-3.5" />}
                      {s.trendPercent > 0 ? '+' : ''}{s.trendPercent}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-zinc-500 text-sm">
                  ${s.priceRange[0].toFixed(2)} – ${s.priceRange[1].toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
