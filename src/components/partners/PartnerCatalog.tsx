import { ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartnerWithProducts } from '@/lib/partners/fallback-catalog';

type PartnerCatalogProps = {
  partners: PartnerWithProducts[];
  isFallback: boolean;
  loading: boolean;
  /** When set, called before opening outbound links (in-app marketplace). */
  onOutboundClick?: (partnerId: string, url: string) => void | Promise<void>;
  /** Marketing = light page; app = hotel shell (dark panel). */
  tone?: 'marketing' | 'app';
  className?: string;
};

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function PartnerCatalog({
  partners,
  isFallback,
  loading,
  onOutboundClick,
  tone = 'marketing',
  className,
}: PartnerCatalogProps) {
  const isApp = tone === 'app';

  if (loading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-24 gap-3', className)}>
        <Loader2 className={cn('h-8 w-8 animate-spin', isApp ? 'text-amber-400' : 'text-violet-600')} />
        <p className={cn('text-sm', isApp ? 'text-slate-400' : 'text-slate-500')}>Loading partner catalog…</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-12', className)}>
      {isFallback && (
        <p
          className={cn(
            'text-sm rounded-xl px-4 py-3 border',
            isApp
              ? 'text-amber-200 bg-amber-500/10 border-amber-500/25'
              : 'text-amber-800 bg-amber-50 border-amber-200'
          )}
        >
          Showing sample catalog (The Lotus Group). Connect Supabase and run migrations to load live partner data.
        </p>
      )}

      {partners.map((partner) => (
        <article
          key={partner.id}
          className={cn(
            'rounded-2xl border overflow-hidden shadow-sm',
            isApp ? 'border-slate-600 bg-slate-800/50' : 'border-slate-200 bg-white'
          )}
        >
          <header
            className={cn(
              'px-6 py-5 border-b',
              isApp ? 'border-slate-600 bg-slate-800/80' : 'border-slate-100 bg-slate-50/80'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p
                  className={cn(
                    'text-xs font-mono uppercase tracking-wider mb-1',
                    isApp ? 'text-amber-400/90' : 'text-violet-700'
                  )}
                >
                  {partner.category.replace(/_/g, ' ')}
                </p>
                <h2 className={cn('font-serif text-2xl', isApp ? 'text-white' : 'text-slate-900')}>{partner.name}</h2>
                {partner.tagline && (
                  <p className={cn('mt-1', isApp ? 'text-slate-300' : 'text-slate-600')}>{partner.tagline}</p>
                )}
              </div>
              {partner.website_url && (
                <OutboundControl
                  href={partner.website_url}
                  label="Visit site"
                  onOutboundClick={onOutboundClick}
                  partnerId={partner.id}
                  tone={tone}
                  className="shrink-0"
                />
              )}
            </div>
            {partner.description && (
              <p
                className={cn(
                  'text-sm mt-4 leading-relaxed max-w-3xl',
                  isApp ? 'text-slate-300' : 'text-slate-600'
                )}
              >
                {partner.description}
              </p>
            )}
          </header>

          <ul className={cn('divide-y', isApp ? 'divide-slate-600' : 'divide-slate-100')}>
            {partner.products.length === 0 ? (
              <li className={cn('px-6 py-8 text-sm', isApp ? 'text-slate-400' : 'text-slate-500')}>
                No product lines listed yet.
              </li>
            ) : (
              partner.products.map((p) => (
                <li key={p.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className={cn('font-medium', isApp ? 'text-slate-100' : 'text-slate-900')}>{p.name}</h3>
                    {p.description && (
                      <p className={cn('text-sm mt-1', isApp ? 'text-slate-400' : 'text-slate-600')}>{p.description}</p>
                    )}
                  </div>
                  {p.product_url && (
                    <OutboundControl
                      href={p.product_url}
                      label="View"
                      onOutboundClick={onOutboundClick}
                      partnerId={partner.id}
                      variant="compact"
                      tone={tone}
                    />
                  )}
                </li>
              ))
            )}
          </ul>
        </article>
      ))}
    </div>
  );
}

function OutboundControl({
  href,
  label,
  partnerId,
  onOutboundClick,
  variant = 'default',
  tone = 'marketing',
  className,
}: {
  href: string;
  label: string;
  partnerId: string;
  onOutboundClick?: (partnerId: string, url: string) => void | Promise<void>;
  variant?: 'default' | 'compact';
  tone?: 'marketing' | 'app';
  className?: string;
}) {
  const isTracked = Boolean(onOutboundClick);
  const isApp = tone === 'app';

  const base =
    variant === 'compact'
      ? cn(
          'inline-flex items-center gap-1.5 text-sm font-medium',
          isApp ? 'text-amber-400 hover:text-amber-300' : 'text-violet-700 hover:text-violet-900'
        )
      : cn(
          'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
          isApp
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15'
            : 'border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100'
        );

  if (!isTracked) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn(base, className)}>
        {label}
        <ExternalLink className="h-4 w-4 opacity-70" />
      </a>
    );
  }

  return (
    <button
      type="button"
      className={cn(base, className)}
      onClick={async () => {
        await onOutboundClick!(partnerId, href);
        openUrl(href);
      }}
    >
      {label}
      <ExternalLink className="h-4 w-4 opacity-70" />
    </button>
  );
}
