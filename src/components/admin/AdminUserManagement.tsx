import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, UserPlus, Trash2, Search, Loader2, Check, ChevronsUpDown, Lock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  user_id: string;
  role: 'admin' | 'hr_staff' | 'super_admin' | 'staff';
  created_at: string;
  profiles?: {
    email: string;
    full_name: string;
  };
  permissions?: string[];
}

export const AdminUserManagement = () => {
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<Array<{ user_id: string; email: string; full_name: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; email: string; full_name: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState<'admin' | 'hr_staff' | 'super_admin' | 'staff'>('staff');
  const [addingUser, setAddingUser] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    loadAdminUsers();
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    console.log('[AdminUserManagement] Loading all users');
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .order('full_name', { ascending: true });

      if (error) throw error;

      console.log('[AdminUserManagement] Loaded all users:', profiles);
      setAllUsers(profiles || []);
    } catch (error) {
      console.error('[AdminUserManagement] Error loading all users:', error);
    }
  };

  const loadAdminUsers = async () => {
    console.log('[AdminUserManagement] Loading admin users');
    setLoading(true);
    try {
      // Get admin roles
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'hr_staff', 'super_admin', 'staff'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profile info and permissions for each user
      const usersWithProfiles = await Promise.all(
        (roles || []).map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', role.user_id)
            .maybeSingle();

          // Get permissions if staff role
          let permissions: string[] = [];
          if (role.role === 'staff') {
            const { data: perms } = await supabase
              .from('admin_permissions' as any)
              .select('permission')
              .eq('user_id', role.user_id);
            permissions = perms?.map((p: any) => p.permission) || [];
          }

          return {
            ...role,
            profiles: profile || { email: 'Unknown', full_name: 'Unknown' },
            permissions
          };
        })
      );

      console.log('[AdminUserManagement] Loaded admin users:', usersWithProfiles);
      setAdminUsers(usersWithProfiles as AdminUser[]);
    } catch (error) {
      console.error('[AdminUserManagement] Error loading admin users:', error);
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAdminUser = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive",
      });
      return;
    }

    console.log('[AdminUserManagement] Adding admin user:', selectedUser.email, newUserRole);
    setAddingUser(true);
    
    try {
      // Check if user already has an admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', selectedUser.user_id)
        .in('role', ['admin', 'hr_staff', 'super_admin', 'staff'])
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Error",
          description: "User already has an admin role",
          variant: "destructive",
        });
        return;
      }

      // Add the role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: newUserRole,
        });

      if (insertError) {
        console.error('[AdminUserManagement] Insert error:', insertError);
        throw insertError;
      }

      // Generate instructions to copy
      const adminUrl = `${window.location.origin}/admin`;
      const instructions = `🎉 You've been granted ${newUserRole} access to Vesta!

📋 Admin Portal Access Instructions:

1. Go to: ${adminUrl}
2. Log in with your existing account credentials:
   Email: ${selectedUser.email}
3. You'll now have access to manage:
   - Job applications and careers
   - Blog posts
   - Press releases
   ${newUserRole === 'super_admin' ? '- Admin user management (Super Admin only)' : ''}

If you have any questions, please reach out to the team.`;

      // Copy to clipboard
      navigator.clipboard.writeText(instructions);

      toast({
        title: "Success - Instructions Copied!",
        description: `Added ${selectedUser.email} as ${newUserRole}. ${newUserRole === 'staff' ? 'You can now set their specific permissions.' : 'Instructions have been copied to your clipboard.'}`,
        duration: 8000,
      });

      setSelectedUser(null);
      setNewUserRole('staff');
      loadAdminUsers();
    } catch (error: any) {
      console.error('[AdminUserManagement] Error adding admin user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add admin user",
        variant: "destructive",
      });
    } finally {
      setAddingUser(false);
    }
  };

  const removeAdminUser = async (adminUser: AdminUser) => {
    console.log('[AdminUserManagement] Removing admin user:', adminUser.user_id);
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', adminUser.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Removed ${adminUser.profiles?.email || 'user'} from admin roles`,
      });

      loadAdminUsers();
    } catch (error) {
      console.error('[AdminUserManagement] Error removing admin user:', error);
      toast({
        title: "Error",
        description: "Failed to remove admin user",
        variant: "destructive",
      });
    }
  };

  const availablePermissions = [
    { value: 'blog_management', label: 'Blog Management' },
    { value: 'press_management', label: 'Press Management' },
    { value: 'careers_management', label: 'Careers Management' },
    { value: 'crm_contacts', label: 'CRM Contacts' },
    { value: 'crm_deals', label: 'CRM Deals' },
    { value: 'crm_activities', label: 'CRM Activities' },
    { value: 'crm_call_center', label: 'CRM Call Center' },
    { value: 'crm_analytics', label: 'CRM Analytics' },
    { value: 'staff_directory', label: 'Staff Directory' },
    { value: 'content_calendar_view', label: 'Content Calendar (View)' },
    { value: 'content_calendar_create', label: 'Content Calendar (Create)' },
    { value: 'content_calendar_edit', label: 'Content Calendar (Edit)' },
    { value: 'content_calendar_delete', label: 'Content Calendar (Delete)' },
    { value: 'training', label: 'Training (View/Complete)' },
    { value: 'training_management', label: 'Training Management (Create/Edit)' },
    { value: 'user_management', label: 'User Management' },
  ];

  const editPermissions = (user: AdminUser) => {
    setEditingPermissions(user.user_id);
    setSelectedPermissions(user.permissions || []);
  };

  const savePermissions = async (userId: string) => {
    try {
      // Get current user for granted_by tracking
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('admin_permissions' as any)
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting permissions:', deleteError);
        throw deleteError;
      }

      // Insert new permissions
      if (selectedPermissions.length > 0) {
        const { error: insertError } = await supabase
          .from('admin_permissions' as any)
          .insert(selectedPermissions.map(perm => ({
            user_id: userId,
            permission: perm as any,
            granted_by: currentUser?.id
          })));

        if (insertError) {
          console.error('Error inserting permissions:', insertError);
          throw insertError;
        }
      }

      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });

      setEditingPermissions(null);
      setSelectedPermissions([]);
      loadAdminUsers();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions. Make sure you have super admin access.",
        variant: "destructive",
      });
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const filteredUsers = adminUsers.filter(user =>
    user.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Admin User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            Add Admin User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="flex-1 justify-between text-sm h-9 min-w-0"
                >
                  <span className="truncate">
                    {selectedUser
                      ? `${selectedUser.full_name} (${selectedUser.email})`
                      : "Search user by name or email..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[90vw] sm:w-[400px] p-0 bg-popover" align="start">
                <Command>
                  <CommandInput placeholder="Search by name or email..." />
                  <CommandList>
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {allUsers.map((user) => (
                        <CommandItem
                          key={user.user_id}
                          value={`${user.full_name} ${user.email}`}
                          onSelect={() => {
                            setSelectedUser(user);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUser?.user_id === user.user_id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{user.full_name}</span>
                            <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Select value={newUserRole} onValueChange={(value: 'admin' | 'hr_staff' | 'super_admin' | 'staff') => setNewUserRole(value)}>
              <SelectTrigger className="w-full sm:w-[160px] text-sm h-9">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff (Custom)</SelectItem>
                <SelectItem value="hr_staff">HR Staff</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addAdminUser} disabled={addingUser || !selectedUser} className="rounded-xl text-sm h-9 whitespace-nowrap">
              {addingUser ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <UserPlus className="h-4 w-4 mr-1.5" />
              )}
              Add User
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            <strong>Staff</strong> = Customizable permissions | <strong>HR Staff</strong> = Careers only | <strong>Admin</strong> = All sections except users | <strong>Super Admin</strong> = Full access
          </p>
        </CardContent>
      </Card>

      {/* Admin Users List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              Admin Users ({filteredUsers.length})
            </CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64 text-sm h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No admin users found
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-3 sm:p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">{user.profiles?.full_name || 'No name'}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.profiles?.email || 'No email'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                          {user.role === 'staff' ? 'Staff (Custom)' : user.role}
                        </Badge>
                        {user.role === 'staff' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editPermissions(user)}
                            className="rounded-xl h-8 text-xs"
                          >
                            <Lock className="h-3 w-3 mr-1" />
                            Permissions
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeAdminUser(user)}
                          className="rounded-xl h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Show permissions for staff or when editing */}
                    {user.role === 'staff' && (
                      <div className="border-t pt-3">
                        {editingPermissions === user.user_id ? (
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Select Permissions:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {availablePermissions.map(perm => (
                                <label key={perm.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedPermissions.includes(perm.value)}
                                    onChange={() => togglePermission(perm.value)}
                                    className="rounded"
                                  />
                                  <span>{perm.label}</span>
                                </label>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => savePermissions(user.user_id)}
                                className="rounded-xl"
                              >
                                Save Permissions
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingPermissions(null);
                                  setSelectedPermissions([]);
                                }}
                                className="rounded-xl"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Granted permissions:</p>
                            {user.permissions && user.permissions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.permissions.map(perm => (
                                  <Badge key={perm} variant="outline" className="text-[10px]">
                                    {availablePermissions.find(p => p.value === perm)?.label || perm}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No permissions set</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
