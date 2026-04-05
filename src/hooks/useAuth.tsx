import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
// Use the wrapper client that respects recovery mode
import { supabase } from '@/lib/supabase-client-wrapper';
import { getRedirectUrl } from '@/lib/constants';
import { getBrowserSentryDsn, Sentry } from '@/lib/sentry';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!getBrowserSentryDsn()) return;
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email ?? undefined,
        username:
          (typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : undefined) ?? user.email ?? undefined,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    // Use production domain for email redirects to ensure links work when published
    const redirectUrl = getRedirectUrl('/auth');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData || {}
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      // Clear password recovery mode flag
      sessionStorage.removeItem('passwordRecoveryMode');
      const { error } = await supabase.auth.signOut();
      // Even if there's an error, clear local state to ensure logout
      setSession(null);
      setUser(null);
      return { error };
    } catch (error) {
      // Clear local state regardless of API error
      sessionStorage.removeItem('passwordRecoveryMode');
      setSession(null);
      setUser(null);
      return { error: null }; // Return success since local state is cleared
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};