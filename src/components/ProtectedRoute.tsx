import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);
  const [inviteSlug, setInviteSlug] = useState<string | null>(null);

  useEffect(() => {
    const checkFlow = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      const currentPath = location.pathname;

      try {
        // Check profile for onboarding status and payment status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('terms_accepted_at, company_name, is_custom_solution, payment_status')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }

        // Check if this is a custom solution user with pending payment
        if (profile?.is_custom_solution && profile?.payment_status === 'pending') {
          // Find their invite link to get the slug
          const { data: invite } = await supabase
            .from('consumer_invite_links')
            .select('slug')
            .eq('user_id', user.id)
            .eq('status', 'pending_payment')
            .maybeSingle();

          if (invite?.slug) {
            setInviteSlug(invite.slug);
            setPaymentPending(true);
            setCheckingStatus(false);
            return;
          }
        }

        // Check if user is a team member (not owner) - they should skip onboarding
        const { data: teamMembership } = await supabase
          .from('team_members')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const isTeamMember = teamMembership && teamMembership.role !== 'owner';

        // User has completed onboarding if they have a profile with terms accepted
        // OR if they have company data (legacy users)
        // OR if they are a team member (inherit owner's context)
        const hasCompletedOnboarding = !!(
          profile && (
            profile.terms_accepted_at || 
            profile.company_name ||
            isTeamMember
          )
        );
        
        console.log('[ProtectedRoute] Onboarding status:', {
          hasProfile: !!profile,
          hasTermsAccepted: !!profile?.terms_accepted_at,
          hasCompanyName: !!profile?.company_name,
          isTeamMember,
          hasCompletedOnboarding,
          isCustomSolution: profile?.is_custom_solution,
          paymentStatus: profile?.payment_status,
        });

        // Simplified flow: auth -> onboarding -> chat
        if (!hasCompletedOnboarding) {
          // User hasn't completed onboarding
          if (currentPath !== '/onboarding' && currentPath !== '/auth') {
            navigate('/onboarding', { replace: true });
            return;
          }
          setCheckingStatus(false);
          return;
        }

        // Onboarding is complete, redirect to chat
        if (currentPath === '/onboarding' || currentPath === '/auth') {
          navigate('/chat', { replace: true });
          return;
        }

        setCheckingStatus(false);
      } catch (error) {
        console.error('Failed to check user flow:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show payment pending screen for custom solution users
  if (paymentPending && inviteSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Complete Your Payment
            </h1>
            <p className="text-gray-500">
              Your account has been created, but you need to complete payment to access the platform.
            </p>
          </div>
          <Button 
            onClick={() => navigate(`/join/${inviteSlug}`)}
            className="w-full h-12 bg-gray-900 hover:bg-gray-800"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Continue to Payment
          </Button>
          <Button 
            variant="ghost" 
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/auth');
            }}
            className="text-gray-500"
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
