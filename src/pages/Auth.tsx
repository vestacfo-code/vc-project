import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
// Use the wrapper client that respects recovery mode
import { supabase } from '@/lib/supabase-client-wrapper';
import { clearRecoveryMode } from '@/lib/auth-recovery-interceptor';
import { getRedirectUrl } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, ArrowLeft } from 'lucide-react';
import GoogleLogo from '@/components/ui/google-logo';
import { ReferralCodesModal } from '@/components/ReferralCodesModal';
import { usePortalAnimation } from '@/contexts/PortalAnimationContext';

// Typing effect component with slower speed and subtle cursor
const TypingHeadline = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayText('');
    setIsComplete(false);
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, 120);
    return () => clearInterval(timer);
  }, [text]);

  useEffect(() => {
    if (isComplete) {
      setShowCursor(false);
      return;
    }
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 600);
    return () => clearInterval(cursorTimer);
  }, [isComplete]);

  return (
    <span className="font-serif text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal leading-tight">
      {displayText}
      {!isComplete && (
        <span 
          className="ml-1 inline-block w-[3px] h-[1em] bg-white/80 align-middle"
          style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s' }}
        />
      )}
    </span>
  );
};

// Underline input component - must be outside Auth to prevent re-creation on render
const UnderlineInput = ({ 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  icon
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon?: React.ReactNode;
}) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full h-12 bg-transparent border-0 border-b-2 border-gray-200 rounded-none 
        focus:border-gray-900 focus:ring-0 focus:outline-none
        text-gray-900 placeholder:text-gray-400 transition-colors
        ${icon ? 'pl-8' : 'px-0'}`}
    />
  </div>
);

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startAnimation, isActive: portalIsActive } = usePortalAnimation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // Check for recovery mode SYNCHRONOUSLY during initial render (before Supabase clears the hash)
  const [showSetNewPassword, setShowSetNewPassword] = useState(() => {
    const hash = window.location.hash;
    const isRecoveryFromHash = hash && hash.includes('type=recovery');
    const isRecoveryFromStorage = sessionStorage.getItem('passwordRecoveryMode') === 'true';
    
    if (isRecoveryFromHash) {
      console.log('[Auth] SYNC: Detected recovery from hash, setting sessionStorage');
      sessionStorage.setItem('passwordRecoveryMode', 'true');
      return true;
    }
    if (isRecoveryFromStorage) {
      console.log('[Auth] SYNC: Detected recovery from sessionStorage');
      return true;
    }
    return false;
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showCodesModal, setShowCodesModal] = useState(false);
  
  // Team invitation params
  const [teamInvite, setTeamInvite] = useState<{ teamId: string; role: string; email: string } | null>(null);

  // Check for team invitation params and password reset on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamId = params.get('team');
    const role = params.get('role');
    const inviteEmail = params.get('email');
    
    if (teamId && role && inviteEmail) {
      setTeamInvite({ teamId, role, email: inviteEmail });
      setEmail(inviteEmail);
      setShowSignUp(true); // Show signup form for invited users
    }
    
    // Check URL hash for recovery mode
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      console.log('[Auth] Detected password recovery in useEffect');
      sessionStorage.setItem('passwordRecoveryMode', 'true');
      setShowSetNewPassword(true);
      setShowForgotPassword(false);
      setShowSignUp(false);
    }
    
    // Also check if we already have the flag set (page might have refreshed)
    if (sessionStorage.getItem('passwordRecoveryMode') === 'true') {
      console.log('[Auth] Recovery mode flag found in sessionStorage');
      setShowSetNewPassword(true);
      setShowForgotPassword(false);
      setShowSignUp(false);
    }
  }, []);

  // Manual token exchange for recovery mode (when detectSessionInUrl is disabled)
  useEffect(() => {
    const handleRecoveryTokenExchange = async () => {
      const isRecovery = sessionStorage.getItem('passwordRecoveryMode') === 'true';
      if (!isRecovery) return;
      
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      
      if (type === 'recovery' && accessToken && refreshToken) {
        console.log('[Auth] Recovery mode - manually setting session');
        
        // Set the session manually without triggering redirect
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error) {
          console.error('[Auth] Failed to set recovery session:', error);
          toast({
            title: "Error",
            description: "Failed to verify recovery link. Please request a new one.",
            variant: "destructive"
          });
          clearRecoveryMode();
          return;
        }
        
        // Clear the hash from URL to prevent re-processing
        window.history.replaceState(null, '', window.location.pathname);
        
        // Ensure password form is shown
        setShowSetNewPassword(true);
        setShowForgotPassword(false);
        setShowSignUp(false);
        
        console.log('[Auth] Recovery session set successfully, showing password form');
      }
    };
    
    handleRecoveryTokenExchange();
  }, [toast]);

  // Check for password recovery event (when user clicks reset link in email)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state changed:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[Auth] PASSWORD_RECOVERY event detected');
        setShowSetNewPassword(true);
        setShowForgotPassword(false);
        setShowSignUp(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getHeadline = () => {
    if (showSetNewPassword) return "Set your new password.";
    if (showForgotPassword) return "We've got you.";
    if (teamInvite) return "Join your team.";
    if (showSignUp) return "Let's build something.";
    return "Good to see you.";
  };

  // Redirect if already logged in (but NOT if portal animation is active or setting new password)
  useEffect(() => {
    // Check BOTH URL hash AND sessionStorage for recovery mode
    const hash = window.location.hash;
    const isRecoveryFromHash = hash && hash.includes('type=recovery');
    const isRecoveryFromStorage = sessionStorage.getItem('passwordRecoveryMode') === 'true';
    
    if (isRecoveryFromHash || isRecoveryFromStorage) {
      console.log('[Auth] Recovery mode active, blocking redirect');
      setShowSetNewPassword(true);
      return; // Block redirect
    }
    
    if (user && !loading && !portalIsActive && !showSetNewPassword) {
      navigate('/chat');
    }
  }, [user, loading, navigate, portalIsActive, showSetNewPassword]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password." 
          : error.message,
        variant: "destructive"
      });
      setIsLoading(false);
    } else {
      // Sign in succeeded - get user's name for the animation
      const { data } = await supabase.auth.getUser();
      const userFirstName = data.user?.user_metadata?.full_name?.split(' ')[0] 
        || data.user?.email?.split('@')[0] 
        || 'there';
      
      // ALWAYS check for pending team invitations by email (even without URL params)
      // This handles users who sign in without clicking the invitation link
      if (data.user) {
        try {
          const userEmail = data.user.email || email;
          
          // Find ANY pending invitation for this email
          const { data: invitation } = await supabase
            .from('team_invitations')
            .select('id, team_id, role')
            .eq('email', userEmail.toLowerCase())
            .is('accepted_at', null)
            .maybeSingle();
          
          if (invitation) {
            console.log('[Auth] Found pending invitation for email, accepting...', invitation);
            
            // Use secure function to accept invitation
            const { data: result, error: acceptError } = await supabase.rpc('accept_team_invitation', {
              p_invitation_id: invitation.id,
              p_user_id: data.user.id
            });
            
            const resultObj = result as { success?: boolean; team_id?: string } | null;
            if (!acceptError && resultObj?.success) {
              // Notify team owner
              await supabase.functions.invoke('team-notifications', {
                body: {
                  type: 'member_joined',
                  teamId: invitation.team_id,
                  memberEmail: userEmail,
                  memberName: userFirstName,
                },
              });
              
              toast({ title: "Welcome to the team!", description: "You've been added successfully." });
            } else if (acceptError) {
              console.error('[Auth] Team join error:', acceptError);
            }
          }
        } catch (err) {
          console.error('[Auth] Team invitation check error:', err);
        }
      }
      
      // Start the portal animation (navigation happens after animation completes in App.tsx)
      startAnimation(userFirstName);
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName} ${lastName}`.trim();
    if (!email || !password || !firstName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    const { error, data } = await signUp(email, password, { full_name: fullName });
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message === "User already registered" 
          ? "An account with this email already exists." 
          : error.message,
        variant: "destructive"
      });
      setIsLoading(false);
    } else {
      // ALWAYS check for pending team invitations by email (even without URL params)
      // This handles users who sign up without clicking the invitation link
      if (data?.user) {
        try {
          const userEmail = data.user.email || email;
          const fullName = `${firstName} ${lastName}`.trim();
          
          // Find ANY pending invitation for this email
          const { data: invitation } = await supabase
            .from('team_invitations')
            .select('id, team_id, role')
            .eq('email', userEmail.toLowerCase())
            .is('accepted_at', null)
            .maybeSingle();
          
          if (invitation) {
            console.log('[Auth] Found pending invitation for new user, accepting...', invitation);
            
            // Use secure function to accept invitation
            const { data: result, error: acceptError } = await supabase.rpc('accept_team_invitation', {
              p_invitation_id: invitation.id,
              p_user_id: data.user.id
            });
            
            const resultObj = result as { success?: boolean; team_id?: string } | null;
            if (!acceptError && resultObj?.success) {
              // Notify team owner
              await supabase.functions.invoke('team-notifications', {
                body: {
                  type: 'member_joined',
                  teamId: invitation.team_id,
                  memberEmail: userEmail,
                  memberName: fullName || userEmail.split('@')[0],
                },
              });
              
              toast({ title: "Welcome to the team!", description: "You've been added to your team successfully." });
            } else if (acceptError) {
              console.error('[Auth] Error accepting team invitation:', acceptError);
            }
          }
        } catch (err) {
          console.error('[Auth] Team invitation check error:', err);
        }
      }
      
      // Create organization for new user
      if (data?.user) {
        try {
          const emailDomain = (data.user.email || email).split('@')[1];
          const orgName = emailDomain ? emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1) + ' Hotel Group' : 'My Hotel Group';
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: orgName,
              owner_user_id: data.user.id,
              plan: 'starter',
            })
            .select('id')
            .single();
          if (!orgError && orgData) {
            localStorage.setItem('vesta_onboarding_org_id', orgData.id);
          }
        } catch (err) {
          console.error('[Auth] Org creation error:', err);
        }
      }

      setTimeout(async () => {
        if (referralCode.trim() && (data?.user || user)) {
          const userId = data?.user?.id || user?.id;
          try {
            const { data: activationData, error: activationError } = await supabase.rpc('activate_referral_code', {
              p_code: referralCode.trim().toUpperCase(),
              p_user_id: userId
            });
            if (!activationError && activationData?.length > 0 && activationData[0].success) {
              setGeneratedCodes(activationData[0].new_codes);
              setShowCodesModal(true);
              toast({ title: "Referral activated!" });
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.error('Referral activation error:', err);
          }
        }
        if (!teamInvite) {
          toast({ title: "Welcome to Vesta!" });
        }
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setReferralCode('');
        setIsLoading(false);
        navigate('/onboarding');
      }, 1000);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      // Use our custom Resend-based password reset with production domain
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: resetEmail,
          redirectUrl: getRedirectUrl('/auth')
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast({ title: "Password reset sent", description: "Check your email for the reset link." });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      toast({
        title: "Missing information",
        description: "Please enter and confirm your new password.",
        variant: "destructive"
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      // Clear the recovery mode flag using the utility function
      clearRecoveryMode();
      
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      setShowSetNewPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
      // Sign out so they can sign in fresh with new password
      await supabase.auth.signOut();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Flag for new Google signups so onboarding org creation runs after OAuth redirect
      if (showSignUp) {
        localStorage.setItem('vesta_pending_google_signup', '1');
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getRedirectUrl('/onboarding') }
      });
      if (error) {
        localStorage.removeItem('vesta_pending_google_signup');
        toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
        setIsLoading(false);
      }
    } catch (error: any) {
      localStorage.removeItem('vesta_pending_google_signup');
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[100dvh] flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Blue - Hidden on mobile */}
        <div 
          className="hidden lg:flex w-[55%] bg-gradient-to-b from-[#2563eb] to-[#1e40af] relative overflow-hidden"
        >
          {/* Heavy grainy noise texture overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.35 }}>
            <filter id="grainyNoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="5" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.5" />
                <feFuncG type="linear" slope="1.5" />
                <feFuncB type="linear" slope="1.5" />
              </feComponentTransfer>
            </filter>
            <rect width="100%" height="100%" filter="url(#grainyNoise)" />
          </svg>
          
          {/* Secondary grain layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.25, mixBlendMode: 'multiply' }}>
            <filter id="fineGrain">
              <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="4" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#fineGrain)" />
          </svg>
          
          {/* Decorative curved lines */}
          <svg className="absolute top-0 right-0 w-[700px] h-[700px]" viewBox="0 0 700 700" fill="none">
            <path d="M700 0 Q500 200 700 400" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
            <path d="M700 80 Q550 280 700 480" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
            <path d="M700 160 Q600 360 700 560" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
          </svg>
          
          <svg className="absolute bottom-0 left-0 w-[600px] h-[600px]" viewBox="0 0 600 600" fill="none">
            <path d="M0 600 Q200 400 0 200" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
            <path d="M0 520 Q150 320 0 120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
          </svg>
          
          <div 
            className="flex flex-col justify-between p-12 lg:p-16 w-full relative z-10"
          >
            <div />
            <div>
              <TypingHeadline key={getHeadline()} text={getHeadline()} />
            </div>
            <p className="text-white/40 text-sm">© 2026 Vesta. All rights reserved.</p>
          </div>
        </div>

        {/* Right Panel - White - Full screen on mobile */}
        <div 
          className="flex-1 flex flex-col bg-white px-4 py-6 sm:px-8 sm:py-8 lg:px-16 xl:px-24 min-h-[100dvh] lg:min-h-0 relative"
        >
          {/* Top bar with back button and logo */}
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => {
                if (window.history.length <= 2) {
                  navigate('/');
                } else {
                  navigate(-1);
                }
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors -ml-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            
            <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
              <img 
                src="/assets/9a766835-c271-49a0-bc54-c0424112a3cc.png" 
                alt="Vesta" 
                className="h-10"
              />
            </button>
          </div>

          {/* Centered content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              {showSetNewPassword ? (
                <div className="space-y-8">
                  <h1 className="text-3xl lg:text-4xl font-serif text-gray-900">
                    Set New Password
                  </h1>
                  <p className="text-gray-500 text-sm -mt-4">
                    Enter your new password below.
                  </p>
                  
                  <form onSubmit={handleSetNewPassword} className="space-y-6">
                    <UnderlineInput
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <UnderlineInput
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : 'Update Password'}
                    </Button>
                  </form>
                </div>
              ) : showForgotPassword ? (
                <div className="space-y-8">
                  <h1 className="text-3xl lg:text-4xl font-serif text-gray-900">
                    Reset Password
                  </h1>
                  
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <UnderlineInput
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Link'}
                    </Button>
                    
                    <button 
                      type="button" 
                      onClick={() => setShowForgotPassword(false)} 
                      className="w-full text-gray-500 hover:text-gray-900 text-sm"
                    >
                      Back to Sign In
                    </button>
                  </form>
                </div>
              ) : showSignUp ? (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-2">
                      {teamInvite ? 'Accept Invitation' : 'Create Account'}
                    </h1>
                    {teamInvite ? (
                      <p className="text-gray-400 text-sm">
                        Already have an account?{' '}
                        <button 
                          type="button"
                          onClick={() => setShowSignUp(false)} 
                          className="text-gray-900 underline underline-offset-4"
                        >
                          Sign in instead
                        </button>
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm">
                        Already have an account?{' '}
                        <button 
                          type="button"
                          onClick={() => setShowSignUp(false)} 
                          className="text-gray-900 underline underline-offset-4"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                  
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <UnderlineInput
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                      <UnderlineInput
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                    
                    <UnderlineInput type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <UnderlineInput type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <UnderlineInput type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <UnderlineInput placeholder="Referral code (optional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} icon={<Gift className="w-5 h-5" />} />

                    <Button type="submit" className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg mt-2" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Account'}
                    </Button>
                  </form>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400">Or</span></div>
                  </div>

                  <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium rounded-lg flex items-center justify-center gap-3">
                    <GoogleLogo className="w-5 h-5" />
                    Sign up with Google
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-2">
                      Welcome Back
                    </h1>
                    <p className="text-gray-400 text-sm">
                      {"Don't have an account? "}
                      <button type="button" onClick={() => setShowSignUp(true)} className="text-gray-900 underline underline-offset-4">
                        Create one
                      </button>
                    </p>
                  </div>
                  
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <UnderlineInput type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <UnderlineInput type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    
                    <Button type="submit" className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg mt-2" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Login Now'}
                    </Button>
                  </form>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400">Or</span></div>
                  </div>

                  <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium rounded-lg flex items-center justify-center gap-3">
                    <GoogleLogo className="w-5 h-5" />
                    Login with Google
                  </Button>

                  <div className="text-center">
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="text-gray-400 hover:text-gray-900 text-sm">
                      Forget password? <span className="underline underline-offset-4">Click here</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      
        <div className="lg:hidden fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2563eb] to-[#1e40af]" />
          
        <ReferralCodesModal codes={generatedCodes} open={showCodesModal} onClose={() => { setShowCodesModal(false); navigate('/chat'); }} />
      </div>
    </>
  );
};

export default Auth;