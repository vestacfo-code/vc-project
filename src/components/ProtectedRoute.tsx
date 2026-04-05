import { Navigate, useNavigate, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkFlow = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      const currentPath = location.pathname;

      try {
        // Check if user has a hotel linked via hotel_members
        const { data: membership } = await supabase
          .from('hotel_members')
          .select('hotel_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        const hasHotel = !!membership?.hotel_id;

        if (!hasHotel) {
          // No hotel yet — send to onboarding unless already there
          const oauthParamBlob =
            `${location.search}${location.hash.startsWith('#') ? location.hash.slice(1) : ''}`;
          const qbCallbackWithOAuth =
            currentPath === '/integrations/qb-callback' &&
            (oauthParamBlob.includes('code=') || oauthParamBlob.includes('state='));
          if (currentPath !== '/onboarding' && !qbCallbackWithOAuth) {
            navigate('/onboarding', { replace: true });
          }
          setCheckingStatus(false);
          return;
        }

        // Has hotel — if they're on auth or onboarding, send to dashboard
        if (currentPath === '/onboarding' || currentPath === '/auth') {
          navigate('/dashboard', { replace: true });
          return;
        }

        setCheckingStatus(false);
      } catch (error) {
        console.error('[ProtectedRoute] Failed to check user flow:', error);
        setCheckingStatus(false);
      }
    };

    if (user) {
      checkFlow();
    } else {
      setCheckingStatus(false);
    }
  }, [user, navigate, location.pathname, location.search, location.hash]);

  if (loading || checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vesta-cream">
        <Loader2 className="h-8 w-8 animate-spin text-vesta-gold" />
      </div>
    );
  }

  if (!user) {
    // Preserve QuickBooks OAuth query string: <Navigate to="/auth" /> drops ?code=&state= otherwise.
    const oauthBlob =
      `${location.search}${location.hash.startsWith('#') ? location.hash.slice(1) : ''}`;
    if (
      location.pathname === '/integrations/qb-callback' &&
      (oauthBlob.includes('code=') || oauthBlob.includes('state='))
    ) {
      try {
        const payload: Pick<Location, 'pathname' | 'search' | 'hash'> = {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        };
        sessionStorage.setItem('vesta_oauth_return_path', JSON.stringify(payload));
      } catch {
        /* ignore quota / private mode */
      }
    }
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
