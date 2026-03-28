import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { VestaLogo } from '@/components/VestaLogo';
import { morphSpringSoft } from '@/lib/motion';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/company', label: 'Company' },
  { to: '/about', label: 'Team' },
  { to: '/docs', label: 'Docs' },
  { to: '/support', label: 'Support' },
  { to: '/contact', label: 'Contact' },
] as const;

function linkActive(path: string, pathname: string) {
  if (path === '/docs') return pathname === '/docs' || pathname.startsWith('/docs/');
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={morphSpringSoft}
      className="fixed top-0 inset-x-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm shadow-slate-200/40"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        <Link to="/" className="shrink-0 flex items-center" onClick={() => setOpen(false)}>
          <VestaLogo size="md" tone="light" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map(({ to, label }) => {
            const active = linkActive(to, location.pathname);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'text-violet-800 bg-violet-50 ring-1 ring-violet-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="text-sm text-slate-600 hover:text-violet-700 transition-colors px-3 py-2 font-medium"
          >
            Sign in
          </button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={morphSpringSoft}
            onClick={() => navigate('/auth')}
            className="text-sm bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
          >
            Get started
          </motion.button>
        </div>

        <button
          type="button"
          className="lg:hidden p-2 text-slate-700 hover:text-violet-700 rounded-lg hover:bg-violet-50"
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
            className="lg:hidden overflow-hidden border-t border-slate-100 bg-white"
          >
            <nav className="px-4 py-4 flex flex-col gap-1 max-w-6xl mx-auto">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="text-slate-800 hover:text-violet-700 py-3 px-3 rounded-lg hover:bg-violet-50 text-sm font-medium"
                >
                  {label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/auth');
                  }}
                  className="text-left text-slate-600 py-2 px-3 text-sm font-medium"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/auth');
                  }}
                  className="text-left bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-3 rounded-lg text-sm"
                >
                  Get started
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
