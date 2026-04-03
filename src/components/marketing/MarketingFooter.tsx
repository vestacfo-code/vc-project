import { Link } from 'react-router-dom';
import { VestaLogo } from '@/components/VestaLogo';

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/70 bg-gradient-to-b from-slate-50/80 to-slate-100/90 backdrop-blur-xl text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-vesta-navy/10 bg-white/55 backdrop-blur-md px-5 py-4 shadow-[0_8px_30px_-12px_rgba(27,58,92,0.1)] transition-shadow hover:shadow-[0_12px_40px_-12px_rgba(27,58,92,0.14)]">
          <div>
            <p className="text-sm font-medium text-vesta-navy">Hotel SaaS from $299/mo · Starter, Growth, Enterprise</p>
            <p className="text-xs text-slate-500 mt-0.5">Aligned with our operator roadmap — see tiers and what&apos;s included.</p>
          </div>
          <Link
            to="/pricing"
            className="shrink-0 text-sm font-semibold text-vesta-gold hover:text-vesta-navy inline-flex items-center gap-1 transition-transform hover:translate-x-0.5"
          >
            View pricing →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-10 md:gap-8">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <VestaLogo size="sm" tone="light" />
            <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-xs">
              <span className="font-semibold text-slate-800">Vesta CFO</span> — AI financial intelligence for independent
              hotels and boutique chains: KPIs, daily briefings, and alerts in one workspace.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-vesta-navy text-sm mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/features" className="hover:text-vesta-gold transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/partners" className="hover:text-vesta-gold transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-vesta-gold transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/docs/connect" className="hover:text-vesta-gold transition-colors">
                  PMS &amp; data
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-vesta-navy text-sm mb-4">Resources</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/docs" className="hover:text-vesta-gold transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-vesta-gold transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-vesta-gold transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/press" className="hover:text-vesta-gold transition-colors">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-vesta-navy text-sm mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/company" className="hover:text-vesta-gold transition-colors">
                  About Vesta
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-vesta-gold transition-colors">
                  Leadership
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-vesta-gold transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-vesta-gold transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-vesta-navy text-sm mb-4">Legal</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/privacy" className="hover:text-vesta-navy transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-vesta-navy transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-vesta-navy transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-vesta-navy text-sm mb-4">Social</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <a
                  href="https://instagram.com/vestaai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-vesta-gold transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/company/vesta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-vesta-gold transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>© {year} Vesta · AI financial intelligence</span>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/privacy" className="hover:text-slate-800 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-slate-800 transition-colors">
              Terms
            </Link>
            <Link to="/security" className="hover:text-slate-800 transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
