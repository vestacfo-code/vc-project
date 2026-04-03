import { Link } from 'react-router-dom';
import { VestaLogo } from '@/components/VestaLogo';
import { cn } from '@/lib/utils';

const BOOK_DEMO_HREF = 'https://calendar.app.google/PWqhmizMxqUnRNpP9';

export interface SiteFooterProps {
  /** Light (marketing / cream pages) or dark (content pages, docs). */
  variant?: 'light' | 'dark';
  /** Pricing callout strip (light pages only; defaults to true when variant is light). */
  showPricingCallout?: boolean;
  className?: string;
}

export function SiteFooter({
  variant = 'light',
  showPricingCallout,
  className,
}: SiteFooterProps) {
  const isLight = variant === 'light';
  const showBanner = showPricingCallout ?? isLight;
  const year = new Date().getFullYear();

  const linkMuted = isLight ? 'text-slate-600 hover:text-vesta-gold' : 'text-slate-400 hover:text-white';
  const linkLegal = isLight ? 'text-slate-600 hover:text-vesta-navy' : 'text-slate-400 hover:text-white';
  const heading = isLight ? 'font-semibold text-vesta-navy text-sm mb-4' : 'font-semibold text-white mb-4 text-sm';

  return (
    <footer
      className={cn(
        isLight
          ? 'border-t border-slate-200/70 bg-gradient-to-b from-slate-50/80 to-slate-100/90 backdrop-blur-xl text-slate-900'
          : 'border-t border-white/10 bg-black py-10 text-white md:py-16',
        className
      )}
    >
      <div className={cn('mx-auto max-w-6xl px-6', isLight ? 'py-14' : '')}>
        {showBanner && isLight && (
          <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-vesta-navy/10 bg-white/55 px-5 py-4 shadow-[0_8px_30px_-12px_rgba(27,58,92,0.1)] backdrop-blur-md transition-shadow hover:shadow-[0_12px_40px_-12px_rgba(27,58,92,0.14)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-vesta-navy">
                Hotel SaaS from $299/mo · Starter, Growth, Enterprise
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Aligned with our operator roadmap — see tiers and what&apos;s included.
              </p>
            </div>
            <Link
              to="/pricing"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-vesta-gold transition-transform hover:translate-x-0.5 hover:text-vesta-navy"
            >
              View pricing →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-6 md:gap-8">
          <div className="col-span-2 mb-4 sm:col-span-3 md:col-span-1 md:mb-0">
            <VestaLogo size="sm" tone={isLight ? 'light' : 'dark'} />
            <p
              className={cn(
                'mt-4 max-w-xs text-sm leading-relaxed',
                isLight ? 'text-slate-600' : 'text-slate-400'
              )}
            >
              <span className={cn('font-semibold', isLight ? 'text-slate-800' : 'text-white')}>
                Vesta CFO
              </span>{' '}
              — AI financial intelligence for independent hotels and boutique chains: KPIs, daily briefings, and
              alerts in one workspace.
            </p>
          </div>

          <div>
            <h3 className={heading}>Product</h3>
            <ul className={cn('space-y-3 text-sm', linkMuted)}>
              <li>
                <Link to="/features" className="transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/partners" className="transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/docs/connect" className="transition-colors">
                  PMS &amp; data
                </Link>
              </li>
              <li>
                <a href={BOOK_DEMO_HREF} target="_blank" rel="noopener noreferrer" className="transition-colors">
                  Book demo
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={heading}>Resources</h3>
            <ul className={cn('space-y-3 text-sm', linkMuted)}>
              <li>
                <Link to="/docs" className="transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/support" className="transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link to="/blog" className="transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/press" className="transition-colors">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={heading}>Company</h3>
            <ul className={cn('space-y-3 text-sm', linkMuted)}>
              <li>
                <Link to="/company" className="transition-colors">
                  About Vesta
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition-colors">
                  Leadership
                </Link>
              </li>
              <li>
                <Link to="/careers" className="transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={heading}>Legal</h3>
            <ul className={cn('space-y-3 text-sm', linkLegal)}>
              <li>
                <Link to="/privacy" className="transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/security" className="transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={heading}>Social</h3>
            <ul className={cn('space-y-3 text-sm', linkMuted)}>
              <li>
                <a
                  href="https://instagram.com/vestaai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/company/vesta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className={cn(
            'mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-xs sm:flex-row',
            isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-500'
          )}
        >
          <span>© {year} Vesta · Vesta CFO</span>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              to="/privacy"
              className={isLight ? 'transition-colors hover:text-slate-800' : 'transition-colors hover:text-white'}
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className={isLight ? 'transition-colors hover:text-slate-800' : 'transition-colors hover:text-white'}
            >
              Terms
            </Link>
            <Link
              to="/security"
              className={isLight ? 'transition-colors hover:text-slate-800' : 'transition-colors hover:text-white'}
            >
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
