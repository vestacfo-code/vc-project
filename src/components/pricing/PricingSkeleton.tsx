import { Skeleton } from '@/components/ui/skeleton';

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <Skeleton className="h-4 w-48 mb-6" />
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  );
}

export function TableRowsSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-zinc-50 border-b border-zinc-100">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" style={{ maxWidth: i === 0 ? 120 : 80 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-zinc-50 last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-4 flex-1"
              style={{ maxWidth: j === 0 ? 140 : j === 2 ? 180 : 90, opacity: 1 - i * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function BrandGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-6 w-16 mb-1" />
          <Skeleton className="h-3 w-32 mb-3" />
          <Skeleton className="h-16 w-full rounded" />
        </div>
      ))}
    </div>
  );
}

export function SectionHeader({ title, badge }: { title: string; badge?: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-zinc-700">{title}</h3>
      {badge !== undefined && (
        <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}
