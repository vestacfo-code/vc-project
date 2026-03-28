import { Link } from 'react-router-dom';
import { VestaBrand } from '@/components/ui/finlo-brand';

const Footer = () => {
  return (
    <footer className="bg-black py-10 md:py-16 border-t border-white/10">
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 lg:gap-12">
          {/* Logo Column */}
          <div className="col-span-2 sm:col-span-3 md:col-span-1 mb-4 md:mb-0">
            <VestaBrand size="sm" variant="dark" className="mb-4" />
          </div>
          
          {/* Product */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Product</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/docs/connect" className="hover:text-white transition-colors">Integrations</Link></li>
              <li><a href="https://calendar.app.google/PWqhmizMxqUnRNpP9" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Book Demo</a></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Resources</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Support</Link></li>
              <li><Link to="/press" className="hover:text-white transition-colors">Press & Media</Link></li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Company</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link to="/company" className="hover:text-white transition-colors">About Vesta</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Leadership</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Legal</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
          
          {/* Socials */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Socials</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="https://instagram.com/vestaai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="https://linkedin.com/company/vesta" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Vesta. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
