import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Admin utility hook to check if current user has admin role
export const useIsAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        console.log('[useIsAdmin] No user found');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log('[useIsAdmin] Checking admin role for user:', user.id);
      
      try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'hr_staff', 'super_admin', 'staff']);

      console.log('[useIsAdmin] Role check result:', { data, error });
      setIsAdmin(!!data && data.length > 0 && !error);
      } catch (error) {
        console.error('[useIsAdmin] Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, loading };
};

// Helper function to check admin status for a specific user ID
export const checkUserAdminRole = async (userId: string): Promise<boolean> => {
  console.log('[checkUserAdminRole] Checking role for user:', userId);
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'hr_staff', 'super_admin', 'staff']);

    console.log('[checkUserAdminRole] Result:', { data, error });
    return !!data && data.length > 0 && !error;
  } catch (error) {
    console.error('[checkUserAdminRole] Error checking admin role:', error);
    return false;
  }
};