import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TrainingList from './TrainingList';
import TrainingAssignmentManager from './TrainingAssignmentManager';
import MyTraining from './MyTraining';

interface TrainingSectionProps {
  hasPermission?: (permission: string) => boolean;
  isSuperAdmin?: boolean;
  userRoles?: string[];
}

export default function TrainingSection({ 
  hasPermission = () => false,
  isSuperAdmin = false,
  userRoles = []
}: TrainingSectionProps = {}) {
  const [isHRorSuperAdmin, setIsHRorSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminRole();
  }, [isSuperAdmin, userRoles]);

  const checkAdminRole = async () => {
    try {
      // Check if user has training_management permission (can create/edit)
      // or is a super admin / hr_staff / admin
      if (isSuperAdmin || 
          userRoles.some(r => ['hr_staff', 'super_admin', 'admin'].includes(r)) ||
          hasPermission('training_management')) {
        setIsHRorSuperAdmin(true);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['hr_staff', 'super_admin', 'admin']);

      setIsHRorSuperAdmin(!!data && data.length > 0);
    } catch (error) {
      console.error('Error checking admin role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Training Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isHRorSuperAdmin 
            ? 'Create and manage training materials, assign to team members'
            : 'View your assigned training and track progress'
          }
        </p>
      </div>

      <Tabs defaultValue={isHRorSuperAdmin ? "materials" : "my-training"} className="w-full">
        <TabsList className="grid w-full h-14 sm:h-12" style={{ gridTemplateColumns: isHRorSuperAdmin ? 'repeat(3, 1fr)' : '1fr' }}>
          {isHRorSuperAdmin && (
            <>
              <TabsTrigger value="materials" className="flex items-center justify-center gap-0 sm:gap-2 px-3 sm:px-4">
                <BookOpen className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Materials</span>
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center justify-center gap-0 sm:gap-2 px-3 sm:px-4">
                <Users className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Assign</span>
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="my-training" className="flex items-center justify-center gap-0 sm:gap-2 px-3 sm:px-4">
            <GraduationCap className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">My Training</span>
          </TabsTrigger>
        </TabsList>

        {isHRorSuperAdmin && (
          <>
            <TabsContent value="materials">
              <TrainingList />
            </TabsContent>
            <TabsContent value="assignments">
              <TrainingAssignmentManager />
            </TabsContent>
          </>
        )}
        <TabsContent value="my-training">
          <MyTraining />
        </TabsContent>
      </Tabs>
    </div>
  );
}
