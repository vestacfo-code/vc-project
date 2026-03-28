import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown, Sparkles, BarChart3, Zap, FileText, TrendingUp, MessageSquare, ArrowRight, Menu, X, User, Settings, LogOut, CreditCard, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SettingsModal from '@/components/SettingsModal';
import { VestaBrand } from '@/components/ui/finlo-brand';

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
  const textColor = isDark ? 'text-slate-300 hover:text-white' : 'text-gray-700 hover:text-gray-900';
  const activeTextColor = isDark ? 'text-white' : 'text-gray-900';

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
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-[680px] animate-in fade-in-0 zoom-in-95 duration-200">
                  <div className="flex gap-8">
                    {/* Left Column - Featured */}
                    <div className="w-[240px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-semibold text-sm">AI Financial Assistant</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed mb-4">
                        Your intelligent CFO that understands your business data and delivers actionable insights.
                      </p>
                      <button 
                        className="mt-auto text-slate-300 hover:text-white text-xs flex items-center gap-2 py-2 transition-colors"
                        onClick={() => handleFeatureClick('dashboard-preview')}
                      >
                        See it in action
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Right Column - Feature Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-1">
                      <Link 
                        to="/docs/features/ai-chat"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-5 h-5 text-[#1a237e] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">AI Insights</p>
                          <p className="text-gray-500 text-xs leading-relaxed">Instant answers about your financial data</p>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/docs/features/analytics"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <BarChart3 className="w-5 h-5 text-[#1a237e] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Analytics</p>
                          <p className="text-gray-500 text-xs leading-relaxed">Visual dashboards and trend analysis</p>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/docs/connect"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <Zap className="w-5 h-5 text-[#1a237e] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Integrations</p>
                          <p className="text-gray-500 text-xs leading-relaxed">Connect QuickBooks, Xero, and more</p>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/docs/reports"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <FileText className="w-5 h-5 text-[#1a237e] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Reports</p>
                          <p className="text-gray-500 text-xs leading-relaxed">Automated financial reports</p>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/docs/features/cash-flow"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <TrendingUp className="w-5 h-5 text-[#1a237e] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Forecasting</p>
                          <p className="text-gray-500 text-xs leading-relaxed">Predict cash flow and revenue</p>
                        </div>
                      </Link>
                      
                      <Link 
                        to="/auth"
                        onClick={() => setIsProductDropdownOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-5 h-5 text-[#1a237e] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Chat</p>
                          <p className="text-gray-500 text-xs leading-relaxed">Natural language queries</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Link 
            to="/pricing" 
            className={`text-[15px] font-medium transition-colors ${isActive('/pricing') ? activeTextColor : textColor}`}
          >
            Pricing
          </Link>
          <Link 
            to="/about" 
            className={`text-[15px] font-medium transition-colors ${isActive('/about') ? activeTextColor : textColor}`}
          >
            About
          </Link>
          <Link 
            to="/docs/connect" 
            className={`text-[15px] font-medium transition-colors ${isActive('/docs/connect') ? activeTextColor : textColor}`}
          >
            Integrations
          </Link>
          <Link 
            to="/docs" 
            className={`text-[15px] font-medium transition-colors ${isActive('/docs') ? activeTextColor : textColor}`}
          >
            Docs
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
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {getUserInitials()}
                  </div>
                )}
                <span className={`${isDark ? 'text-slate-300' : 'text-gray-700'}`}>My Account</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDark ? 'text-slate-400' : 'text-gray-500'} ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown - Styled like mega menu */}
              {isUserDropdownOpen && (
                <div className="absolute top-full right-0 pt-3 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-56 animate-in fade-in-0 zoom-in-95 duration-200">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.user_metadata?.full_name || 'Welcome'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        Dashboard
                      </Link>
                      <Link
                        to="/chat"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        AI Chat
                      </Link>
                      <button
                        onClick={() => openSettingsToTab('plan-credits')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        Subscription
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-gray-400" />
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
                className="hidden sm:flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 md:px-5 py-2 md:py-2.5 text-[13px] md:text-[15px] font-medium" 
                onClick={() => navigate('/auth')}
              >
                Try Vesta
              </Button>
            </>
          )}
          
          {/* Mobile Menu Button */}
          <button 
            className={`md:hidden p-2 ${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              <VestaBrand size="sm" variant="light" />
            </Link>
            <button 
              className="p-2 text-gray-700 hover:text-gray-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="px-6 py-6 space-y-4">
            <Link 
              to="/pricing" 
              className="block text-lg font-medium text-gray-900 py-3 border-b border-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              to="/about" 
              className="block text-lg font-medium text-gray-900 py-3 border-b border-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/docs/connect" 
              className="block text-lg font-medium text-gray-900 py-3 border-b border-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Integrations
            </Link>
            <Link 
              to="/docs" 
              className="block text-lg font-medium text-gray-900 py-3 border-b border-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Docs
            </Link>
            
            {user ? (
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {getUserInitials()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{user.user_metadata?.full_name || 'Welcome'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Link 
                  to="/dashboard"
                  className="block text-base font-medium text-gray-700 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/chat"
                  className="block text-base font-medium text-gray-700 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  AI Chat
                </Link>
                <button 
                  className="block text-base font-medium text-gray-700 py-2 text-left w-full"
                  onClick={() => openSettingsToTab('plan-credits')}
                >
                  Subscription & Settings
                </button>
                <Button 
                  variant="outline"
                  className="w-full border border-gray-300 text-gray-700 rounded-lg py-3 text-base font-medium mt-2"
                  onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-3 text-base font-medium"
                  onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}
                >
                  Try Vesta free
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border border-gray-300 text-gray-700 rounded-lg py-3 text-base font-medium"
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
