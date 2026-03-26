import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AdminPermission = 
  | 'blog_view'
  | 'blog_create'
  | 'blog_edit'
  | 'blog_delete'
  | 'blog_management'
  | 'press_view'
  | 'press_create'
  | 'press_edit'
  | 'press_delete'
  | 'press_management'
  | 'careers_view_applications'
  | 'careers_manage_applications'
  | 'careers_view_roles'
  | 'careers_create_roles'
  | 'careers_edit_roles'
  | 'careers_delete_roles'
  | 'careers_management'
  | 'crm_contacts_view'
  | 'crm_contacts_edit'
  | 'crm_contacts'
  | 'crm_deals_view'
  | 'crm_deals_edit'
  | 'crm_deals'
  | 'crm_activities_view'
  | 'crm_activities_edit'
  | 'crm_activities'
  | 'crm_call_center'
  | 'crm_analytics'
  | 'training'
  | 'training_view'
  | 'training_create'
  | 'training_edit'
  | 'training_delete'
  | 'training_assign'
  | 'training_management'
  | 'staff_directory'
  | 'user_management'
  | 'audit_logs'
  | 'consumer_management'
  | 'content_calendar_view'
  | 'content_calendar_create'
  | 'content_calendar_edit'
  | 'content_calendar_delete';

interface PermissionsState {
  permissions: Set<AdminPermission>;
  loading: boolean;
  isSuperAdmin: boolean;
}

export function usePermissions() {
  const [state, setState] = useState<PermissionsState>({
    permissions: new Set(),
    loading: true,
    isSuperAdmin: false,
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ permissions: new Set(), loading: false, isSuperAdmin: false });
        return;
      }

      // Check if super admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      const isSuperAdmin = !!roleData;

      // Get user permissions
      const { data: perms } = await supabase
        .rpc('get_user_permissions', { _user_id: user.id });

      const permissions = new Set<AdminPermission>(
        perms?.map((p: any) => p.permission as AdminPermission) || []
      );

      setState({ permissions, loading: false, isSuperAdmin });
    } catch (error) {
      console.error('Error loading permissions:', error);
      setState({ permissions: new Set(), loading: false, isSuperAdmin: false });
    }
  };

  const hasPermission = (permission: AdminPermission): boolean => {
    return state.isSuperAdmin || state.permissions.has(permission);
  };

  const hasAnyPermission = (permissions: AdminPermission[]): boolean => {
    if (state.isSuperAdmin) return true;
    return permissions.some(p => state.permissions.has(p));
  };

  const hasAllPermissions = (permissions: AdminPermission[]): boolean => {
    if (state.isSuperAdmin) return true;
    return permissions.every(p => state.permissions.has(p));
  };

  return {
    permissions: Array.from(state.permissions),
    loading: state.loading,
    isSuperAdmin: state.isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
