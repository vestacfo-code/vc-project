import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Phone, BarChart3, Clock, Shield } from 'lucide-react';
import { ContactList } from './crm/ContactList';
import { CallCenter } from './crm/CallCenter';
import { PipelineBoard } from './crm/PipelineBoard';
import { CRMAnalytics } from './crm/CRMAnalytics';
import { ActivityTimeline } from './crm/ActivityTimeline';
import { AuditLogViewer } from './crm/AuditLogViewer';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CRMSectionProps {
  hasPermission?: (permission: string) => boolean;
  isSuperAdmin?: boolean;
  userRoles?: string[];
}

export const CRMSection = ({ 
  hasPermission = () => false,
  isSuperAdmin: isSuperAdminProp = false,
  userRoles = []
}: CRMSectionProps = {}) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkSuperAdmin();
  }, []);

  const checkSuperAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    setIsSuperAdmin(!!data);
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">CRM</h2>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
          Manage contacts and deals
        </p>
      </div>

      <Tabs defaultValue="contacts" className="space-y-3 sm:space-y-4">
        <TabsList className="w-full grid grid-cols-3 sm:inline-flex sm:w-auto h-auto sm:h-9 p-0.5 bg-muted/50 rounded-lg gap-0.5">
          <TabsTrigger value="contacts" className="text-[10px] sm:text-xs py-2 sm:py-1.5 px-1 flex-col sm:flex-row gap-0.5 sm:gap-1.5 data-[state=active]:bg-background">
            <Users className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs">Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="text-[10px] sm:text-xs py-2 sm:py-1.5 px-1 flex-col sm:flex-row gap-0.5 sm:gap-1.5 data-[state=active]:bg-background">
            <TrendingUp className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="call-center" className="text-[10px] sm:text-xs py-2 sm:py-1.5 px-1 flex-col sm:flex-row gap-0.5 sm:gap-1.5 data-[state=active]:bg-background">
            <Phone className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs">Calls</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-[10px] sm:text-xs py-2 sm:py-1.5 px-1 flex-col sm:flex-row gap-0.5 sm:gap-1.5 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-[10px] sm:text-xs py-2 sm:py-1.5 px-1 flex-col sm:flex-row gap-0.5 sm:gap-1.5 data-[state=active]:bg-background">
            <Clock className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs">Timeline</span>
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="audit" className="text-[10px] sm:text-xs py-2 sm:py-1.5 px-1 flex-col sm:flex-row gap-0.5 sm:gap-1.5 data-[state=active]:bg-background">
              <Shield className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="text-[10px] sm:text-xs">Audit</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="contacts">
          <ContactList />
        </TabsContent>

        <TabsContent value="pipeline">
          <PipelineBoard />
        </TabsContent>

        <TabsContent value="call-center">
          <CallCenter />
        </TabsContent>

        <TabsContent value="analytics">
          <CRMAnalytics />
        </TabsContent>

        <TabsContent value="timeline">
          <ActivityTimeline />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="audit">
            <AuditLogViewer />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};