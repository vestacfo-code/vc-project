import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, X, User, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import SettingsModal from '@/components/SettingsModal';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState('general');
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  
  // Check if we're on admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    };

    if (user) {
      loadAvatar();

      // Subscribe to profile changes for realtime avatar updates
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Profile updated:', payload);
            if (payload.new && typeof payload.new === 'object' && 'avatar_url' in payload.new) {
              setAvatarUrl(payload.new.avatar_url || '');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return (
    <>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} defaultTab={settingsDefaultTab} />
      <div className="fixed top-2 sm:top-4 left-2 sm:left-4 lg:left-6 right-2 sm:right-4 lg:right-6 z-50 flex justify-center">
        <nav className="bg-slate-900/85 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80 rounded-2xl sm:rounded-3xl w-full max-w-screen-xl 2xl:max-w-screen-2xl">
          <div className="flex h-14 sm:h-16 items-center px-3 sm:px-6 lg:px-8">
            {/* Logo */}
            <div className="mr-3 sm:mr-6 flex items-center">
              <button onClick={() => window.location.href = 'https://joinfinlo.ai'}>
                <img 
                  src="/lovable-uploads/3e9db296-f3fb-492f-99b5-b64cc96f0539.png" 
                  alt="Finlo" 
                  className="h-7 sm:h-9 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                />
              </button>
            </div>

            {/* Desktop Navigation - Hide on admin page */}
            {!isAdminPage && (
              <div className="mr-4 hidden lg:flex lg:gap-1 xl:gap-3 2xl:gap-4 flex-wrap">
                <button 
                  className="text-xs xl:text-sm 2xl:text-base font-medium text-slate-300 transition-colors hover:text-white px-2 xl:px-3 2xl:px-4 py-2 whitespace-nowrap"
                  onClick={() => {
                    console.log('Product clicked, current path:', window.location.pathname);
                    if (window.location.pathname === '/') {
                      const element = document.querySelector('#features');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.location.href = '/#features';
                    }
                  }}
                >
                  Product
                </button>
                <Link 
                  to="/pricing" 
                  className="text-xs xl:text-sm 2xl:text-base font-medium text-slate-300 transition-colors hover:text-white px-2 xl:px-3 2xl:px-4 py-2 whitespace-nowrap"
                  onClick={() => {
                    setTimeout(() => window.scrollTo(0, 0), 100);
                  }}
                >
                  Pricing
                </Link>
                <Link 
                  to="/about" 
                  className="text-xs xl:text-sm 2xl:text-base font-medium text-slate-300 transition-colors hover:text-white px-2 xl:px-3 2xl:px-4 py-2 whitespace-nowrap"
                  onClick={() => {
                    setTimeout(() => window.scrollTo(0, 0), 100);
                  }}
                >
                  About
                </Link>
                <button 
                  className="text-xs xl:text-sm 2xl:text-base font-medium text-slate-300 transition-colors hover:text-white px-2 xl:px-3 2xl:px-4 py-2 whitespace-nowrap"
                  onClick={() => {
                    console.log('Customers clicked, current path:', window.location.pathname);
                    if (window.location.pathname === '/') {
                      const element = document.querySelector('#testimonials');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.location.href = '/#testimonials';
                    }
                  }}
                >
                  Customers
                </button>
                <a 
                  href="https://joinfinlo.ai/foundation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs xl:text-sm 2xl:text-base font-medium text-slate-300 transition-colors hover:text-white px-2 xl:px-3 2xl:px-4 py-2 whitespace-nowrap"
                >
                  Finlo Foundation
                </a>
              </div>
            )}

            {/* Spacer for flex layout */}
            <div className="flex-1" />

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5 h-9 px-2 sm:px-3">
                      <Avatar className="w-5 h-5 sm:w-6 sm:h-6">
                        <AvatarImage src={avatarUrl} alt="Profile" />
                        <AvatarFallback className="text-xs">
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs sm:text-sm">Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/chat" className="cursor-pointer">
                        Chat
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setSettingsDefaultTab('collaborators');
                        setSettingsOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Collaborators
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setSettingsDefaultTab('general');
                        setSettingsOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={signOut} 
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Login/Signup for non-authenticated users */}
            {!user && (
              <div className="hidden sm:flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs px-3 h-9">
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm" className="px-4 py-2 rounded-full text-xs h-9">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button - Only show if not admin page or not authenticated */}
            {(!isAdminPage || !user) && (
              <button
                className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground lg:hidden ml-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 border-t border-slate-700/40 bg-slate-900/95 backdrop-blur rounded-b-2xl sm:rounded-b-3xl mt-2">
                {!isAdminPage && (
                  <>
                    <button 
                      className="block px-3 py-2 text-sm font-medium text-slate-300 hover:text-white w-full text-left"
                      onClick={() => {
                        console.log('Product clicked (mobile), current path:', window.location.pathname);
                        if (window.location.pathname === '/') {
                          const element = document.querySelector('#features');
                          element?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          window.location.href = '/#features';
                        }
                        setIsMenuOpen(false);
                      }}
                    >
                      Product
                    </button>
                    <Link 
                      to="/pricing" 
                      className="block px-3 py-2 text-sm font-medium text-slate-300 hover:text-white"
                      onClick={() => {
                        setTimeout(() => window.scrollTo(0, 0), 100);
                        setIsMenuOpen(false);
                      }}
                    >
                      Pricing
                    </Link>
                    <Link 
                      to="/about" 
                      className="block px-3 py-2 text-sm font-medium text-slate-300 hover:text-white"
                      onClick={() => {
                        setTimeout(() => window.scrollTo(0, 0), 100);
                        setIsMenuOpen(false);
                      }}
                    >
                      About
                    </Link>
                    <button 
                      className="block px-3 py-2 text-sm font-medium text-slate-300 hover:text-white w-full text-left"
                      onClick={() => {
                        console.log('Customers clicked (mobile), current path:', window.location.pathname);
                        if (window.location.pathname === '/') {
                          const element = document.querySelector('#testimonials');
                          element?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          window.location.href = '/#testimonials';
                        }
                        setIsMenuOpen(false);
                      }}
                    >
                      Customers
                    </button>
                    <a 
                      href="https://joinfinlo.ai/foundation"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-2 text-sm font-medium text-slate-300 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Finlo Foundation
                    </a>
                  </>
                )}
                <div className="flex flex-col space-y-2 px-3 py-2">
                  {user ? (
                    <>
                      <Link to="/chat">
                        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                          <User className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSettingsOpen(true);
                          setIsMenuOpen(false);
                        }} 
                        className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                      >
                        Settings
                      </Button>
                      <Button variant="ghost" size="sm" onClick={signOut} className="w-full text-slate-300 hover:text-white hover:bg-slate-800">
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth" className="w-full">
                        <Button variant="ghost" size="sm" className="w-full text-slate-900 bg-white hover:bg-slate-100">
                          Login
                        </Button>
                      </Link>
                      <Link to="/auth" className="w-full">
                        <Button variant="hero" size="sm" className="w-full">
                          Get Started Free
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Navigation;