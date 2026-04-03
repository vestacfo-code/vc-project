import { Link } from 'react-router-dom';
import { VestaLogo } from '@/components/VestaLogo';

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-10 md:gap-8">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <VestaLogo size="sm" tone="light" />
            <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-xs">
              <span className="font-semibold text-slate-800">Vesta CFO</span> — AI financial intelligence for independent
              hotels and boutique chains: KPIs, daily briefings, and alerts in one workspace.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-violet-800 text-sm mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/features" className="hover:text-amber-600 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/partners" className="hover:text-amber-600 transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-amber-600 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/docs/connect" className="hover:text-amber-600 transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link to="/docs/connect" className="hover:text-amber-600 transition-colors">
                  Connect data
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-cyan-800 text-sm mb-4">Resources</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/docs" className="hover:text-cyan-600 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-cyan-600 transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-cyan-600 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/press" className="hover:text-cyan-600 transition-colors">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-amber-800 text-sm mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/company" className="hover:text-amber-600 transition-colors">
                  About Vesta
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-600 transition-colors">
                  Leadership
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-amber-600 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-600 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 text-sm mb-4">Legal</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link to="/privacy" className="hover:text-violet-600 transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-violet-600 transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-violet-600 transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-pink-800 text-sm mb-4">Social</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <a
                  href="https://instagram.com/vestaai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-600 transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/company/vesta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-600 transition-colors"
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
