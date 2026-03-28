import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import { Link } from 'react-router-dom';
import { VestaBrand } from '@/components/ui/finlo-brand';

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />

      {/* Footer */}
      <footer style={{ background: '#1B3A5C' }} className="py-12 lg:py-16">
        <div className="container mx-auto px-6 lg:px-8 max-w-screen-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <VestaBrand size="sm" variant="dark" className="mb-4" />
              <p className="text-white/50 text-xs leading-relaxed font-light">
                AI financial intelligence for independent and mid-size hotel operators.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#C8963E] mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#C8963E] mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/press" className="hover:text-white transition-colors">Press</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#C8963E] mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="font-mono text-[11px] text-white/30 tracking-wide">
              © 2026 Vesta · AI Financial Intelligence
            </p>
            <div className="flex gap-5">
              <a href="https://www.instagram.com/vestahotelai" className="text-white/30 hover:text-white/60 transition-colors text-xs">Instagram</a>
              <a href="https://www.linkedin.com/company/vesta-hotel-ai" className="text-white/30 hover:text-white/60 transition-colors text-xs">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
