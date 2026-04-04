import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Small floating Vesta mark.
 * Sits bottom-left so it does not overlap {@link FloatingChatbot} (bottom-right).
 */
export function VestaSiteBadge({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      data-vesta-site-badge
      aria-label="Vesta CFO — home"
      className={cn(
        'fixed bottom-5 left-5 z-40 flex max-w-[min(100vw-2.5rem,16rem)] items-center gap-2 rounded-2xl border border-white/15 bg-vesta-navy/90 px-3 py-2 shadow-lg backdrop-blur-md transition-opacity hover:opacity-95 sm:bottom-6 sm:left-6',
        className
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vesta-gold/90 text-vesta-navy">
        <Building2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 text-left leading-tight">
        <span className="block truncate font-serif text-sm font-semibold text-white">Vesta CFO</span>
        <span className="block truncate text-[10px] font-medium uppercase tracking-wider text-white/50">
          Hotel financial AI
        </span>
      </span>
    </Link>
  );
}
