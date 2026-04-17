import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown, Sparkles, BarChart3, Zap, FileText, TrendingUp, MessageSquare, ArrowRight, Menu, X, User, Settings, LogOut, CreditCard, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SettingsModal from '@/components/SettingsModal';
import { VestaBrand } from '@/components/ui/vesta-brand';

interface HeaderProps {
  variant?: 'light' | 'dark';
}

const Header = ({ variant = 'light' }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<string | undefined>(undefined);
  const productDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const userDropdownTimeout = useRef<NodeJS.Timeout | null>(null);

  const isDark = variant === 'dark';
  const logoVariant = isDark ? 'dark' : 'light';
  const textColor = isDark ? 'text-vesta-navy/60 hover:text-white' : 'text-vesta-navy/90 hover:text-vesta-navy';
  const activeTextColor = isDark ? 'text-white' : 'text-vesta-navy';

  const openSettingsToTab = (tab: string) => {
    setSettingsDefaultTab(tab);
    setIsSettingsOpen(true);
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Fetch user avatar
  useEffect(() => {
    if (user) {
      const fetchAvatar = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('user_id', user.id)
          .single();
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      };
      fetchAvatar();
    }
  }, [user]);

  const handleProductMouseEnter = () => {
    if (productDropdownTimeout.current) {
      clearTimeout(productDropdownTimeout.current);
    }
    setIsProductDropdownOpen(true);
  };

  const handleProductMouseLeave = () => {
    productDropdownTimeout.current = setTimeout(() => {
      setIsProductDropdownOpen(false);
    }, 150);
  };

  const handleUserMouseEnter = () => {
    if (userDropdownTimeout.current) {
      clearTimeout(userDropdownTimeout.current);
    }
    setIsUserDropdownOpen(true);
  };

  const handleUserMouseLeave = () => {
    userDropdownTimeout.current = setTimeout(() => {
      setIsUserDropdownOpen(false);
    }, 150);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleFeatureClick = (sectionId: string) => {
    setIsProductDropdownOpen(false);
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsUserDropdownOpen(false);
    navigate('/');
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      return names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <nav className="relative z-50 flex items-center justify-between px-4 md:px-8 py-4 md:py-5 max-w-7xl mx-auto w-full">
        {/* Logo - Left aligned */}
        <div className="flex items-center">
          <Link to="/">
            <VestaBrand size="sm" variant={logoVariant} />
          </Link>
        </div>

        {/* Nav Links - Centered */}
        <div className="hidden md:flex items-center justify-center gap-8">
          <div 
            className="relative"
            onMouseEnter={handleProductMouseEnter}
            onMouseLeave={handleProductMouseLeave}
          >
            <button className={`flex items-center gap-1 text-[15px] font-medium transition-colors ${textColor}`}>
              Product
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Mega Menu Dropdown */}
            {isProductDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-vesta-navy/8 p-6 w-[680px] animate-in fade-in-0 zoom-in-95 duration-200">
                  <div className="flex gap-8">
                    {/* Left Column - Featured */}
                    <div className="w-[240px] bg-gradient-to-br from-vesta-navy to-vesta-navy rounded-xl p-5 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-semibold text-sm">AI Financial Assistant</span>
                      </div>
                      <p className="text-vesta-navy-muted text-xs leading-relaxed mb-4">
                        Your AI CFO that knows hotel metrics — RevPAR, ADR, GOPPAR — and delivers morning briefings your team actually reads.
                      </p>
                      <button 
                        className="mt-auto text-vesta-navy/60 hover:text-white text-xs flex items-center gap-2 py-2 transition-colors"
                        onClick={() => handleFeatureClick('dashboard-preview')}
                      >
                        See it in action
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Right Column - Feature Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-1">
                      <Link 
                        to="/features"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-vesta-mist/40 transition-colors cursor-pointer col-span-2 border-b border-vesta-navy/8 mb-1 pb-3"
                      >
                        <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-vesta-navy text-sm">All features</p>
                          <p className="text-vesta-navy/65 text-xs leading-relaxed">Hotel KPIs, AI briefings, alerts &amp; more</p>
                        </div>
                      </Link>
                      <Link
                        to="/docs/features/ai-chat"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-vesta-mist/40 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-5 h-5 text-vesta-navy flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-vesta-navy text-sm">AI Daily Briefings</p>
                          <p className="text-vesta-navy/65 text-xs leading-relaxed">Morning summary: RevPAR, ADR, anomalies</p>
                        </div>
                      </Link>

                      <Link
                        to="/docs/features/analytics"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-vesta-mist/40 transition-colors cursor-pointer"
                      >
                        <BarChart3 className="w-5 h-5 text-vesta-navy flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-vesta-navy text-sm">Hotel Dashboard</p>
                          <p className="text-vesta-navy/65 text-xs leading-relaxed">RevPAR, GOPPAR, channel mix, budget vs actuals</p>
                        </div>
                      </Link>

                      <Link
                        to="/docs/connect"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-vesta-mist/40 transition-colors cursor-pointer"
                      >
                        <Zap className="w-5 h-5 text-vesta-navy flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-vesta-navy text-sm">Integrations</p>
                          <p className="text-vesta-navy/65 text-xs leading-relaxed">Mews PMS, QuickBooks, CSV import</p>
                        </div>
                      </Link>

                      <Link
                        to="/docs/features/reports"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-vesta-mist/40 transition-colors cursor-pointer"
                      >
                        <FileText className="w-5 h-5 text-vesta-navy flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-vesta-navy text-sm">Weekly Reports</p>
                          <p className="text-vesta-navy/65 text-xs leading-relaxed">Auto-generated P&amp;L and performance summaries</p>
                        </div>
                      </Link>

                      <Link
                        to="/docs/features/cashflow"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-vesta-mist/40 transition-colors cursor-pointer"
                      >
                        <TrendingUp className="w-5 h-5 text-vesta-navy flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-vesta-navy text-sm">Forecasting</p>
                          <p className="text-vesta-navy/65 text-xs leading-relaxed">Predict RevPAR, cash flow, and GOP</p>
                        </div>
                      </Link>

                      <Link
                        to="/partners"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-vesta-mist/40 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-5 h-5 text-vesta-navy flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-vesta-navy text-sm">Cost Cutter</p>
                          <p className="text-vesta-navy/65 text-xs leading-relaxed">Vendor marketplace &amp; savings recommendations</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Link
            to="/features"
            className={`text-[15px] font-medium transition-colors ${isActive('/features') ? activeTextColor : textColor}`}
          >
            Features
          </Link>
          <Link
            to="/partners"
            className={`text-[15px] font-medium transition-colors ${isActive('/partners') ? activeTextColor : textColor}`}
          >
            Partners
          </Link>
          <Link
            to="/pricing"
            className={`text-[15px] font-medium transition-colors ${isActive('/pricing') ? activeTextColor : textColor}`}
          >
            Pricing
          </Link>
          <Link
            to="/company"
            className={`text-[15px] font-medium transition-colors ${isActive('/company') ? activeTextColor : textColor}`}
          >
            Company
          </Link>
          <Link
            to="/about"
            className={`text-[15px] font-medium transition-colors ${isActive('/about') ? activeTextColor : textColor}`}
          >
            Team
          </Link>
          <Link
            to="/docs"
            className={`text-[15px] font-medium transition-colors ${isActive('/docs') ? activeTextColor : textColor}`}
          >
            Docs
          </Link>
          <Link
            to="/contact"
            className={`text-[15px] font-medium transition-colors ${isActive('/contact') ? activeTextColor : textColor}`}
          >
            Contact
          </Link>
        </div>

        {/* Auth Buttons & Mobile Menu - Right aligned */}
        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            // Logged in - Show user dropdown
            <div 
              className="relative hidden sm:block"
              onMouseEnter={handleUserMouseEnter}
              onMouseLeave={handleUserMouseLeave}
            >
              <button className="flex items-center gap-2 text-[15px] font-medium transition-colors">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-vesta-navy/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {getUserInitials()}
                  </div>
                )}
                <span className={`${isDark ? 'text-vesta-navy/60' : 'text-vesta-navy/90'}`}>My Account</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDark ? 'text-vesta-navy-muted' : 'text-vesta-navy/65'} ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown - Styled like mega menu */}
              {isUserDropdownOpen && (
                <div className="absolute top-full right-0 pt-3 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-vesta-navy/8 py-2 w-56 animate-in fade-in-0 zoom-in-95 duration-200">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-vesta-navy/8">
                      <p className="text-sm font-medium text-vesta-navy truncate">
                        {user.user_metadata?.full_name || 'Welcome'}
                      </p>
                      <p className="text-xs text-vesta-navy/65 truncate">{user.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-vesta-navy/90 hover:bg-vesta-mist/25 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-vesta-navy-muted" />
                        Dashboard
                      </Link>
                      <Link
                        to="/chat"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-vesta-navy/90 hover:bg-vesta-mist/25 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-vesta-navy-muted" />
                        AI Chat
                      </Link>
                      <button
                        onClick={() => openSettingsToTab('plan-credits')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-vesta-navy/90 hover:bg-vesta-mist/25 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-vesta-navy-muted" />
                        Subscription
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-vesta-navy/8 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-vesta-navy/90 hover:bg-vesta-mist/25 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-vesta-navy-muted" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Not logged in - Show login/signup
            <>
              <button 
                className={`hidden sm:block text-[14px] md:text-[15px] font-medium transition-colors ${textColor}`}
                onClick={() => navigate('/auth')}
              >
                Log in
              </button>
              <Button 
                className="hidden sm:flex items-center justify-center bg-vesta-navy hover:bg-vesta-navy-muted/30 text-white rounded-lg px-4 md:px-5 py-2 md:py-2.5 text-[13px] md:text-[15px] font-medium" 
                onClick={() => navigate('/auth')}
              >
                Try Vesta
              </Button>
            </>
          )}
          
          {/* Mobile Menu Button */}
          <button 
            className={`md:hidden p-2 ${isDark ? 'text-vesta-navy/60 hover:text-white' : 'text-vesta-navy/90 hover:text-vesta-navy'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between px-4 py-4 border-b border-vesta-navy/8">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              <VestaBrand size="sm" variant="light" />
            </Link>
            <button 
              className="p-2 text-vesta-navy/90 hover:text-vesta-navy"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="px-6 py-6 space-y-4">
            <Link
              to="/features"
              className="block text-lg font-medium text-vesta-navy py-3 border-b border-vesta-navy/8"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/partners"
              className="block text-lg font-medium text-vesta-navy py-3 border-b border-vesta-navy/8"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Partners
            </Link>
            <Link
              to="/pricing"
              className="block text-lg font-medium text-vesta-navy py-3 border-b border-vesta-navy/8"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              to="/company"
              className="block text-lg font-medium text-vesta-navy py-3 border-b border-vesta-navy/8"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Company
            </Link>
            <Link
              to="/about"
              className="block text-lg font-medium text-vesta-navy py-3 border-b border-vesta-navy/8"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Team
            </Link>
            <Link
              to="/docs"
              className="block text-lg font-medium text-vesta-navy py-3 border-b border-vesta-navy/8"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <Link
              to="/contact"
              className="block text-lg font-medium text-vesta-navy py-3 border-b border-vesta-navy/8"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            {user ? (
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3 py-3 border-b border-vesta-navy/8">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {getUserInitials()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-vesta-navy">{user.user_metadata?.full_name || 'Welcome'}</p>
                    <p className="text-sm text-vesta-navy/65">{user.email}</p>
                  </div>
                </div>
                <Link 
                  to="/dashboard"
                  className="block text-base font-medium text-vesta-navy/90 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/chat"
                  className="block text-base font-medium text-vesta-navy/90 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  AI Chat
                </Link>
                <button 
                  className="block text-base font-medium text-vesta-navy/90 py-2 text-left w-full"
                  onClick={() => openSettingsToTab('plan-credits')}
                >
                  Subscription & Settings
                </button>
                <Button 
                  variant="outline"
                  className="w-full border border-vesta-navy/15 text-vesta-navy/90 rounded-lg py-3 text-base font-medium mt-2"
                  onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full bg-vesta-navy hover:bg-vesta-navy-muted/30 text-white rounded-lg py-3 text-base font-medium"
                  onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}
                >
                  Try Vesta free
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border border-vesta-navy/15 text-vesta-navy/90 rounded-lg py-3 text-base font-medium"
                  onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}
                >
                  Log in
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen}
        defaultTab={settingsDefaultTab}
      />
    </>
  );
};

export default Header;
