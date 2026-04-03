import { useState } from 'react';
import { ExternalLink, Loader2, Package, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartnerWithProducts } from '@/lib/partners/fallback-catalog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type PartnerCatalogProps = {
  partners: PartnerWithProducts[];
  isFallback: boolean;
  loading: boolean;
  /** When set, called before opening outbound links (in-app marketplace). */
  onOutboundClick?: (partnerId: string, url: string) => void | Promise<void>;
  /** Marketing = public site; app = hotel shell (same light cards as marketing). */
  tone?: 'marketing' | 'app';
  className?: string;
};

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function formatCategory(category: string) {
  return category.replace(/_/g, ' ');
}

export function PartnerCatalog({
  partners,
  isFallback,
  loading,
  onOutboundClick,
  tone = 'marketing',
  className,
}: PartnerCatalogProps) {
  const [detailPartnerId, setDetailPartnerId] = useState<string | null>(null);
  const detailPartner = detailPartnerId ? partners.find((p) => p.id === detailPartnerId) ?? null : null;

  if (loading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-24 gap-3', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-vesta-gold" />
        <p className="text-sm text-slate-500">Loading partner catalog…</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {isFallback && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Showing sample catalog (The Lotus Group). Connect Supabase and run migrations to load live partner data.
        </p>
      )}

      <ul
        className={cn(
          'grid gap-4 sm:gap-5 list-none p-0 m-0',
          'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
        )}
      >
        {partners.map((partner) => (
          <li key={partner.id} className="min-w-0">
            <article
              className={cn(
                'group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow',
                'hover:shadow-md focus-within:ring-2 focus-within:ring-violet-500/40 focus-within:ring-offset-2 focus-within:ring-offset-white'
              )}
            >
              <div className="flex flex-1 flex-col gap-3 bg-slate-50/50 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="rounded-md bg-violet-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-800">
                      {formatCategory(partner.category)}
                    </span>
                    {partner.is_featured && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                        <Sparkles className="h-3 w-3" aria-hidden />
                        Featured
                      </span>
                    )}
                  </div>
                  <Package
                    className="h-5 w-5 shrink-0 text-slate-500 opacity-40 transition-opacity group-hover:opacity-60"
                    aria-hidden
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="font-serif text-xl leading-snug sm:text-[1.35rem] text-slate-900">
                    {partner.name}
                  </h2>
                  {partner.tagline && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
                      {partner.tagline}
                    </p>
                  )}
                </div>

                <p className="mt-auto text-xs text-slate-500">
                  {partner.products.length === 0
                    ? 'Offerings coming soon'
                    : `${partner.products.length} product line${partner.products.length === 1 ? '' : 's'}`}
                </p>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 bg-white p-4">
                <button
                  type="button"
                  onClick={() => setDetailPartnerId(partner.id)}
                  className="inline-flex min-w-[8rem] flex-1 items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
                >
                  View offerings
                </button>
                {partner.website_url && (
                  <OutboundControl
                    href={partner.website_url}
                    label="Visit site"
                    onOutboundClick={onOutboundClick}
                    partnerId={partner.id}
                    variant="cardSecondary"
                    tone={tone}
                    className="shrink-0"
                  />
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>

      <Dialog open={detailPartner !== null} onOpenChange={(open) => !open && setDetailPartnerId(null)}>
        <DialogContent className="flex max-h-[min(85vh,720px)] max-w-2xl flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0">
          {detailPartner && (
            <>
              <DialogHeader className="shrink-0 space-y-3 border-b border-slate-100 p-6 pb-4 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-violet-700">
                    {formatCategory(detailPartner.category)}
                  </span>
                  {detailPartner.is_featured && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                      · Featured partner
                    </span>
                  )}
                </div>
                <DialogTitle className="pr-8 font-serif text-2xl text-slate-900 sm:text-3xl">
                  {detailPartner.name}
                </DialogTitle>
                  <DialogDescription className="!mt-2 text-base text-slate-600">
                  {detailPartner.tagline ?? "Browse product lines; outbound links open the partner's site in a new tab."}
                </DialogDescription>
                {detailPartner.description && (
                  <p className="!mt-3 text-sm leading-relaxed text-slate-600">
                    {detailPartner.description}
                  </p>
                )}
                {detailPartner.website_url && (
                  <div className="pt-2">
                    <OutboundControl
                      href={detailPartner.website_url}
                      label="Visit partner site"
                      onOutboundClick={onOutboundClick}
                      partnerId={detailPartner.id}
                      tone={tone}
                    />
                  </div>
                )}
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Product lines
                </h3>
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                  {detailPartner.products.length === 0 ? (
                    <li className="px-4 py-8 text-sm text-slate-500">
                      No product lines listed yet.
                    </li>
                  ) : (
                    detailPartner.products.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-col gap-2 bg-slate-50/30 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <h4 className="font-medium text-slate-900">{p.name}</h4>
                          {p.description && (
                            <p className="mt-1 text-sm text-slate-600">
                              {p.description}
                            </p>
                          )}
                        </div>
                        {p.product_url && (
                          <OutboundControl
                            href={p.product_url}
                            label="View"
                            onOutboundClick={onOutboundClick}
                            partnerId={detailPartner.id}
                            variant="compact"
                            tone={tone}
                            className="shrink-0"
                          />
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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
  variant?: 'default' | 'compact' | 'cardSecondary';
  tone?: 'marketing' | 'app';
  className?: string;
}) {
  const isTracked = Boolean(onOutboundClick);
  const base =
    variant === 'compact'
      ? cn('inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900')
      : variant === 'cardSecondary'
        ? cn(
            'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50'
          )
        : cn(
            'inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900 transition-colors hover:bg-violet-100'
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
