import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, Plus, Crown, Shield, User, Mail, Trash2, Edit2, Clock, Loader2, Lock, Sparkles } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
// Use the wrapper client for session consistency
import { supabase } from '@/lib/supabase-client-wrapper';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
const MAX_COLLABORATORS = 6;
type MemberRole = 'owner' | 'super_admin' | 'admin' | 'member';
const roleIcons: Record<MemberRole, any> = {
  owner: Crown,
  super_admin: Crown,
  admin: Shield,
  member: User
};
const roleLabels: Record<MemberRole, string> = {
  owner: 'Super Administrator',
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  member: 'Member'
};
const roleColors: Record<MemberRole, string> = {
  owner: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  super_admin: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  member: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
};
interface TeamMember {
  id: string;
  role: MemberRole;
  user_id: string;
  joined_at: string;
  email: string;
  name: string;
  isOwner: boolean;
}
interface PendingInvite {
  id: string;
  email: string;
  role: MemberRole;
  created_at: string;
  isPending?: boolean;
}
export const CollaboratorsTab = () => {
  const {
    user
  } = useAuth();
  const {
    credits,
    loading: creditsLoading
  } = useCredits();
  const {
    toast
  } = useToast();
  const [isCustomSolution, setIsCustomSolution] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [activeView, setActiveView] = useState<'members' | 'pending'>('members');

  // Add member dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberTitle, setNewMemberTitle] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>('member');
  const [isInviting, setIsInviting] = useState(false);

  // Edit dialog
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<MemberRole>('member');

  // Delete confirmation
  const [deletingMember, setDeletingMember] = useState<(TeamMember | PendingInvite) | null>(null);
  useEffect(() => {
    checkAccess();
    loadCollaborators();
    
    // Subscribe to team_members changes for real-time updates
    if (user) {
      const channel = supabase
        .channel('collaborators-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'team_members',
        }, () => {
          console.log('[CollaboratorsTab] Team members changed, reloading...');
          loadCollaborators();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'team_invitations',
        }, () => {
          console.log('[CollaboratorsTab] Team invitations changed, reloading...');
          loadCollaborators();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  const checkAccess = async () => {
    if (!user) {
      setAccessChecked(true);
      return;
    }
    try {
      const {
        data
      } = await supabase.from('profiles').select('is_custom_solution').eq('user_id', user.id).single();
      setIsCustomSolution(data?.is_custom_solution || false);
    } finally {
      setAccessChecked(true);
    }
  };
  const loadCollaborators = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get user's team
      const {
        data: teamMembership
      } = await supabase.from('team_members').select('team_id, role').eq('user_id', user.id).eq('role', 'owner').maybeSingle();
      if (teamMembership?.team_id) {
        // Load members with separate profile fetch
        const membersResult: any = await supabase.from('team_members').select('id, role, user_id, joined_at').eq('team_id', teamMembership.team_id);
        const teamMembers = membersResult.data as {
          id: string;
          role: string;
          user_id: string;
          joined_at: string;
        }[] | null;

        // Load pending invites (pending = accepted_at is null)
        const invitesResult = await supabase.from('team_invitations').select('id, email, role, created_at').eq('team_id', teamMembership.team_id).is('accepted_at', null);
        const invites = (invitesResult?.data || []) as {
          id: string;
          email: string;
          role: string;
          created_at: string;
        }[];

        // Get profiles for members - now includes email
        const membersWithProfiles: TeamMember[] = await Promise.all((teamMembers || []).map(async member => {
          // Get profile for this user including email
          const {
            data: profile
          } = await supabase.from('profiles').select('full_name, avatar_url, email').eq('user_id', member.user_id).maybeSingle();
          const isOwner = member.user_id === user.id;
          return {
            id: member.id,
            role: member.role as MemberRole,
            user_id: member.user_id,
            joined_at: member.joined_at,
            // Use profile email, fallback to user.email for owner
            email: profile?.email || (isOwner ? user.email || '' : 'No email'),
            name: profile?.full_name || (isOwner ? 'You' : 'Team Member'),
            isOwner
          };
        }));
        console.log('[CollaboratorsTab] Members loaded:', membersWithProfiles.map(m => ({
          id: m.id,
          role: m.role,
          isOwner: m.isOwner,
          user_id: m.user_id
        })));
        console.log('[CollaboratorsTab] Current user ID:', user.id);
        setMembers(membersWithProfiles);
        setPendingInvites((invites || []).map(inv => ({
          ...inv,
          role: inv.role as MemberRole
        })));
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  // Wait for credits to load before determining access
  const hasAccess = !creditsLoading && (credits?.tier === 'ceo' || isCustomSolution);
  const isCheckingAccess = creditsLoading || !accessChecked;
  const nonOwnerMembers = members.filter(m => !m.isOwner);
  const totalUsed = nonOwnerMembers.length + pendingInvites.length;
  const canAddMore = totalUsed < MAX_COLLABORATORS;
  console.log('[CollaboratorsTab] Count calculation:', {
    totalMembers: members.length,
    nonOwnerMembersCount: nonOwnerMembers.length,
    pendingInvitesCount: pendingInvites.length,
    totalUsed,
    memberDetails: members.map(m => ({
      id: m.id,
      isOwner: m.isOwner,
      role: m.role
    }))
  });
  const handleAddMemberClick = () => {
    if (hasAccess) {
      setShowAddDialog(true);
    } else {
      setShowUpgradeDialog(true);
    }
  };
  const handleInvite = async () => {
    if (!newMemberEmail.trim() || !user) return;
    setIsInviting(true);
    try {
      // Get inviter name from profile FIRST (needed for team name)
      const {
        data: profile
      } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
      const inviterName = profile?.full_name || user.email?.split('@')[0] || 'Team Admin';
      
      // Format team name as "[Owner Name]'s Team"
      const ownerFirstName = inviterName.split(' ')[0];
      const formattedTeamName = `${ownerFirstName}'s Team`;
      
      // Get or create team
      let teamId: string | null = null;
      const {
        data: existingTeam
      } = await supabase.from('team_members').select('team_id, teams(name)').eq('user_id', user.id).eq('role', 'owner').maybeSingle();
      
      if (existingTeam?.team_id) {
        teamId = existingTeam.team_id;
        
        // Update team name to use owner's name if it was "My Team"
        const currentName = (existingTeam as any).teams?.name;
        if (currentName === 'My Team') {
          await supabase.from('teams').update({ name: formattedTeamName }).eq('id', teamId);
        }
      } else {
        // Create a new team with owner's name
        const {
          data: newTeam,
          error: teamError
        } = await supabase.from('teams').insert({
          name: formattedTeamName,
          owner_id: user.id
        }).select().single();
        if (teamError) throw teamError;
        teamId = newTeam.id;

        // Add owner as team member
        await supabase.from('team_members').insert({
          team_id: teamId,
          user_id: user.id,
          role: 'owner'
        });
      }

      // First, create the team invitation record
      const {
        error: inviteError
      } = await supabase.from('team_invitations').insert({
        team_id: teamId,
        email: newMemberEmail.trim().toLowerCase(),
        role: newMemberRole,
        invited_by: user.id
      });
      if (inviteError) {
        if (inviteError.code === '23505') {
          throw new Error('This email has already been invited.');
        }
        throw inviteError;
      }

      // Send invitation via edge function
      const {
        error
      } = await supabase.functions.invoke('invite-team-member', {
        body: {
          teamId,
          teamName: formattedTeamName,
          inviterName,
          email: newMemberEmail.trim().toLowerCase(),
          role: newMemberRole
        }
      });
      if (error) throw error;
      toast({
        title: 'Invitation sent!',
        description: `${newMemberEmail} will receive an email to join your team.`
      });
      setShowAddDialog(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberTitle('');
      setNewMemberRole('member');
      loadCollaborators();
    } catch (error: any) {
      console.error('Error inviting:', error);
      toast({
        title: 'Failed to send invitation',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsInviting(false);
    }
  };
  const handleRemoveMember = async () => {
    if (!deletingMember) return;
    try {
      if ('isPending' in deletingMember && deletingMember.isPending) {
        // Cancel invitation
        await supabase.from('team_invitations').delete().eq('id', deletingMember.id);
      } else {
        // Get team info for notification
        const member = deletingMember as TeamMember;
        const {
          data: teamMembership
        } = await supabase.from('team_members').select('team_id, teams(name)').eq('user_id', user?.id).eq('role', 'owner').maybeSingle();

        // Remove member
        await supabase.from('team_members').delete().eq('id', deletingMember.id);

        // Send removal notification email
        if (teamMembership?.team_id && member.email) {
          await supabase.functions.invoke('team-notifications', {
            body: {
              type: 'member_removed',
              teamId: teamMembership.team_id,
              memberEmail: member.email,
              memberName: member.name,
              teamName: (teamMembership as any).teams?.name
            }
          });
        }
      }
      toast({
        title: 'Removed successfully'
      });
      setDeletingMember(null);
      loadCollaborators();
    } catch (error) {
      toast({
        title: 'Failed to remove',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };
  const handleUpdateRole = async () => {
    if (!editingMember) return;
    try {
      await supabase.from('team_members').update({
        role: editRole
      }).eq('id', editingMember.id);
      toast({
        title: 'Role updated'
      });
      setEditingMember(null);
      loadCollaborators();
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Show loading while checking access, credits, or loading data
  if (isCheckingAccess || loading) {
    return <div className="flex-1 flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>;
  }
  return <div className="flex-1 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pr-8">
        <div>
          <h2 className="font-serif text-2xl text-white mb-1">Collaborators</h2>
        <p className="text-slate-400 text-sm">
          {Math.max(0, members.length - 1 + pendingInvites.length)} of {MAX_COLLABORATORS} members added
        </p>
      </div>
        <Button onClick={handleAddMemberClick} disabled={!canAddMore && hasAccess} className="bg-white text-black hover:bg-slate-200">
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300" style={{
          width: `${totalUsed / MAX_COLLABORATORS * 100}%`
        }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveView('members')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'members' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
          Members ({members.length})
        </button>
        <button onClick={() => setActiveView('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'pending' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
          Pending ({pendingInvites.length})
        </button>
      </div>

      {/* Members list */}
      {activeView === 'members' && <div className="space-y-3">
          {members.length === 0 ? <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No members yet</p>
              <p className="text-slate-500 text-sm mt-1">Add your first collaborator to get started</p>
            </div> : members.map(member => {
        const RoleIcon = roleIcons[member.role] || User;
        return <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{member.name}</p>
                        {member.isOwner && <span className="text-xs text-slate-500">(You)</span>}
                      </div>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={`${roleColors[member.role]} border text-xs`}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {roleLabels[member.role]}
                    </Badge>
                    
                    {!member.isOwner && <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10" onClick={() => {
                setEditingMember(member);
                setEditRole(member.role);
              }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeletingMember(member)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>}
                  </div>
                </div>;
      })}
        </div>}

      {/* Pending invites */}
      {activeView === 'pending' && <div className="space-y-3">
          {pendingInvites.length === 0 ? <div className="text-center py-12">
              <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No pending invitations</p>
            </div> : pendingInvites.map(invite => <div key={invite.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{invite.email}</p>
                    <p className="text-sm text-slate-500">
                      Invited {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={`${roleColors[invite.role]} border text-xs`}>
                    {roleLabels[invite.role]}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeletingMember({
            ...invite,
            isPending: true
          })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>)}
        </div>}

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Team Member</DialogTitle>
            <DialogDescription className="text-slate-400">
              Send an invitation to join your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Name (optional)</Label>
              <Input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="John Doe" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email *</Label>
              <Input type="email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} placeholder="john@company.com" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Title (optional)</Label>
              <Input value={newMemberTitle} onChange={e => setNewMemberTitle(e.target.value)} placeholder="CFO, Accountant, etc." className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Role</Label>
              <Select value={newMemberRole} onValueChange={(v: MemberRole) => setNewMemberRole(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="member" className="text-slate-300 focus:bg-white/10 focus:text-white">
                    Member - Can view and interact with data
                  </SelectItem>
                  <SelectItem value="admin" className="text-slate-300 focus:bg-white/10 focus:text-white">
                    Administrator - Can manage members
                  </SelectItem>
                  <SelectItem value="super_admin" className="text-slate-300 focus:bg-white/10 focus:text-white">
                    Super Administrator - Full control including billing
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-white/10 text-slate-300 hover:bg-white/10 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={!newMemberEmail.trim() || isInviting} className="bg-white text-black hover:bg-slate-200">
                {isInviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Role</DialogTitle>
            <DialogDescription className="text-slate-400">
              Change role for {editingMember?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Select value={editRole} onValueChange={(v: MemberRole) => setEditRole(v)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                <SelectItem value="member" className="text-slate-300 focus:bg-white/10 focus:text-white">Member</SelectItem>
                <SelectItem value="admin" className="text-slate-300 focus:bg-white/10 focus:text-white">Administrator</SelectItem>
                <SelectItem value="super_admin" className="text-slate-300 focus:bg-white/10 focus:text-white">Super Administrator</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingMember(null)} className="border-white/10 text-slate-300 hover:bg-white/10 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleUpdateRole} className="bg-white text-black hover:bg-slate-200">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
        <AlertDialogContent className="bg-[#1a1a1a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {'isPending' in (deletingMember || {}) ? 'Cancel Invitation?' : 'Remove Member?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {'isPending' in (deletingMember || {}) ? `This will cancel the invitation to ${deletingMember?.email}.` : `This will remove ${'name' in (deletingMember || {}) ? (deletingMember as TeamMember)?.name : ''} from your team.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-slate-300 hover:bg-white/10 bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600 hover:bg-red-700 text-white">
              {'isPending' in (deletingMember || {}) ? 'Cancel Invitation' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-md">
          <DialogHeader className="text-center pb-2">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl rotate-6 opacity-80" />
              <div className="relative flex items-center justify-center h-full bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-yellow-900" />
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold text-white">
              Unlock Collaborators
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-2">
              Invite up to 6 team members to collaborate on your financial intelligence.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10 my-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 text-xs">✓</span>
              </div>
              <span>Add up to 6 collaborators</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 text-xs">✓</span>
              </div>
              <span>Member, Administrator & Super Administrator roles</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 text-xs">✓</span>
              </div>
              <span>SSO and email invitations</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" onClick={() => {
            setShowUpgradeDialog(false);
            window.dispatchEvent(new CustomEvent('openSettings', {
              detail: {
                tab: 'plan-credits'
              }
            }));
          }}>
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to CFO Plan
            </Button>
            
            <p className="text-xs text-slate-500 text-center">Available on the CFO plan or Custom Solutions</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default CollaboratorsTab;