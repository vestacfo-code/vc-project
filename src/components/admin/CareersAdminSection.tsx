import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, Users, Briefcase, Link as LinkIcon, Calendar, Edit, Trash2, Plus, Download } from 'lucide-react';
import { WelcomeLinkGenerator } from './WelcomeLinkGenerator';
import { StaffDirectory } from './StaffDirectory';
import { CustomQuestionBuilder } from './CustomQuestionBuilder';
import { CustomQuestion } from '@/types/customQuestions';

interface JobApplication {
  id: string;
  job_role_id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  instagram_handle: string;
  linkedin_url: string;
  resume_url: string;
  work_authorization: string;
  earliest_start_date: string;
  why_work_here: string;
  reference_info: string;
  background_check_consent: boolean;
  privacy_policy_consent: boolean;
  status: string;
  created_at: string;
  additional_info?: string;
  custom_answers?: Record<string, any>;
  job_roles: {
    title: string;
    department: string;
    custom_questions?: CustomQuestion[];
  };
}

interface JobRole {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary_range: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  custom_questions?: CustomQuestion[];
}

interface WelcomeLink {
  id: string;
  applicant_name: string;
  slug: string;
  start_date: string;
  status: string;
  created_at: string;
  application_id: string;
  supervisors: any; // JSON from database
}

interface CareersAdminSectionProps {
  initialApplications?: JobApplication[];
  initialJobRoles?: JobRole[];
  onDataUpdate?: () => Promise<void>;
  hasPermission?: (permission: string) => boolean;
  isSuperAdmin?: boolean;
  userRoles?: string[];
}

export const CareersAdminSection = ({ 
  initialApplications = [], 
  initialJobRoles = [], 
  onDataUpdate,
  hasPermission = () => false,
  isSuperAdmin = false,
  userRoles = []
}: CareersAdminSectionProps) => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications);
  const [jobRoles, setJobRoles] = useState<JobRole[]>(initialJobRoles);
  const [welcomeLinks, setWelcomeLinks] = useState<WelcomeLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [editingRole, setEditingRole] = useState<JobRole | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRole, setNewRole] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time',
    description: '',
    requirements: '',
    salary_range: '',
    custom_questions: [] as CustomQuestion[]
  });
  const [autoOpenWelcomeFor, setAutoOpenWelcomeFor] = useState<JobApplication | null>(null);

  useEffect(() => {
    loadWelcomeLinks();
  }, []);

  useEffect(() => {
    setApplications(initialApplications);
    setJobRoles(initialJobRoles);
  }, [initialApplications, initialJobRoles]);

  const loadWelcomeLinks = async () => {
    setLoading(true);
    try {
      // Only load welcome links since applications and job roles are passed as props
      const { data: linksData, error: linksError } = await supabase
        .from('welcome_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;
      setWelcomeLinks(linksData || []);
    } catch (error) {
      console.error('Error loading welcome links:', error);
      toast({
        title: "Error",
        description: "Failed to load welcome links",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    await loadWelcomeLinks();
    // Trigger parent component to refresh applications data
    if (onDataUpdate) {
      await onDataUpdate();
    }
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    console.log(`Starting status update for application ${id} to: ${status}`);
    
    setUpdatingStatus(id); // Set loading state for this specific application
    
    try {
      // Use the careers-admin-auth edge function to update status with admin privileges
      const { data, error } = await supabase.functions.invoke('careers-admin-auth', {
        body: {
          userId: 'admin@vesta.ai',
          password: 'bull.market19',
          action: 'updateStatus',
          applicationId: id,
          status: status
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('Status update failed:', data?.error);
        throw new Error(data?.error || 'Failed to update status');
      }

      console.log('Status update successful:', data);

      toast({
        title: "Status Updated",
        description: `Application status changed to ${status}`,
      });

      // Auto-open welcome link generator if status is accepted
      if (status === 'accepted') {
        const application = applications.find(app => app.id === id);
        if (application) {
          setAutoOpenWelcomeFor(application);
        }
      }

      // Refresh data from parent to get the updated state
      console.log('Refreshing admin data...');
      if (onDataUpdate) {
        await onDataUpdate();
      }

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update application status",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(null); // Clear loading state
    }
  };

  const toggleJobRoleStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('job_roles')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      setJobRoles(prev =>
        prev.map(role =>
          role.id === id ? { ...role, is_active: !isActive } : role
        )
      );

      toast({
        title: "Job Role Updated",
        description: `Job role ${!isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating job role:', error);
      toast({
        title: "Error",
        description: "Failed to update job role",
        variant: "destructive"
      });
    }
  };

  const saveJobRole = async () => {
    try {
      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from('job_roles')
          .update({
            title: newRole.title,
            department: newRole.department,
            location: newRole.location,
            type: newRole.type,
            description: newRole.description,
            requirements: newRole.requirements,
            salary_range: newRole.salary_range,
            custom_questions: JSON.parse(JSON.stringify(newRole.custom_questions))
          })
          .eq('id', editingRole.id);

        if (error) throw error;

        setJobRoles(prev =>
          prev.map(role =>
            role.id === editingRole.id ? { ...role, ...newRole } : role
          )
        );

        toast({
          title: "Role Updated",
          description: "Job role has been updated successfully",
        });
      } else {
        // Create new role - slug will be auto-generated
        const insertData: any = {
          title: newRole.title,
          department: newRole.department,
          location: newRole.location,
          type: newRole.type,
          description: newRole.description,
          requirements: newRole.requirements,
          salary_range: newRole.salary_range,
          custom_questions: JSON.parse(JSON.stringify(newRole.custom_questions))
        };

        const { data, error } = await supabase
          .from('job_roles')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        const parsedData = {
          ...data,
          custom_questions: data.custom_questions as unknown as CustomQuestion[]
        } as JobRole;

        setJobRoles(prev => [parsedData, ...prev]);

        toast({
          title: "Role Created",
          description: "New job role has been created successfully",
        });
      }

      setShowRoleDialog(false);
      setEditingRole(null);
      setNewRole({
        title: '',
        department: '',
        location: '',
        type: 'full-time',
        description: '',
        requirements: '',
        salary_range: '',
        custom_questions: []
      });
    } catch (error) {
      console.error('Error saving job role:', error);
      toast({
        title: "Error",
        description: "Failed to save job role",
        variant: "destructive"
      });
    }
  };

  const deleteWelcomeLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('welcome_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadWelcomeLinks();
      toast({
        title: "Success",
        description: "Welcome link deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting welcome link:', error);
      toast({
        title: "Error", 
        description: "Failed to delete welcome link",
        variant: "destructive"
      });
    }
  };

  const editWelcomeLink = async (id: string) => {
    // For now, just show a toast - can be expanded later
    toast({
      title: "Edit Feature",
      description: "Edit functionality coming soon",
    });
  };

  const deleteJobRole = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJobRoles(prev => prev.filter(role => role.id !== id));

      toast({
        title: "Role Deleted",
        description: "Job role has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting job role:', error);
      toast({
        title: "Error",
        description: "Failed to delete job role",
        variant: "destructive"
      });
    }
  };

  const openRoleDialog = (role?: JobRole) => {
    if (role) {
      setEditingRole(role);
      setNewRole({
        title: role.title,
        department: role.department,
        location: role.location,
        type: role.type,
        description: role.description,
        requirements: role.requirements,
        salary_range: role.salary_range || '',
        custom_questions: role.custom_questions || []
      });
    } else {
      setEditingRole(null);
      setNewRole({
        title: '',
        department: '',
        location: '',
        type: 'full-time',
        description: '',
        requirements: '',
        salary_range: '',
        custom_questions: []
      });
    }
    setShowRoleDialog(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'reviewing': return 'default';
      case 'interviewed': return 'default';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredWelcomeLinks = welcomeLinks.filter(link =>
    link.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const acceptedApplications = applications.filter(app => app.status === 'accepted');

  // Group applications by job role ID (not title, so renaming works)
  const applicationsByRole = jobRoles.map(role => ({
    role,
    applications: applications.filter(app => app.job_role_id === role.id)
  }));

  return (
    <div className="space-y-8">
      <Tabs defaultValue="applications" className="space-y-3 sm:space-y-6">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-0.5 sm:p-1 bg-muted/50 rounded-lg gap-0.5">
          <TabsTrigger value="applications" className="flex-col sm:flex-row gap-0.5 sm:gap-2 px-2 sm:px-4 py-2 text-[10px] sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-sm">Applications</span>
          </TabsTrigger>
          <TabsTrigger value="welcome-links" className="flex-col sm:flex-row gap-0.5 sm:gap-2 px-2 sm:px-4 py-2 text-[10px] sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LinkIcon className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-sm">Links</span>
          </TabsTrigger>
          <TabsTrigger value="staff-directory" className="flex-col sm:flex-row gap-0.5 sm:gap-2 px-2 sm:px-4 py-2 text-[10px] sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-sm">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="job-roles" className="flex-col sm:flex-row gap-0.5 sm:gap-2 px-2 sm:px-4 py-2 text-[10px] sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Briefcase className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="text-[10px] sm:text-sm">Roles</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="text-lg text-gray-600">Loading...</div>
            </div>
          ) : applicationsByRole.length === 0 ? (
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardContent className="text-center py-16">
                <div className="text-gray-600">No applications yet</div>
              </CardContent>
            </Card>
          ) : (
            applicationsByRole.map(({ role, applications: roleApplications }) => (
              <Card key={role.id} className="bg-card border border-border rounded-xl shadow-sm mb-6">
                <CardHeader className="border-b border-border pb-3 sm:pb-4">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-foreground text-sm sm:text-xl">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-sm sm:text-xl">{role.title} - {role.department}</span>
                    </div>
                    <Badge className="bg-muted text-muted-foreground border border-border rounded-lg text-[10px] sm:text-xs self-start sm:self-auto">
                      {roleApplications.length} apps
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  {roleApplications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No applications for this role yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[120px]">Name</TableHead>
                            <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[150px]">Email</TableHead>
                            <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[120px] hidden md:table-cell">Location</TableHead>
                            <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[80px]">Status</TableHead>
                            <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[80px] hidden lg:table-cell">Applied</TableHead>
                            <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[200px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roleApplications.map((app) => (
                            <TableRow key={app.id} className="border-border">
                              <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                                <div className="truncate max-w-[120px]">{app.full_name}</div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs sm:text-sm">
                                <div className="truncate max-w-[150px]">{app.email}</div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                                <div className="truncate max-w-[120px]">{app.city}, {app.state}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(app.status)} className="capitalize text-[10px] sm:text-xs">
                                  {app.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                                {new Date(app.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 sm:gap-2 items-center flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedApplication(app)}
                                    className="border-border text-foreground hover:bg-muted rounded-xl h-8 w-8 p-0"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  {app.resume_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(app.resume_url, '_blank')}
                                      className="border-border text-foreground hover:bg-muted rounded-xl h-8 w-8 p-0"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Select 
                                    value={app.status} 
                                    onValueChange={(value) => updateApplicationStatus(app.id, value)}
                                    disabled={updatingStatus === app.id}
                                  >
                                    <SelectTrigger className="w-28 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="reviewing">Reviewing</SelectItem>
                                      <SelectItem value="interviewed">Interviewed</SelectItem>
                                      <SelectItem value="accepted">Accepted</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="welcome-links" className="space-y-6">
          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <span className="truncate">Welcome Links ({welcomeLinks.length})</span>
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Input
                  placeholder="Search links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:max-w-sm text-sm"
                />
                <WelcomeLinkGenerator 
                  acceptedApplications={acceptedApplications}
                  onLinkGenerated={() => {
                    loadData();
                    setAutoOpenWelcomeFor(null);
                  }}
                  autoOpenForApplication={autoOpenWelcomeFor}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {filteredWelcomeLinks.map((link) => (
                  <Card key={link.id} className="p-3 sm:p-4 bg-card border border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{link.applicant_name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          vesta.ai/welcome/{link.slug}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Start: {link.start_date ? (() => {
                            const date = new Date(link.start_date + 'T12:00:00');
                            return date.toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            });
                          })() : 'Not set'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Badge variant={link.status === 'active' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                          {link.status}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => editWelcomeLink(link.id)}
                          className="border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl h-8 w-8 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteWelcomeLink(link.id)}
                          className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff-directory" className="space-y-6">
          <StaffDirectory 
            acceptedApplications={acceptedApplications}
            onRefresh={loadData}
          />
          <WelcomeLinkGenerator 
            acceptedApplications={acceptedApplications}
            onLinkGenerated={() => {
              loadData();
              setAutoOpenWelcomeFor(null); // Clear auto-open state after link generation
            }}
            autoOpenForApplication={autoOpenWelcomeFor}
          />
        </TabsContent>

        <TabsContent value="job-roles" className="space-y-6">
          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 sm:pb-4 space-y-3 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-foreground text-lg sm:text-2xl">Job Roles</CardTitle>
                <p className="text-muted-foreground mt-0.5 sm:mt-1 text-xs sm:text-sm">Create, edit, and manage openings</p>
              </div>
              <Button 
                onClick={() => openRoleDialog()}
                className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl px-4 sm:px-6 py-2 font-medium text-sm h-9"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Role
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
              ) : (
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[120px]">Title</TableHead>
                        <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[100px] hidden md:table-cell">Department</TableHead>
                        <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[100px] hidden lg:table-cell">Location</TableHead>
                        <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[80px] hidden lg:table-cell">Type</TableHead>
                        <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[80px]">Status</TableHead>
                        <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[140px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobRoles.map((role) => (
                        <TableRow key={role.id} className="border-border">
                          <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                            <div className="truncate max-w-[120px]">{role.title}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                            <div className="truncate max-w-[100px]">{role.department}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                            <div className="truncate max-w-[100px]">{role.location}</div>
                          </TableCell>
                          <TableCell className="capitalize text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                            {role.type}
                          </TableCell>
                          <TableCell>
                            <Badge variant={role.is_active ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                              {role.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRoleDialog(role)}
                                className="border-border text-foreground hover:bg-muted rounded-lg h-8 w-8 p-0"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleJobRoleStatus(role.id, role.is_active)}
                                className="border-border text-foreground hover:bg-muted rounded-lg text-xs h-8 px-2"
                              >
                                {role.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteJobRole(role.id)}
                                className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingRole ? 'Edit Job Role' : 'Create New Job Role'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={newRole.title}
                  onChange={(e) => setNewRole(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Senior Frontend Developer"
                />
              </div>
              <div>
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={newRole.department}
                  onChange={(e) => setNewRole(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. Engineering"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={newRole.location}
                  onChange={(e) => setNewRole(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Remote, San Francisco"
                />
              </div>
              <div>
                <Label htmlFor="type">Employment Type</Label>
                <Select value={newRole.type} onValueChange={(value) => setNewRole(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="salary">Salary Range</Label>
              <Input
                id="salary"
                value={newRole.salary_range}
                onChange={(e) => setNewRole(prev => ({ ...prev, salary_range: e.target.value }))}
                placeholder="e.g. $120k - $180k"
              />
            </div>

            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Describe the role, responsibilities, and what makes it exciting..."
              />
            </div>

            <div>
              <Label htmlFor="requirements">Requirements *</Label>
              <Textarea
                id="requirements"
                value={newRole.requirements}
                onChange={(e) => setNewRole(prev => ({ ...prev, requirements: e.target.value }))}
                rows={6}
                placeholder="List requirements, one per line:
• 5+ years of React experience
• Strong TypeScript skills
• Experience with modern frontend tools"
              />
            </div>

            <div className="border-t border-border pt-6">
              <CustomQuestionBuilder
                questions={newRole.custom_questions}
                onChange={(questions) => setNewRole(prev => ({ ...prev, custom_questions: questions }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={saveJobRole} className="flex-1 rounded-xl">
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-card border border-border rounded-2xl">
            <CardHeader className="border-b border-border bg-muted/50">
              <CardTitle className="text-foreground text-xl">
                Application Details: {selectedApplication.full_name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusBadgeVariant(selectedApplication.status)} className="capitalize">
                  {selectedApplication.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Applied {new Date(selectedApplication.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Position & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Position Applied For
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Role:</strong> {selectedApplication.job_roles?.title}</div>
                    <div><strong>Department:</strong> {selectedApplication.job_roles?.department}</div>
                  </div>
                </Card>
                
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Email:</strong> {selectedApplication.email}</div>
                    <div><strong>Phone:</strong> {selectedApplication.phone || 'Not provided'}</div>
                  </div>
                </Card>
              </div>

              {/* Location & Work Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3">Location</h3>
                  <div className="text-sm">
                    {selectedApplication.city}, {selectedApplication.state}, {selectedApplication.country}
                  </div>
                </Card>
                
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3">Work Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Authorization:</strong> {selectedApplication.work_authorization}</div>
                    {selectedApplication.earliest_start_date && (
                      <div><strong>Available From:</strong> {(() => {
                        const date = new Date(selectedApplication.earliest_start_date + 'T12:00:00');
                        return date.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                      })()}</div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Social Media & Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(selectedApplication.instagram_handle || selectedApplication.linkedin_url) && (
                  <Card className="p-4 bg-muted/20 border border-border/50">
                    <h3 className="font-semibold text-foreground mb-3">Social Profiles</h3>
                    <div className="space-y-2 text-sm">
                      {selectedApplication.instagram_handle && (
                        <div><strong>Instagram:</strong> {selectedApplication.instagram_handle}</div>
                      )}
                      {selectedApplication.linkedin_url && (
                        <div>
                          <strong>LinkedIn:</strong>{' '}
                          <a href={selectedApplication.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
                
                {selectedApplication.resume_url && (
                  <Card className="p-4 bg-muted/20 border border-border/50">
                    <h3 className="font-semibold text-foreground mb-3">Documents</h3>
                    <div className="text-sm">
                      <div>
                        <strong>Resume:</strong>{' '}
                        <a href={selectedApplication.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          View Resume <Download className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Why Work Here */}
              <Card className="p-4 bg-muted/20 border border-border/50">
                <h3 className="font-semibold text-foreground mb-3">Why They Want to Work Here</h3>
                <p className="text-sm bg-background p-4 rounded-lg border border-border whitespace-pre-wrap">
                  {selectedApplication.why_work_here}
                </p>
              </Card>

              {/* References */}
              {selectedApplication.reference_info && (
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3">References</h3>
                  <p className="text-sm bg-background p-4 rounded-lg border border-border whitespace-pre-wrap">
                    {selectedApplication.reference_info}
                  </p>
                </Card>
              )}

              {/* Custom Question Answers */}
              {selectedApplication.custom_answers && Object.keys(selectedApplication.custom_answers).length > 0 && (
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3">Additional Questions Answered</h3>
                  <div className="space-y-3">
                    {Object.entries(selectedApplication.custom_answers).map(([questionId, answer]) => {
                      const question = selectedApplication.job_roles?.custom_questions?.find(q => q.id === questionId);
                      return (
                        <div key={questionId} className="text-sm">
                          <strong className="text-foreground">{question?.label || questionId}:</strong>
                          <p className="mt-1 bg-background p-3 rounded-lg border border-border">
                            {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Consents */}
              <Card className="p-4 bg-muted/20 border border-border/50">
                <h3 className="font-semibold text-foreground mb-3">Consents & Agreements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {selectedApplication.background_check_consent ? (
                      <span className="text-green-600">✅ Background Check Consent</span>
                    ) : (
                      <span className="text-red-600">❌ Background Check Consent</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedApplication.privacy_policy_consent ? (
                      <span className="text-green-600">✅ Privacy Policy Consent</span>
                    ) : (
                      <span className="text-red-600">❌ Privacy Policy Consent</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Status Update Section */}
              <Card className="p-4 bg-muted/20 border border-border/50 rounded-xl">
                <h3 className="font-semibold text-foreground mb-3">Update Application Status</h3>
                <div className="flex gap-2 flex-wrap">
                  {['pending', 'reviewing', 'interviewed', 'accepted', 'rejected'].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedApplication.status === status ? 'default' : 'outline'}
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, status);
                        setSelectedApplication({ ...selectedApplication, status });
                      }}
                      disabled={updatingStatus === selectedApplication.id}
                      className="capitalize rounded-xl"
                    >
                      {updatingStatus === selectedApplication.id ? 'Updating...' : status}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button onClick={() => setSelectedApplication(null)} className="bg-primary hover:bg-primary-hover rounded-xl">
                  Close
                </Button>
                {selectedApplication.resume_url && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(selectedApplication.resume_url, '_blank')}
                    className="border-border text-foreground hover:bg-muted rounded-xl"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Resume
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};