import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search,
  Linkedin,
  ExternalLink,
  Trash2,
  RotateCcw,
  Eye,
  Shield,
  EyeOff
} from 'lucide-react';

interface PreboardingStep {
  id: string;
  step_type: string;
  status: string;
  completed_at: string | null;
  data: any;
  created_at: string;
  updated_at: string;
}

interface WelcomeLink {
  id: string;
  slug: string;
  status: string;
  applicant_name: string;
  start_date: string;
  supervisors: any[];
  created_at: string;
  application_id: string;
}

interface StaffRecord {
  id: string;
  application_id: string;
  applicant_name: string;
  start_date: string;
  supervisors: any[];
  preboarding_data: any;
  welcome_link_data: any;
  status: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  linkedin_url: string;
  work_authorization: string;
  earliest_start_date: string;
  status: string;
  created_at: string;
  job_roles: {
    title: string;
    department: string;
    location: string;
    type: string;
  };
  welcome_link?: WelcomeLink;
  preboarding_steps?: PreboardingStep[];
  staff_record?: StaffRecord;
  isDeleted?: boolean;
}

interface StaffDirectoryProps {
  acceptedApplications: any[];
  onRefresh: () => void;
}

export const StaffDirectory: React.FC<StaffDirectoryProps> = ({
  acceptedApplications,
  onRefresh
}) => {
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [deletedStaffMembers, setDeletedStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    loadStaffData();
  }, [acceptedApplications]);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const activeStaffData: StaffMember[] = [];
      const deletedStaffData: StaffMember[] = [];

      // Load all staff records (both active and deleted)
      const { data: allStaffRecords } = await supabase
        .from('staff_records')
        .select('*')
        .order('created_at', { ascending: false });

      for (const application of acceptedApplications) {
        // Get staff record for persistence
        const staffRecord = allStaffRecords?.find(record => record.application_id === application.id);
        
        // Get welcome link for this application (including soft deleted ones)
        const { data: welcomeLink } = await supabase
          .from('welcome_links')
          .select('*')
          .eq('application_id', application.id)
          .maybeSingle();

        // Get preboarding steps if welcome link exists
        let preboardingSteps: PreboardingStep[] = [];
        if (welcomeLink) {
          const { data: steps } = await supabase
            .from('preboarding_steps')
            .select('*')
            .eq('welcome_link_id', welcomeLink.id)
            .order('created_at', { ascending: true });
          
          preboardingSteps = steps || [];
        }

        const staffMember: StaffMember = {
          ...application,
          welcome_link: welcomeLink,
          preboarding_steps: preboardingSteps,
          staff_record: staffRecord,
          isDeleted: staffRecord?.status === 'deleted'
        };

        if (staffRecord?.status === 'deleted') {
          deletedStaffData.push(staffMember);
        } else {
          activeStaffData.push(staffMember);
        }
      }

      setStaffMembers(activeStaffData);
      setDeletedStaffMembers(deletedStaffData);
    } catch (error) {
      console.error('Error loading staff data:', error);
      toast({
        title: "Error",
        description: "Failed to load staff directory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCompletionProgress = (steps: PreboardingStep[]) => {
    if (!steps || steps.length === 0) return 0;
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepDisplayName = (stepType: string) => {
    const stepNames: { [key: string]: string } = {
      'emergency_info': 'Emergency Information',
      'documents': 'Document Signing',
      'tools_setup': 'Tools Setup',
      'background_check': 'Background Check',
      'equipment_request': 'Equipment Request'
    };
    return stepNames[stepType] || stepType.replace('_', ' ').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const deleteStaffMember = async (staffMember: StaffMember) => {
    try {
      // First, capture all preboarding data before any deletion
      let preboardingData = {};
      
      if (staffMember.welcome_link && staffMember.preboarding_steps) {
        preboardingData = staffMember.preboarding_steps.map(step => ({
          step_type: step.step_type,
          status: step.status,
          data: step.data,
          completed_at: step.completed_at,
          created_at: step.created_at,
          updated_at: step.updated_at
        }));
      }

      // Ensure a staff record exists with preboarding data before deletion
      const { data: existingRecord } = await supabase
        .from('staff_records')
        .select('id, preboarding_data')
        .eq('application_id', staffMember.id)
        .maybeSingle();

      if (!existingRecord) {
        // Create staff record with all available data
        const { error: insertError } = await supabase
          .from('staff_records')
          .insert({
            application_id: staffMember.id,
            applicant_name: staffMember.full_name,
            start_date: staffMember.welcome_link?.start_date || null,
            supervisors: staffMember.welcome_link?.supervisors || [],
            welcome_link_data: staffMember.welcome_link || {},
            preboarding_data: preboardingData,
            status: 'deleted',
            deleted_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      } else {
        // Update existing staff record, preserving or updating preboarding data
        const finalPreboardingData = existingRecord.preboarding_data && 
          Array.isArray(existingRecord.preboarding_data) && 
          existingRecord.preboarding_data.length > 0 
          ? existingRecord.preboarding_data 
          : preboardingData;

        const { error } = await supabase
          .from('staff_records')
          .update({ 
            status: 'deleted',
            deleted_at: new Date().toISOString(),
            preboarding_data: finalPreboardingData,
            // Also update other fields to ensure they're preserved
            applicant_name: staffMember.full_name,
            start_date: staffMember.welcome_link?.start_date || null,
            supervisors: staffMember.welcome_link?.supervisors || [],
            welcome_link_data: staffMember.welcome_link || {}
          })
          .eq('application_id', staffMember.id);

        if (error) throw error;
      }

      // Now soft delete the welcome link (this will trigger our sync function)
      if (staffMember.welcome_link) {
        await supabase
          .from('welcome_links')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', staffMember.welcome_link.id);
      }

      toast({
        title: "Success",
        description: `${staffMember.full_name} has been moved to archived section with all data preserved`,
      });

      loadStaffData();
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive"
      });
    }
  };

  const restoreStaffMember = async (staffMember: StaffMember) => {
    try {
      // Update staff record status to active
      const { error } = await supabase
        .from('staff_records')
        .update({ 
          status: 'active',
          deleted_at: null
        })
        .eq('application_id', staffMember.id);

      if (error) throw error;

      // Also restore the welcome link if it exists
      if (staffMember.welcome_link || staffMember.staff_record?.welcome_link_data) {
        const welcomeLinkId = staffMember.welcome_link?.id || staffMember.staff_record?.welcome_link_data?.id;
        if (welcomeLinkId) {
          await supabase
            .from('welcome_links')
            .update({ deleted_at: null })
            .eq('id', welcomeLinkId);
        }
      }

      toast({
        title: "Success",
        description: `${staffMember.full_name} has been restored with all preboarding data`,
      });

      loadStaffData();
    } catch (error) {
      console.error('Error restoring staff member:', error);
      toast({
        title: "Error",
        description: "Failed to restore staff member",
        variant: "destructive"
      });
    }
  };

  const filteredStaff = staffMembers.filter(staff =>
    staff.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.job_roles?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.job_roles?.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeletedStaff = deletedStaffMembers.filter(staff =>
    staff.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.job_roles?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.job_roles?.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="bg-card border border-border">
        <CardContent className="text-center py-16">
          <div className="text-lg text-muted-foreground">Loading staff directory...</div>
        </CardContent>
      </Card>
    );
  }

  const renderStaffCard = (staff: StaffMember, isDeleted = false) => {
    const progress = getCompletionProgress(staff.preboarding_steps || []);
    
    return (
      <Card 
        key={staff.id} 
        className="p-4 bg-muted/20 border border-border hover:border-primary/50 transition-colors relative"
      >
        <div className="space-y-4">
          {/* Header with Actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{staff.full_name}</h3>
              <p className="text-sm text-muted-foreground">{staff.job_roles?.title}</p>
              <p className="text-sm text-muted-foreground">{staff.job_roles?.department}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isDeleted ? "destructive" : "default"} className={isDeleted ? "" : "bg-green-100 text-green-800"}>
                {isDeleted ? "Deleted" : "Active"}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedStaff(staff)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {isDeleted ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => restoreStaffMember(staff)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{staff.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {staff.city}, {staff.state}
              </span>
            </div>
            {(staff.welcome_link?.start_date || staff.staff_record?.start_date) && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Starts {formatDate(staff.welcome_link?.start_date || staff.staff_record?.start_date)}
                </span>
              </div>
            )}
          </div>

          {/* Onboarding Progress */}
          {staff.preboarding_steps && staff.preboarding_steps.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Onboarding Progress</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Welcome Link Status */}
          {(staff.welcome_link || staff.staff_record?.welcome_link_data) && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Welcome Link</span>
              <Badge variant={staff.welcome_link?.status === 'active' ? 'default' : 'secondary'}>
                {staff.welcome_link?.status || 'inactive'}
              </Badge>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <>
      <Card className="bg-card border border-border">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="h-5 w-5 text-muted-foreground" />
                Staff Directory ({staffMembers.length} active, {deletedStaffMembers.length} deleted)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Complete profiles and onboarding progress for all team members
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="active">
                Active Staff ({filteredStaff.length})
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 flex justify-between items-center">
              <div></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Shield className="h-4 w-4 mr-2" />
                {showDeleted ? <EyeOff className="h-4 w-4 ml-1" /> : <Eye className="h-4 w-4 ml-1" />}
                {showDeleted ? 'Hide' : 'Show'} Archived Staff
              </Button>
            </div>
            
            <TabsContent value="active" className="mt-6">
              {filteredStaff.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-lg text-foreground mb-2">No active staff members found</div>
                  <div className="text-sm text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search criteria' : 'Accept applications to see them here'}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStaff.map((staff) => renderStaffCard(staff, false))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Archived/Deleted Staff Section */}
          {showDeleted && (
            <div className="mt-8 pt-6 border-t border-border">
              <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  <h3 className="text-lg font-semibold text-destructive">Archived Staff Directory</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  This section contains staff members who have been archived. Only admins with proper permissions can view this data.
                </p>
              </div>
              
              {filteredDeletedStaff.length === 0 ? (
                <div className="text-center py-12">
                  <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-lg text-foreground mb-2">No archived staff members</div>
                  <div className="text-sm text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search criteria' : 'Archived staff members will appear here'}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDeletedStaff.map((staff) => renderStaffCard(staff, true))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <Dialog open={true} onOpenChange={() => setSelectedStaff(null)}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedStaff.full_name} - Complete Profile
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Full Name:</strong> {selectedStaff.full_name}</div>
                    <div><strong>Email:</strong> {selectedStaff.email}</div>
                    <div><strong>Phone:</strong> {selectedStaff.phone || 'Not provided'}</div>
                    <div><strong>Location:</strong> {selectedStaff.city}, {selectedStaff.state}, {selectedStaff.country}</div>
                  </div>
                </Card>

                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Position Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {selectedStaff.job_roles?.title}</div>
                    <div><strong>Department:</strong> {selectedStaff.job_roles?.department}</div>
                    <div><strong>Location:</strong> {selectedStaff.job_roles?.location}</div>
                    <div><strong>Type:</strong> {selectedStaff.job_roles?.type}</div>
                  </div>
                </Card>

                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Important Dates
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Applied:</strong> {formatDate(selectedStaff.created_at.split('T')[0])}</div>
                    {selectedStaff.earliest_start_date && (
                      <div><strong>Available From:</strong> {formatDate(selectedStaff.earliest_start_date)}</div>
                    )}
                    {selectedStaff.welcome_link?.start_date && (
                      <div><strong>Start Date:</strong> {formatDate(selectedStaff.welcome_link.start_date)}</div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Social & Links */}
              {selectedStaff.linkedin_url && (
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3">Professional Profiles</h3>
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                    <a 
                      href={selectedStaff.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      LinkedIn Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </Card>
              )}

              {/* Welcome Link Status */}
              {(selectedStaff.welcome_link || selectedStaff.staff_record?.welcome_link_data) && (
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3">Welcome Link Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><strong>Status:</strong> 
                      <Badge variant={selectedStaff.welcome_link?.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                        {selectedStaff.welcome_link?.status || 'inactive'}
                      </Badge>
                    </div>
                    {selectedStaff.welcome_link?.slug && (
                      <div><strong>Link:</strong> /welcome/{selectedStaff.welcome_link.slug}</div>
                    )}
                    <div><strong>Created:</strong> {formatDate((selectedStaff.welcome_link?.created_at || selectedStaff.staff_record?.created_at)?.split('T')[0])}</div>
                    {(selectedStaff.welcome_link?.supervisors || selectedStaff.staff_record?.supervisors)?.length > 0 && (
                      <div><strong>Supervisors:</strong> {(selectedStaff.welcome_link?.supervisors || selectedStaff.staff_record?.supervisors)?.map((s: any) => s.name).join(', ')}</div>
                    )}
                  </div>
                </Card>
              )}

              {/* Preboarding Data from Staff Record */}
              {selectedStaff.staff_record?.preboarding_data && Array.isArray(selectedStaff.staff_record.preboarding_data) && selectedStaff.staff_record.preboarding_data.length > 0 && (
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3">Preboarding Submissions</h3>
                  <div className="space-y-4">
                    {selectedStaff.staff_record.preboarding_data.map((step: any, index: number) => (
                      <div key={index} className="p-3 bg-background rounded border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">
                            {getStepDisplayName(step.step_type)}
                          </h4>
                          <div className="flex items-center gap-2">
                            {getStepIcon(step.status)}
                            <Badge variant={step.status === 'completed' ? 'default' : 'secondary'}>
                              {step.status}
                            </Badge>
                          </div>
                        </div>
                        {step.completed_at && (
                          <div className="text-xs text-muted-foreground mb-2">
                            Completed: {formatDate(step.completed_at.split('T')[0])}
                          </div>
                        )}
                        {step.data && Object.keys(step.data).length > 0 && (
                          <div className="mt-2">
                            <div className="text-sm font-medium text-foreground mb-1">Submitted Data:</div>
                            <div className="text-xs p-2 bg-muted/50 rounded border">
                              <pre className="whitespace-pre-wrap text-muted-foreground">
                                {JSON.stringify(step.data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Legacy Preboarding Data (if no staff record data available) */}
              {(!selectedStaff.staff_record?.preboarding_data || !Array.isArray(selectedStaff.staff_record.preboarding_data) || selectedStaff.staff_record.preboarding_data.length === 0) && 
               selectedStaff.staff_record?.preboarding_data && 
               typeof selectedStaff.staff_record.preboarding_data === 'object' && 
               Object.keys(selectedStaff.staff_record.preboarding_data).length > 0 && (
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-3">Legacy Preboarding Data</h3>
                  <div className="space-y-3">
                    {Object.entries(selectedStaff.staff_record.preboarding_data).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>
                        <div className="mt-1 p-2 bg-background rounded border border-border">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Onboarding Progress */}
              {selectedStaff.preboarding_steps && selectedStaff.preboarding_steps.length > 0 && (
                <Card className="p-4 bg-muted/20 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-4">Onboarding Progress</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Overall Progress</span>
                      <span className="font-medium text-foreground">
                        {getCompletionProgress(selectedStaff.preboarding_steps)}%
                      </span>
                    </div>
                    <Progress value={getCompletionProgress(selectedStaff.preboarding_steps)} className="h-3 mb-6" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedStaff.preboarding_steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
                          <div className="mt-0.5">
                            {getStepIcon(step.status)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-foreground text-sm">
                              {getStepDisplayName(step.step_type)}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {step.status}
                            </div>
                            {step.completed_at && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Completed {formatDate(step.completed_at.split('T')[0])}
                              </div>
                            )}
                            {step.data && Object.keys(step.data).length > 0 && (
                              <div className="mt-2 text-xs">
                                <details className="text-muted-foreground">
                                  <summary className="cursor-pointer hover:text-foreground">View Details</summary>
                                  <div className="mt-1 p-2 bg-muted rounded text-xs">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(step.data, null, 2)}</pre>
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Work Authorization */}
              <Card className="p-4 bg-muted/20 border border-border/50">
                <h3 className="font-semibold text-foreground mb-3">Work Authorization</h3>
                <div className="text-sm">
                  <strong>Status:</strong> {selectedStaff.work_authorization}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button onClick={() => setSelectedStaff(null)}>
                  Close
                </Button>
                {selectedStaff.welcome_link && (
                  <Button variant="outline" asChild>
                    <a href={`/welcome/${selectedStaff.welcome_link.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Welcome Page
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};