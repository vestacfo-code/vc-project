import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, User, Lock, Unlock, Loader2 } from 'lucide-react';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface UserPermission {
  permission: string;
}

interface UserWithPermissions extends UserProfile {
  permissions: string[];
  isSuperAdmin: boolean;
}

const ADMIN_PERMISSIONS = [
  // Blog permissions
  { value: 'blog_management', label: '✨ Blog - Full Management', description: 'Complete access to all blog features (shortcut for all blog permissions)' },
  { value: 'blog_view', label: 'Blog - View', description: 'View blog posts' },
  { value: 'blog_create', label: 'Blog - Create', description: 'Create blog posts' },
  { value: 'blog_edit', label: 'Blog - Edit', description: 'Edit blog posts' },
  { value: 'blog_delete', label: 'Blog - Delete', description: 'Delete blog posts' },
  
  // Press permissions
  { value: 'press_management', label: '✨ Press - Full Management', description: 'Complete access to all press features (shortcut for all press permissions)' },
  { value: 'press_view', label: 'Press - View', description: 'View press releases' },
  { value: 'press_create', label: 'Press - Create', description: 'Create press releases' },
  { value: 'press_edit', label: 'Press - Edit', description: 'Edit press releases' },
  { value: 'press_delete', label: 'Press - Delete', description: 'Delete press releases' },
  
  // Careers permissions
  { value: 'careers_management', label: '✨ Careers - Full Management', description: 'Complete access to all careers features (shortcut for all careers permissions)' },
  { value: 'careers_view_applications', label: 'Careers - View Applications', description: 'View job applications' },
  { value: 'careers_manage_applications', label: 'Careers - Manage Applications', description: 'Update application statuses' },
  { value: 'careers_view_roles', label: 'Careers - View Roles', description: 'View job roles' },
  { value: 'careers_create_roles', label: 'Careers - Create Roles', description: 'Create new job roles' },
  { value: 'careers_edit_roles', label: 'Careers - Edit Roles', description: 'Edit existing job roles' },
  { value: 'careers_delete_roles', label: 'Careers - Delete Roles', description: 'Delete job roles' },
  
  // CRM permissions
  { value: 'crm_contacts', label: '✨ CRM - Full Contacts Access', description: 'Complete access to all CRM contact features' },
  { value: 'crm_deals', label: '✨ CRM - Full Deals Access', description: 'Complete access to all CRM deals features' },
  { value: 'crm_activities', label: '✨ CRM - Full Activities Access', description: 'Complete access to all CRM activities features' },
  { value: 'crm_contacts_view', label: 'CRM - View Contacts', description: 'View CRM contacts' },
  { value: 'crm_contacts_edit', label: 'CRM - Edit Contacts', description: 'Create/edit CRM contacts' },
  { value: 'crm_deals_view', label: 'CRM - View Deals', description: 'View CRM deals' },
  { value: 'crm_deals_edit', label: 'CRM - Edit Deals', description: 'Create/edit CRM deals' },
  { value: 'crm_activities_view', label: 'CRM - View Activities', description: 'View CRM activities' },
  { value: 'crm_activities_edit', label: 'CRM - Edit Activities', description: 'Create/edit CRM activities' },
  { value: 'crm_call_center', label: 'CRM - Call Center', description: 'Access call center features' },
  { value: 'crm_analytics', label: 'CRM - Analytics', description: 'View CRM analytics' },
  
  // Training permissions
  { value: 'training_management', label: '✨ Training - Full Management', description: 'Complete access to all training features (shortcut for all training permissions)' },
  { value: 'training_view', label: 'Training - View', description: 'View training materials' },
  { value: 'training_create', label: 'Training - Create', description: 'Create training materials' },
  { value: 'training_edit', label: 'Training - Edit', description: 'Edit training materials' },
  { value: 'training_delete', label: 'Training - Delete', description: 'Delete training materials' },
  { value: 'training_assign', label: 'Training - Assign', description: 'Assign training to users' },
  
  // Content Calendar permissions
  { value: 'content_calendar_management', label: '✨ Content Calendar - Full Management', description: 'Complete access to all content calendar features' },
  { value: 'content_calendar_view', label: 'Content Calendar - View', description: 'View content calendar' },
  { value: 'content_calendar_create', label: 'Content Calendar - Create', description: 'Create content' },
  { value: 'content_calendar_edit', label: 'Content Calendar - Edit', description: 'Edit content' },
  { value: 'content_calendar_delete', label: 'Content Calendar - Delete', description: 'Delete content' },
  
  // Other permissions
  { value: 'staff_directory', label: 'Staff Directory', description: 'View staff directory' },
  { value: 'user_management', label: 'User Management', description: 'Manage user permissions' },
  { value: 'audit_logs', label: 'Audit Logs', description: 'View audit logs (Super Admin only)' },
];

export default function UserPermissionsManager() {
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users with profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch permissions for all users
      const usersWithPermissions = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Check if super admin
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .eq('role', 'super_admin')
            .maybeSingle();

          const isSuperAdmin = !!roleData;

          // Get permissions
          const { data: perms } = await supabase
            .rpc('get_user_permissions', { _user_id: profile.user_id });

          return {
            ...profile,
            permissions: perms?.map((p: UserPermission) => p.permission) || [],
            isSuperAdmin,
          };
        })
      );

      setUsers(usersWithPermissions);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setEditingPermissions(new Set(user.permissions));
  };

  const togglePermission = (permission: string) => {
    const newPermissions = new Set(editingPermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setEditingPermissions(newPermissions);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || saving) return;

    try {
      setSaving(true);
      console.log('[UserPermissionsManager] Starting permission update for user:', selectedUser.user_id);
      
      // Get current permissions from DB
      const { data: currentPerms, error: fetchError } = await supabase
        .from('admin_permissions' as any)
        .select('permission')
        .eq('user_id', selectedUser.user_id);

      if (fetchError) {
        console.error('[UserPermissionsManager] Error fetching permissions:', fetchError);
        throw fetchError;
      }

      const currentPermissions = new Set<string>(
        (currentPerms as any)?.map((p: any) => p.permission as string) || []
      );

      // Determine which permissions to add and remove
      const toAdd = Array.from(editingPermissions).filter(
        (p) => !currentPermissions.has(p)
      );
      const toRemove = Array.from(currentPermissions).filter(
        (p) => !editingPermissions.has(p as any)
      );

      console.log('[UserPermissionsManager] Permissions to add:', toAdd);
      console.log('[UserPermissionsManager] Permissions to remove:', toRemove);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Add new permissions
      if (toAdd.length > 0) {
        console.log('[UserPermissionsManager] Inserting new permissions...');
        const { error: addError } = await supabase
          .from('admin_permissions' as any)
          .insert(
            toAdd.map((permission) => ({
              user_id: selectedUser.user_id,
              permission: permission as any,
              granted_by: user.id,
            }))
          );

        if (addError) {
          console.error('[UserPermissionsManager] Error adding permissions:', addError);
          throw addError;
        }
        console.log('[UserPermissionsManager] Successfully added permissions');
      }

      // Remove revoked permissions
      if (toRemove.length > 0) {
        console.log('[UserPermissionsManager] Removing permissions...');
        const { error: removeError } = await supabase
          .from('admin_permissions' as any)
          .delete()
          .eq('user_id', selectedUser.user_id)
          .in('permission', toRemove as any);

        if (removeError) {
          console.error('[UserPermissionsManager] Error removing permissions:', removeError);
          throw removeError;
        }
        console.log('[UserPermissionsManager] Successfully removed permissions');
      }

      console.log('[UserPermissionsManager] Permission update completed successfully');
      toast.success('Permissions updated successfully');
      setSelectedUser(null);
      await fetchUsers();
    } catch (error: any) {
      console.error('[UserPermissionsManager] Error updating permissions:', error);
      
      // Provide more specific error messages
      if (error?.message?.includes('permission denied')) {
        toast.error('You do not have permission to manage user permissions');
      } else if (error?.message?.includes('violates')) {
        toast.error('Unable to save: duplicate permission detected');
      } else {
        toast.error(`Failed to update permissions: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading users...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Permissions Management
          </CardTitle>
          <CardDescription>
            Configure granular access control for each user. Super Admins have access to everything.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {user.full_name || user.email}
                      {user.isSuperAdmin && (
                        <Badge variant="default" className="text-xs">
                          Super Admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.isSuperAdmin ? (
                        <Badge variant="secondary" className="text-xs">
                          All Permissions
                        </Badge>
                      ) : user.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No permissions</span>
                      ) : (
                        user.permissions.slice(0, 3).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {ADMIN_PERMISSIONS.find((p) => p.value === perm)?.label || perm}
                          </Badge>
                        ))
                      )}
                      {!user.isSuperAdmin && user.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {!user.isSuperAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Edit Permissions
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Permissions: {selectedUser?.full_name || selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              Select the permissions this user should have access to. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {ADMIN_PERMISSIONS.map((perm) => (
              <div
                key={perm.value}
                className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={perm.value}
                  checked={editingPermissions.has(perm.value)}
                  onCheckedChange={() => togglePermission(perm.value)}
                  disabled={perm.value === 'audit_logs' || saving}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={perm.value}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {perm.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {perm.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedUser(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePermissions}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Save Permissions
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
