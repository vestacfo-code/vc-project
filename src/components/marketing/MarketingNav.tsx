import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import { VestaLogo } from '@/components/VestaLogo';
import { morphSpringSoft } from '@/lib/motion';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/features', label: 'Features' },
  { to: '/partners', label: 'Partners' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/company', label: 'Company' },
  { to: '/about', label: 'Team' },
  { to: '/docs', label: 'Docs' },
  { to: '/contact', label: 'Contact' },
] as const;

function linkActive(path: string, pathname: string) {
  if (path === '/docs') return pathname === '/docs' || pathname.startsWith('/docs/');
  return pathname === path || pathname.startsWith(`${path}/`);
}

export type MarketingNavVariant = 'light' | 'dark';

interface MarketingNavProps {
  /** `dark` for video / black hero (e.g. landing). */
  variant?: MarketingNavVariant;
}

export function MarketingNav({ variant = 'light' }: MarketingNavProps) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = variant === 'dark';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const primaryLinks = navLinks.slice(0, 4);
  const moreLinks = navLinks.slice(4);

  const barBase =
    'w-full max-w-6xl rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 ease-out';

  const barLight = cn(
    barBase,
    'border border-vesta-navy/10 shadow-md',
    scrolled
      ? 'bg-vesta-cream/95 backdrop-blur-2xl shadow-lg shadow-vesta-navy/[0.06]'
      : 'bg-vesta-cream/90 backdrop-blur-xl shadow-md shadow-vesta-navy/[0.04]'
  );

  const barDark = cn(
    barBase,
    'border shadow-2xl',
    scrolled
      ? 'bg-vesta-navy/80 backdrop-blur-2xl border-white/20 shadow-black/50'
      : 'bg-black/55 backdrop-blur-2xl border-white/15 shadow-black/40'
  );

  const linkClass = (active: boolean) =>
    cn(
      'relative px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200',
      'hover:-translate-y-0.5 active:translate-y-0',
      isDark
        ? active
          ? 'text-white bg-white/15 ring-1 ring-white/20 shadow-[0_0_24px_-4px_rgba(251,191,36,0.35)]'
          : 'text-white/90 hover:text-white hover:bg-white/10 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]'
        : active
          ? 'text-vesta-navy bg-vesta-mist/90 ring-1 ring-vesta-navy/15 shadow-sm'
          : 'text-vesta-navy/80 hover:text-vesta-navy hover:bg-vesta-mist/55 hover:shadow-sm'
    );

  const signInClass = isDark
    ? 'text-white/90 hover:text-white px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all hover:bg-white/10 hover:-translate-y-0.5'
    : 'text-vesta-navy/80 hover:text-vesta-navy px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all hover:bg-vesta-mist/50 hover:-translate-y-0.5';

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={morphSpringSoft}
      className="fixed top-0 inset-x-0 z-50 pointer-events-none px-3 sm:px-6 pt-3 sm:pt-4"
    >
      <div className="relative mx-auto max-w-6xl pointer-events-auto">
      <div className={cn(isDark ? barDark : barLight)}>
        <Link to="/" className="shrink-0 flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <span className="transition-transform duration-200 group-hover:scale-[1.02]">
            <VestaLogo size="md" tone={isDark ? 'dark' : 'light'} />
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 flex-1 justify-center min-w-0">
          {primaryLinks.map(({ to, label }) => {
            const active = linkActive(to, location.pathname);
            return (
              <Link key={to} to={to} className={linkClass(active)}>
                {label}
              </Link>
            );
          })}
          <div
            className="relative"
            onMouseEnter={() => setMoreOpen(true)}
            onMouseLeave={() => setMoreOpen(false)}
          >
            <button
              type="button"
              className={cn(
                'flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 hover:-translate-y-0.5',
                isDark
                  ? 'text-white/90 hover:text-white hover:bg-white/10'
                  : 'text-vesta-navy/80 hover:text-vesta-navy hover:bg-vesta-mist/55 hover:shadow-sm'
              )}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
            >
              More
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', moreOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    'absolute right-0 top-full mt-1 py-2 min-w-[11rem] rounded-xl border shadow-xl z-50',
                    isDark
                      ? 'bg-vesta-navy/90 backdrop-blur-2xl border-white/15'
                      : 'border-vesta-navy/10 bg-vesta-cream/95 backdrop-blur-2xl'
                  )}
                  role="menu"
                >
                  {moreLinks.map(({ to, label }) => {
                    const active = linkActive(to, location.pathname);
                    return (
                      <Link
                        key={to}
                        to={to}
                        role="menuitem"
                        className={cn(
                          'block px-4 py-2.5 text-sm transition-colors',
                          isDark
                            ? active
                              ? 'text-vesta-gold bg-white/10'
                              : 'text-white/80 hover:text-white hover:bg-white/10'
                            : active
                              ? 'text-vesta-navy bg-vesta-mist/70'
                              : 'text-vesta-navy/90 hover:bg-vesta-mist/40'
                        )}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={() => navigate('/auth')} className={signInClass}>
            Sign in
          </button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={morphSpringSoft}
            onClick={() => navigate('/auth')}
            className={cn(
              'text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl shadow-lg transition-shadow',
              isDark
                ? 'bg-vesta-gold hover:bg-vesta-gold/90 text-vesta-navy shadow-black/20'
                : 'bg-vesta-gold hover:bg-vesta-gold/90 text-vesta-navy shadow-vesta-navy/10'
            )}
          >
            Get started
          </motion.button>
        </div>

        <button
          type="button"
          className={cn(
            'lg:hidden p-2 rounded-xl transition-all',
            isDark
              ? 'text-white/80 hover:text-white hover:bg-white/10'
              : 'text-vesta-navy/90 hover:bg-vesta-mist/60'
          )}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'lg:hidden overflow-hidden mt-2 rounded-2xl border',
              isDark
                ? 'bg-vesta-navy/92 backdrop-blur-2xl border-white/12 shadow-2xl'
                : 'border border-vesta-navy/10 bg-vesta-cream/95 backdrop-blur-2xl shadow-lg shadow-vesta-navy/[0.06]'
            )}
          >
            <nav className="px-3 py-3 flex flex-col gap-0.5 max-h-[min(70vh,520px)] overflow-y-auto">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'py-3 px-3 rounded-xl text-sm font-medium transition-all hover:-translate-y-px',
                    isDark
                      ? 'text-white/85 hover:text-white hover:bg-white/10'
                      : 'text-vesta-navy hover:text-vesta-navy hover:bg-vesta-mist/50'
                  )}
                >
                  {label}
                </Link>
              ))}
              <div
                className={cn(
                  'flex flex-col gap-2 pt-3 mt-2 border-t',
                  isDark ? 'border-white/10' : 'border-vesta-navy/10'
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/auth');
                  }}
                  className={cn(
                    'text-left py-2 px-3 text-sm font-medium rounded-xl transition-colors',
                    isDark ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-vesta-navy/80 hover:bg-vesta-mist/40'
                  )}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/auth');
                  }}
                  className="text-left bg-vesta-gold hover:bg-vesta-gold/90 text-vesta-navy font-semibold py-3 px-3 rounded-xl text-sm shadow-md"
                >
                  Get started
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.header>
  );
}
