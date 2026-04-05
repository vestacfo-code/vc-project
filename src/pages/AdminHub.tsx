import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Megaphone, Users, Loader2, LogOut, UserCircle, PhoneCall, GraduationCap, Shield, Calendar, UsersRound, LifeBuoy, Handshake } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { CareersAdminSection } from '@/components/admin/CareersAdminSection';
import { BlogAdminSection } from '@/components/admin/BlogAdminSection';
import { PressAdminSection } from '@/components/admin/PressAdminSection';
import { AdminUserManagement } from '@/components/admin/AdminUserManagement';
import { CRMSection } from '@/components/admin/CRMSection';
import TrainingSection from '@/components/admin/training/TrainingSection';
import { ContentCalendarSection } from '@/components/admin/ContentCalendarSection';
import { ConsumerManagementSection } from '@/components/admin/ConsumerManagementSection';
import { SupportAdminSection } from '@/components/admin/SupportAdminSection';
import { PartnersAdminSection } from '@/components/admin/PartnersAdminSection';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { VestaLogo } from '@/components/VestaLogo';

const AdminHub = () => {
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const { permissions, loading: permissionsLoading, isSuperAdmin, hasPermission, hasAnyPermission } = usePermissions();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);

  // Check if user has specific role(s)
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Helper functions to check grouped permissions
  // Note: staff role requires specific granted permissions, admin/hr_staff get blanket access
  const hasCareersAccess = () => {
    return isSuperAdmin || 
           userRoles.some(r => ['admin', 'hr_staff'].includes(r)) ||
           hasAnyPermission(['careers_management', 'careers_view_applications', 'careers_manage_applications', 
                            'careers_view_roles', 'careers_create_roles', 'careers_edit_roles', 'careers_delete_roles']);
  };
  
  const hasBlogAccess = () => {
    return isSuperAdmin || 
           userRoles.some(r => ['admin', 'hr_staff'].includes(r)) ||
           hasAnyPermission(['blog_management', 'blog_view', 'blog_create', 'blog_edit', 'blog_delete']);
  };
  
  const hasPressAccess = () => {
    return isSuperAdmin || 
           userRoles.some(r => ['admin', 'hr_staff'].includes(r)) ||
           hasAnyPermission(['press_management', 'press_view', 'press_create', 'press_edit', 'press_delete']);
  };
  
  const hasContentCalendarAccess = () => {
    return isSuperAdmin || 
           userRoles.some(r => ['admin', 'hr_staff'].includes(r)) ||
           hasAnyPermission(['content_calendar_view', 'content_calendar_create', 
                            'content_calendar_edit', 'content_calendar_delete']);
  };
  
  const hasTrainingAccess = () => {
    return isSuperAdmin || 
           userRoles.some(r => ['admin', 'hr_staff'].includes(r)) ||
           hasAnyPermission(['training', 'training_management', 'training_view', 'training_create', 'training_edit', 'training_delete', 'training_assign']);
  };
  
  const hasCRMAccess = () => {
    return isSuperAdmin || 
           userRoles.some(r => ['admin', 'hr_staff'].includes(r)) ||
           hasAnyPermission(['crm_contacts', 'crm_deals', 'crm_activities', 'crm_call_center', 'crm_analytics',
                            'crm_contacts_view', 'crm_contacts_edit', 'crm_deals_view', 'crm_deals_edit',
                            'crm_activities_view', 'crm_activities_edit']);
  };
 
   const hasSupportAccess = () => {
     return isSuperAdmin || userRoles.some(r => ['admin', 'super_admin', 'staff'].includes(r));
   };

  const hasPartnersAdminAccess = () =>
    userRoles.some((r) => ['admin', 'super_admin'].includes(r));

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      console.log('[AdminHub] No user found');
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    console.log('[AdminHub] Checking admin access for user:', user.id, user.email);

    try {
      // Check if user has admin, hr_staff, super_admin, or staff role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'hr_staff', 'super_admin', 'staff']);

      console.log('[AdminHub] Role check result:', { roles, error });

      if (error) throw error;

      if (roles && roles.length > 0) {
        setIsAdmin(true);
        setUserRoles(roles.map(r => r.role));
        const superAdmin = roles.some(r => r.role === 'super_admin');
        console.log('[AdminHub] Admin access granted, super admin:', superAdmin);
        toast({
          title: "Admin Access Granted",
          description: `Welcome, ${user.email}`,
        });
        await fetchAdminData();
      } else if (permissions.length > 0) {
        // User has granular permissions
        setIsAdmin(true);
        console.log('[AdminHub] Access granted via permissions:', permissions);
        toast({
          title: "Admin Access Granted",
          description: `Welcome, ${user.email}`,
        });
        await fetchAdminData();
      } else {
        setIsAdmin(false);
        console.log('[AdminHub] No admin role or permissions found');
        toast({
          title: "Access Denied",
          description: "You don't have admin permissions",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[AdminHub] Error checking admin access:', error);
      setIsAdmin(false);
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('[AdminHub] Logging out');
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    }
  };

  const fetchAdminData = async () => {
    // Only fetch if user is authenticated
    if (!user) {
      console.log('[AdminHub] No user, skipping admin data fetch');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('careers-admin-auth', {
        body: {}
      });

      if (error) {
        // Silently handle auth errors (expected when session expires)
        if (error.message?.includes('Auth session missing') || error.message?.includes('Invalid authentication')) {
          console.log('[AdminHub] Session expired, skipping admin data fetch');
          return;
        }
        throw error;
      }

      if (data?.success) {
        setAdminData(data);
      }
    } catch (error) {
      console.error('[AdminHub] Error fetching admin data:', error);
    }
  };

  const refreshAdminData = async () => {
    await fetchAdminData();
  };

  // Show loading state
  if (authLoading || loading || permissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vesta-cream">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-vesta-gold" />
          <p className="text-vesta-navy/80">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vesta-cream">
        <div className="w-full max-w-md rounded-xl border border-vesta-navy/10 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-2xl font-semibold text-red-600">Access Denied</h2>
          <p className="mb-6 text-vesta-navy/80">You don't have permission to access the admin hub</p>
          <Link to="/">
            <Button variant="outline" className="w-full border-vesta-navy/10 bg-white text-vesta-navy hover:bg-vesta-mist/25">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vesta-cream text-vesta-navy">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-vesta-navy/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <VestaLogo size="sm" tone="light" />
            </Link>
            <span className="text-vesta-navy-muted">|</span>
           <h1 className="font-serif text-lg text-vesta-navy sm:text-xl">MyVesta Admin Hub</h1>
            {isSuperAdmin && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Super Admin</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-vesta-navy/10 bg-vesta-mist/25 px-3 py-1.5 text-xs md:flex">
              <UserCircle className="h-3.5 w-3.5 text-vesta-navy/65" />
              <span className="max-w-[150px] truncate text-vesta-navy/80">{user?.email}</span>
            </div>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="h-8 px-3 text-vesta-navy/80 hover:bg-vesta-mist/40 hover:text-vesta-navy">
              <LogOut className="h-3.5 w-3.5" />
              <span className="ml-1.5 hidden text-xs sm:inline">Logout</span>
            </Button>
            <Link to="/">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-vesta-navy/80 hover:bg-vesta-mist/40 hover:text-vesta-navy">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs ml-1.5">Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
         <Tabs defaultValue={
          isSuperAdmin ? 'consumers' :
          hasCareersAccess() ? 'careers' :
          hasBlogAccess() ? 'blog' :
          hasPressAccess() ? 'press' :
          hasContentCalendarAccess() ? 'content' :
          hasTrainingAccess() ? 'training' :
          hasCRMAccess() ? 'crm' :
          hasPartnersAdminAccess() ? 'partners' : 'careers'
         } className="space-y-4">
          {/* Tab Navigation */}
           <TabsList className="flex h-auto w-full gap-0.5 overflow-x-auto rounded-lg border border-vesta-navy/10 bg-vesta-mist/40 p-1 sm:mx-auto sm:inline-flex sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {isSuperAdmin && (
              <TabsTrigger 
                value="consumers" 
                 className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-vesta-navy/80 transition-all data-[state=active]:bg-white data-[state=active]:text-vesta-navy data-[state=active]:shadow-sm"
              >
                <UsersRound className="h-4 w-4" />
                 <span>Consumers</span>
              </TabsTrigger>
            )}
            {hasCareersAccess() && (
              <TabsTrigger 
                value="careers" 
                 className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-vesta-navy/80 transition-all data-[state=active]:bg-white data-[state=active]:text-vesta-navy data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4" />
                 <span>Careers</span>
              </TabsTrigger>
            )}
            {hasBlogAccess() && (
              <TabsTrigger 
                value="blog" 
                 className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-vesta-navy/80 transition-all data-[state=active]:bg-white data-[state=active]:text-vesta-navy data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                 <span>Blog</span>
              </TabsTrigger>
            )}
            {hasPressAccess() && (
              <TabsTrigger 
                value="press" 
                 className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-vesta-navy/80 transition-all data-[state=active]:bg-white data-[state=active]:text-vesta-navy data-[state=active]:shadow-sm"
              >
                <Megaphone className="h-4 w-4" />
                 <span>Press</span>
              </TabsTrigger>
            )}
            {hasContentCalendarAccess() && (
              <TabsTrigger 
                value="content" 
                 className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-vesta-navy/80 transition-all data-[state=active]:bg-white data-[state=active]:text-vesta-navy data-[state=active]:shadow-sm"
              >
                <Calendar className="h-4 w-4" />
                 <span>Content</span>
              </TabsTrigger>
            )}
            {hasTrainingAccess() && (
              <TabsTrigger 
                value="training" 
                 className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-vesta-navy/80 transition-all data-[state=active]:bg-white data-[state=active]:text-vesta-navy data-[state=active]:shadow-sm"
              >
                <GraduationCap className="h-4 w-4" />
                 <span>Training</span>
              </TabsTrigger>
            )}
            {hasCRMAccess() && (
              <TabsTrigger 
                value="crm" 
                 className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-vesta-navy/80 transition-all data-[state=active]:bg-white data-[state=active]:text-vesta-navy data-[state=active]:shadow-sm"
              >
                <PhoneCall className="h-4 w-4" />
                 <span>CRM</span>
              </TabsTrigger>
            )}
            {hasPartnersAdminAccess() && (
              <TabsTrigger
                value="partners"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-vesta-navy/80 transition-all data-[state=active]:bg-white data-[state=active]:text-vesta-navy data-[state=active]:shadow-sm"
              >
                <Handshake className="h-4 w-4" />
                <span>Partners</span>
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger 
                value="users" 
                 className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-vesta-navy/80 transition-all data-[state=active]:bg-white data-[state=active]:text-vesta-navy data-[state=active]:shadow-sm"
              >
                <Shield className="h-4 w-4" />
                 <span>Users</span>
              </TabsTrigger>
            )}
            {hasSupportAccess() && (
              <TabsTrigger 
                value="support" 
                 className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-vesta-navy/80 transition-all data-[state=active]:bg-white data-[state=active]:text-vesta-navy data-[state=active]:shadow-sm"
              >
                <LifeBuoy className="h-4 w-4" />
                 <span>Support</span>
              </TabsTrigger>
            )}
          </TabsList>

          {isSuperAdmin && (
            <TabsContent value="consumers" className="mt-0">
                <ConsumerManagementSection />
            </TabsContent>
          )}

          {hasCareersAccess() && (
            <TabsContent value="careers" className="mt-0">
                <CareersAdminSection 
                  initialApplications={adminData?.applications || []}
                  initialJobRoles={adminData?.jobRoles || []}
                  onDataUpdate={refreshAdminData}
                  hasPermission={hasPermission}
                  isSuperAdmin={isSuperAdmin}
                  userRoles={userRoles}
                />
            </TabsContent>
          )}

          {hasBlogAccess() && (
            <TabsContent value="blog" className="mt-0">
                <BlogAdminSection 
                  hasPermission={hasPermission}
                  isSuperAdmin={isSuperAdmin}
                  userRoles={userRoles}
                />
            </TabsContent>
          )}

          {hasPressAccess() && (
            <TabsContent value="press" className="mt-0">
                <PressAdminSection 
                  hasPermission={hasPermission}
                  isSuperAdmin={isSuperAdmin}
                  userRoles={userRoles}
                />
            </TabsContent>
          )}
          {hasContentCalendarAccess() && (
            <TabsContent value="content" className="mt-0">
                <ContentCalendarSection 
                  hasPermission={hasPermission}
                  isSuperAdmin={isSuperAdmin}
                  userRoles={userRoles}
                />
            </TabsContent>
          )}

          {hasTrainingAccess() && (
            <TabsContent value="training" className="mt-0">
                <TrainingSection 
                  hasPermission={hasPermission}
                  isSuperAdmin={isSuperAdmin}
                  userRoles={userRoles}
                />
            </TabsContent>
          )}

          {hasCRMAccess() && (
            <TabsContent value="crm" className="mt-0">
                <CRMSection 
                  hasPermission={hasPermission}
                  isSuperAdmin={isSuperAdmin}
                  userRoles={userRoles}
                />
            </TabsContent>
          )}

          {hasPartnersAdminAccess() && (
            <TabsContent value="partners" className="mt-0">
              <PartnersAdminSection />
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="users" className="mt-0">
                <AdminUserManagement />
            </TabsContent>
          )}
          
          {hasSupportAccess() && (
            <TabsContent value="support" className="mt-0">
                <SupportAdminSection />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminHub;