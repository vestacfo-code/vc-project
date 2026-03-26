import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      
      {/* Main Footer */}
      <footer className="bg-white border-t py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl 2xl:max-w-screen-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8 lg:gap-12">
            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link to="/blog" className="hover:text-gray-900">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-gray-900">Careers</Link></li>
                <li><Link to="/about" className="hover:text-gray-900">About</Link></li>
              </ul>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link to="/pricing" className="hover:text-gray-900">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-gray-900">Demo</Link></li>
                <li><Link to="/integrations" className="hover:text-gray-900">Integrations</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link to="/support" className="hover:text-gray-900">Support</Link></li>
                <li><Link to="/press" className="hover:text-gray-900">Press & Media</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link to="/privacy" className="hover:text-gray-900">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-gray-900">Terms & Conditions</Link></li>
                <li><Link to="/security" className="hover:text-gray-900">Security</Link></li>
              </ul>
            </div>

            {/* Socials */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Socials</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="https://www.instagram.com/joinfinlo.ai" className="hover:text-gray-900">Instagram</a></li>
                <li><a href="https://www.linkedin.com/company/finlo-ai/posts" className="hover:text-gray-900">LinkedIn</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;