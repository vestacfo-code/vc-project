import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Plus, Settings, Crown, Shield, Eye, User, Mail, Calendar, MoreHorizontal, Sparkles, Lock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTeams } from '@/hooks/useTeams';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Role display mapping
const roleDisplayNames: Record<string, string> = {
  owner: 'Super Administrator',
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  collaborator: 'Member',
  member: 'Member',
  viewer: 'Viewer',
};

const roleIcons = {
  owner: Crown,
  super_admin: Crown,
  admin: Shield,
  collaborator: User,
  member: User,
  viewer: Eye,
};

const roleColors = {
  owner: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  super_admin: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  admin: 'bg-blue-500/10 text-blue-700 border-blue-200',
  collaborator: 'bg-green-500/10 text-green-700 border-green-200',
  member: 'bg-green-500/10 text-green-700 border-green-200',
  viewer: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

export const TeamManagement = () => {
  const { user } = useAuth();
  const { credits } = useCredits();
  const [isCustomSolution, setIsCustomSolution] = useState(false);
  const {
    teams,
    members,
    invitations,
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
    loading,
  } = useTeams();

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'super_admin' | 'admin' | 'member' | 'viewer'>('member');

  const currentTeam = teams.find(t => t.id === selectedTeam);
  const userRole = selectedTeam ? getUserRole(selectedTeam) : null;
  const canManage = selectedTeam ? canManageTeam(selectedTeam) : false;

  // Check if user is custom solution
  useEffect(() => {
    const checkCustomSolution = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_custom_solution')
        .eq('user_id', user.id)
        .single();
      setIsCustomSolution(data?.is_custom_solution || false);
    };
    checkCustomSolution();
  }, [user]);

  // Check if user has access to team features - CFO tier or custom solution users only
  const hasTeamAccess = credits?.tier === 'ceo' || isCustomSolution;
  const maxCollaborators = credits?.max_collaborators || 6; // Default to 6 for team access users
  const currentCollaboratorCount = members.filter(m => m.role !== 'owner' && m.role !== 'super_admin').length;

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    
    try {
      await createTeam(teamName, teamDescription);
      setTeamName('');
      setTeamDescription('');
      setShowCreateTeam(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleUpdateTeam = async () => {
    if (!currentTeam || !teamName.trim()) return;
    
    try {
      await updateTeam(currentTeam.id, {
        name: teamName,
        description: teamDescription,
      });
      setShowEditTeam(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;
    
    try {
      await inviteTeamMember(selectedTeam, inviteEmail, inviteRole);
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteMember(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const openEditTeam = () => {
    if (currentTeam) {
      setTeamName(currentTeam.name);
      setTeamDescription(currentTeam.description || '');
      setShowEditTeam(true);
    }
  };

  if (!hasTeamAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Gradient icon container */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl rotate-6 opacity-80" />
            <div className="relative flex items-center justify-center h-full bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-yellow-900" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Unlock Team Collaboration
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Invite up to 6 team members to collaborate on your financial intelligence. 
              Each member gets their own login and personalized access.
            </p>
          </div>

          {/* Features */}
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span>Add up to 6 collaborators</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span>Assign roles: Member, Administrator, Super Administrator</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span>SSO and email invitations</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span>250 monthly credits included</span>
            </div>
          </div>

          <Button 
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openSettings', { 
                detail: { tab: 'plan-credits' } 
              }));
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to CFO Plan
          </Button>
          
          <p className="text-xs text-gray-400">
            Available on CFO plan ($49/month) or Custom Solutions
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Team Management</span>
              </CardTitle>
              <CardDescription>
                Manage your teams and collaborators ({currentCollaboratorCount}/{maxCollaborators} collaborators used)
              </CardDescription>
            </div>
            <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Create a new team to collaborate with others
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teamDescription">Description (Optional)</Label>
                    <Textarea
                      id="teamDescription"
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      placeholder="Enter team description"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTeam} disabled={!teamName.trim()}>
                      Create Team
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Team Selector */}
      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTeam === team.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{team.name}</h3>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={roleColors[getUserRole(team.id) || 'viewer']}>
                        {getUserRole(team.id)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Details */}
      {currentTeam && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{currentTeam.name}</span>
                  <Badge variant="outline" className={roleColors[userRole || 'viewer']}>
                    {userRole}
                  </Badge>
                </CardTitle>
                {currentTeam.description && (
                  <CardDescription>{currentTeam.description}</CardDescription>
                )}
              </div>
              {canManage && (
                <div className="flex space-x-2">
                  <Dialog open={showInviteMember} onOpenChange={setShowInviteMember}>
                    <DialogTrigger asChild>
                      <Button variant="outline" disabled={currentCollaboratorCount >= maxCollaborators}>
                        <Plus className="w-4 h-4 mr-2" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to join your team
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="inviteEmail">Email Address</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="inviteRole">Role</Label>
                          <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="super_admin">Super Administrator - Full control including billing</SelectItem>
                              <SelectItem value="admin">Administrator - Can manage team and members</SelectItem>
                              <SelectItem value="member">Member - Can view and interact with data</SelectItem>
                              <SelectItem value="viewer">Viewer - Can only view data</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowInviteMember(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleInviteMember} disabled={!inviteEmail.trim()}>
                            Send Invitation
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="icon" onClick={openEditTeam}>
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="members" className="w-full">
              <TabsList>
                <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                <TabsTrigger value="invitations">Pending Invitations ({invitations.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="members" className="space-y-4">
                {members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No team members yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => {
                      const RoleIcon = roleIcons[member.role];
                      return (
                        <Card key={member.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <RoleIcon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {member.profiles?.full_name || member.profiles?.email || 'Unknown User'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {member.profiles?.email}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className={roleColors[member.role]}>
                                      {member.role}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Joined {new Date(member.joined_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {canManage && member.role !== 'owner' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'admin')}>
                                      Make Admin
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'collaborator')}>
                                      Make Collaborator
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'viewer')}>
                                      Make Viewer
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                          Remove Member
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to remove this member from the team? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => removeMember(member.id)}>
                                            Remove Member
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="invitations" className="space-y-4">
                {invitations.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No pending invitations</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invitations.map((invitation) => (
                      <Card key={invitation.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Mail className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{invitation.email}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className={roleColors[invitation.role]}>
                                    {invitation.role}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Invited {new Date(invitation.created_at).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Expires {new Date(invitation.expires_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelInvitation(invitation.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Edit Team Dialog */}
      <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update your team information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTeamName">Team Name</Label>
              <Input
                id="editTeamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
            <div>
              <Label htmlFor="editTeamDescription">Description (Optional)</Label>
              <Textarea
                id="editTeamDescription"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Enter team description"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditTeam(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTeam} disabled={!teamName.trim()}>
                Update Team
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {teams.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              No teams yet. Create your first team to start collaborating.
            </p>
            <Button onClick={() => setShowCreateTeam(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};