import { Navigate, useNavigate, useLocation } from 'react-router-dom';
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
          if (currentPath !== '/onboarding') {
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
  }, [user, navigate, location.pathname]);

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
