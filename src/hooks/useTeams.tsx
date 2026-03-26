import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getRedirectUrl } from '@/lib/constants';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'collaborator' | 'viewer' | 'owner' | 'member';
  invited_by: string | null;
  joined_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'collaborator' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export const useTeams = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Load user's teams
  const loadTeams = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
      
      // Select first team if none selected
      if (data && data.length > 0 && !selectedTeam) {
        setSelectedTeam(data[0].id);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load team members
  const loadMembers = async (teamId: string) => {
    try {
      // First get team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      // Then get profile data for each member
      const memberIds = membersData?.map(member => member.user_id) || [];
      let profilesData = [];
      
      if (memberIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', memberIds);
        
        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      // Combine the data
      const membersWithProfiles = membersData?.map(member => ({
        ...member,
        profiles: profilesData.find(profile => profile.user_id === member.user_id) || null
      })) || [];

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    }
  };

  // Load team invitations
  const loadInvitations = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      setInvitations((data as any) || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  // Create new team
  const createTeam = async (name: string, description?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name,
          description,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadTeams();
      setSelectedTeam(data.id);
      
      toast({
        title: "Success",
        description: "Team created successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update team
  const updateTeam = async (teamId: string, updates: Partial<Pick<Team, 'name' | 'description'>>) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);

      if (error) throw error;
      
      await loadTeams();
      
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating team:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update team",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Invite team member
  const inviteTeamMember = async (teamId: string, email: string, role: 'super_admin' | 'admin' | 'member' | 'collaborator' | 'viewer') => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          email,
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Send invitation using the edge function
      try {
        const team = teams.find(t => t.id === teamId);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();

        const { data: inviteResult, error: inviteError } = await supabase.functions.invoke('invite-team-member', {
          body: {
            email,
            teamName: team?.name || 'Team',
            inviterName: profile?.full_name || user.email || 'Someone',
            role,
            teamId,
            redirectTo: getRedirectUrl(`/dashboard?tab=teams&team=${teamId}`),
          }
        });

        if (inviteError) {
          throw inviteError;
        }

        console.log('Invitation result:', inviteResult);
        
        // If user already existed and was added directly, refresh members immediately
        if (inviteResult?.userExists) {
          await loadMembers(teamId);
          toast({
            title: "Success",
            description: `${email} has been added to the team`,
          });
          return data;
        }
      } catch (emailError) {
        console.error('Error sending invitation:', emailError);
        
        // Handle specific errors
        if (emailError.message?.includes('email_exists')) {
          toast({
            title: "User Already Invited",
            description: "This user has already been invited to Finlo. They may need to check their email or contact support.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invitation Error", 
            description: "Failed to send invitation email, but invitation was created",
            variant: "destructive",
          });
        }
        throw emailError;
      }
      
      await loadInvitations(teamId);
      
      toast({
        title: "Success",
        description: `Invitation sent to ${email}`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error inviting member:', error);
      
      if (error.message?.includes('Collaborator limit exceeded')) {
        toast({
          title: "Collaborator Limit Exceeded",
          description: error.message,
          variant: "destructive",
        });
      } else if (error.code === '23505') {
        toast({
          title: "Error",
          description: "This email has already been invited to this team",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send invitation",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, role: 'super_admin' | 'admin' | 'member' | 'collaborator' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
      
      if (selectedTeam) {
        await loadMembers(selectedTeam);
      }
      
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update member role",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Remove team member
  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      if (selectedTeam) {
        await loadMembers(selectedTeam);
      }
      
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      
      if (selectedTeam) {
        await loadInvitations(selectedTeam);
      }
      
      toast({
        title: "Success",
        description: "Invitation cancelled",
      });
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invitation",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get user's role in a team
  const getUserRole = (teamId: string): 'super_admin' | 'admin' | 'collaborator' | 'viewer' | 'owner' | 'member' | null => {
    if (!user) return null;
    
    const team = teams.find(t => t.id === teamId);
    if (team?.owner_id === user.id) return 'owner';
    
    const member = members.find(m => m.team_id === teamId && m.user_id === user.id);
    return member?.role || null;
  };

  // Check if user can manage team
  const canManageTeam = (teamId: string): boolean => {
    const role = getUserRole(teamId);
    return role === 'owner' || role === 'admin' || role === 'super_admin';
  };

  // Load data when user or selected team changes
  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      loadMembers(selectedTeam);
      loadInvitations(selectedTeam);
    }
  }, [selectedTeam]);

  return {
    teams,
    members,
    invitations,
    loading,
    selectedTeam,
    setSelectedTeam,
    createTeam,
    updateTeam,
    inviteTeamMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    getUserRole,
    canManageTeam,
    refreshTeams: loadTeams,
    refreshMembers: () => selectedTeam && loadMembers(selectedTeam),
    refreshInvitations: () => selectedTeam && loadInvitations(selectedTeam),
  };
};