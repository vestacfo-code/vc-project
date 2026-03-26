import { useState, useEffect } from 'react';
// Use the wrapper client for session consistency with useAuth
import { supabase } from '@/lib/supabase-client-wrapper';
import { useAuth } from '@/hooks/useAuth';

export type TeamRole = 'owner' | 'super_admin' | 'admin' | 'member' | 'viewer' | null;

interface TeamContext {
  role: TeamRole;
  teamId: string | null;
  teamOwnerId: string | null;
  isOwner: boolean;
  isMember: boolean;
  isLoading: boolean;
  effectiveUserId: string | null; // The user_id to use for data queries (owner's ID if member)
  // Permission flags
  canManageTeam: boolean;      // Create/delete team, change team settings
  canManageMembers: boolean;   // Add/remove/edit team members
  canManagePlan: boolean;      // Change subscription, credits, billing
  canManageIntegrations: boolean; // Connect/disconnect integrations
  canManageSchedules: boolean; // Change email schedules, notifications
  canSyncData: boolean;        // Trigger data sync
  canViewData: boolean;        // View financial data, conversations
}

const getDefaultContext = (userId: string | null = null): TeamContext => ({
  role: null,
  teamId: null,
  teamOwnerId: null,
  isOwner: false,
  isMember: false,
  isLoading: true,
  effectiveUserId: userId,
  canManageTeam: false,
  canManageMembers: false,
  canManagePlan: false,
  canManageIntegrations: false,
  canManageSchedules: false,
  canSyncData: false,
  canViewData: false,
});

export const useTeamRole = (): TeamContext => {
  const { user } = useAuth();
  const [context, setContext] = useState<TeamContext>(getDefaultContext());

  useEffect(() => {
    const loadTeamContext = async () => {
      if (!user) {
        setContext({ ...getDefaultContext(), isLoading: false });
        return;
      }

      try {
        // First check if user owns a team
        const { data: ownedTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (ownedTeam) {
          // User is a team owner - has ALL permissions
          setContext({
            role: 'owner',
            teamId: ownedTeam.id,
            teamOwnerId: user.id,
            isOwner: true,
            isMember: false,
            isLoading: false,
            effectiveUserId: user.id,
            canManageTeam: true,
            canManageMembers: true,
            canManagePlan: true,
            canManageIntegrations: true,
            canManageSchedules: true,
            canSyncData: true,
            canViewData: true,
          });
          return;
        }

        // Check if user is a member of a team
        const { data: membership } = await supabase
          .from('team_members')
          .select('id, team_id, role, teams(owner_id)')
          .eq('user_id', user.id)
          .neq('role', 'owner')
          .maybeSingle();

        if (membership) {
          const role = membership.role as TeamRole;
          const teamOwnerId = (membership.teams as any)?.owner_id;
          
          // Permission matrix based on role:
          // super_admin: Almost everything except billing
          // admin: Manage members, sync, schedules
          // member: Sync data only
          // viewer: View only
          setContext({
            role,
            teamId: membership.team_id,
            teamOwnerId,
            isOwner: false,
            isMember: true,
            isLoading: false,
            effectiveUserId: teamOwnerId || user.id,
            canManageTeam: role === 'super_admin',
            canManageMembers: role === 'super_admin' || role === 'admin',
            // Only owner can manage plan/billing - never team members
            canManagePlan: false,
            // Only super_admin can manage integrations
            canManageIntegrations: role === 'super_admin',
            // super_admin and admin can manage schedules
            canManageSchedules: role === 'super_admin' || role === 'admin',
            // Members can sync data, only viewers are restricted
            canSyncData: role !== 'viewer',
            canViewData: true,
          });
          return;
        }

        // User is not part of any team - standalone user (has all permissions for their own data)
        setContext({
          role: null,
          teamId: null,
          teamOwnerId: null,
          isOwner: false,
          isMember: false,
          isLoading: false,
          effectiveUserId: user.id,
          canManageTeam: false,
          canManageMembers: false,
          canManagePlan: true,
          canManageIntegrations: true,
          canManageSchedules: true,
          canSyncData: true,
          canViewData: true,
        });
      } catch (error) {
        console.error('Error loading team context:', error);
        setContext({
          role: null,
          teamId: null,
          teamOwnerId: null,
          isOwner: false,
          isMember: false,
          isLoading: false,
          effectiveUserId: user?.id || null,
          canManageTeam: false,
          canManageMembers: false,
          canManagePlan: true,
          canManageIntegrations: true,
          canManageSchedules: true,
          canSyncData: true,
          canViewData: true,
        });
      }
    };

    loadTeamContext();
  }, [user]);

  return context;
};
