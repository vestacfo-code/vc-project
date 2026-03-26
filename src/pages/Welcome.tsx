import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, CheckCircle, Circle, ExternalLink, FileText, Shield, Settings, Mail, Phone, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';

interface WelcomeLink {
  id: string;
  applicant_name: string;
  slug: string;
  start_date: string;
  supervisors: any; // JSON from database
  application_id: string;
  status: string;
}

interface JobApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_role_id: string;
  job_roles: {
    title: string;
    description: string;
    department: string;
    location: string;
    type: string;
  };
}

interface PreboardingStep {
  id: string;
  step_type: string;
  status: string;
  data?: any; // Note: data is NOT returned from API for security reasons, only stored locally after user input
  completed_at: string | null;
}

const Welcome = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [welcomeData, setWelcomeData] = useState<WelcomeLink | null>(null);
  const [steps, setSteps] = useState<PreboardingStep[]>([]);
  const [jobApplication, setJobApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleExpanded, setRoleExpanded] = useState(false);

  useEffect(() => {
    if (slug) {
      loadWelcomeData();
    }
  }, [slug]);

  const loadWelcomeData = async () => {
    try {
      // Use secure edge function to load welcome link data
      const { data, error } = await supabase.functions.invoke('get-welcome-link-data', {
        body: { slug }
      });

      if (error) {
        console.error('Error loading welcome data:', error);
        throw new Error('Failed to load welcome data');
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'Welcome link not found or inactive');
      }

      setWelcomeData(data.welcomeLink);
      setJobApplication(data.jobApplication);
      setSteps(data.steps || []);

      // Create default steps if none exist - only the main preboarding steps
      const defaultSteps = [
        { step_type: 'emergency_info', status: 'pending' },
        { step_type: 'documents', status: 'pending' },
        { step_type: 'tools_setup', status: 'pending' }
      ];

      let allSteps = data.steps || [];
      
      // Add missing default steps
      for (const defaultStep of defaultSteps) {
        if (!allSteps.find((s: any) => s.step_type === defaultStep.step_type)) {
          // Create the missing step in database
          const { data: newStep, error: createError } = await supabase
            .from('preboarding_steps')
            .insert({
              welcome_link_id: data.welcomeLink.id,
              step_type: defaultStep.step_type,
              status: defaultStep.status
            })
            .select()
            .single();

          if (!createError && newStep) {
            allSteps.push(newStep);
          }
        }
      }

      setSteps(allSteps);
    } catch (error) {
      console.error('Error loading welcome data:', error);
      toast({
        title: "Welcome Page Not Found",
        description: "This welcome link may have expired or is invalid.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const stepTitles: Record<string, string> = {
    'emergency_info': 'Emergency Info',
    'documents': 'Sign Documents',
    'tools_setup': 'Set Up Tools'
  };

  const stepDescriptions: Record<string, string> = {
    'emergency_info': 'Collect emergency contact, residence address, and optional mailing address.',
    'documents': 'Employee contract uploaded by HR → applicant signs → reuploads.',
    'tools_setup': 'Slack setup instructions. Collect preferred Google account for email, calendar, and docs.'
  };

  const stepIcons: Record<string, any> = {
    'emergency_info': Phone,
    'documents': FileText,
    'tools_setup': Settings
  };

  const deleteStep = async (stepId: string, stepType: string) => {
    try {
      const { error } = await supabase
        .from('preboarding_steps')
        .update({
          status: 'pending',
          completed_at: null,
          data: null
        })
        .eq('id', stepId);

      if (error) throw error;

      // Update local state
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.id === stepId 
            ? { ...step, status: 'pending', completed_at: null, data: null }
            : step
        )
      );

      toast({
        title: "Step Reset",
        description: `${stepTitles[stepType]} has been reset to pending.`,
      });
    } catch (error) {
      console.error('Error deleting step:', error);
      toast({
        title: "Error",
        description: "Failed to reset step. Please try again.",
        variant: "destructive"
      });
    }
  };

  const completeStep = async (stepId: string, stepType: string, formData: any) => {
    try {
      const { error } = await supabase
        .from('preboarding_steps')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          data: formData
        })
        .eq('id', stepId);

      if (error) throw error;

      // Update local state
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.id === stepId 
            ? { ...step, status: 'completed', completed_at: new Date().toISOString(), data: formData }
            : step
        )
      );

      toast({
        title: "Step Completed!",
        description: `${stepTitles[stepType]} has been marked as complete.`,
      });
    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: "Error",
        description: "Failed to complete step. Please try again.",
        variant: "destructive"
      });
    }
  };

  
  const EmergencyInfoDialog = ({ step, onComplete, isEdit = false }: { step: PreboardingStep, onComplete: (data: any) => void, isEdit?: boolean }) => {
    const existingData = step.data || {};
    const [formData, setFormData] = useState({
      emergencyName: existingData.emergencyName || '',
      emergencyPhone: existingData.emergencyPhone || '',
      emergencyRelation: existingData.emergencyRelation || '',
      homeAddress: existingData.homeAddress || '',
      mailingAddress: existingData.mailingAddress || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onComplete(formData);
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <button className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium">
            {isEdit ? 'Edit' : 'Start'}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit' : 'Complete'} Emergency Contact Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                <Input
                  id="emergencyName"
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({...formData, emergencyName: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="emergencyRelation">Relationship</Label>
              <Input
                id="emergencyRelation"
                value={formData.emergencyRelation}
                onChange={(e) => setFormData({...formData, emergencyRelation: e.target.value})}
                placeholder="e.g., Spouse, Parent, Sibling"
                required
              />
            </div>
            <div>
              <Label htmlFor="homeAddress">Your Residence Address</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Please provide your personal residence address (not your emergency contact's address)
              </p>
              <Textarea
                id="homeAddress"
                value={formData.homeAddress}
                onChange={(e) => setFormData({...formData, homeAddress: e.target.value})}
                placeholder="Your personal home address"
                required
              />
            </div>
            <div>
              <Label htmlFor="mailingAddress">Mailing Address (optional, if different)</Label>
              <Textarea
                id="mailingAddress"
                value={formData.mailingAddress}
                onChange={(e) => setFormData({...formData, mailingAddress: e.target.value})}
                placeholder="Leave blank if same as residence address"
              />
            </div>
            <Button type="submit" className="w-full">
              {isEdit ? 'Update' : 'Complete'} Emergency Info
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const DocumentsDialog = ({ step, onComplete, isEdit = false }: { step: PreboardingStep, onComplete: (data: any) => void, isEdit?: boolean }) => {
    const existingData = step.data || {};
    const [agreed, setAgreed] = useState(existingData.contractSigned || false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (agreed) {
        onComplete({ contractSigned: true, signedAt: new Date().toISOString() });
      }
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <button className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium">
            {isEdit ? 'Edit' : 'Start'}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit' : 'Complete'} Document Signing</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Contract Signing Process:</h4>
                <div className="space-y-2 text-sm">
                  <p>• Your employment contract will be emailed to your preferred email address</p>
                  <p>• You will receive this email separately before your start date</p>
                  <p>• Follow the instructions in the email to sign the contract electronically</p>
                  <p>• No additional upload is required - the signed contract will be automatically stored</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="agreement" className="text-sm">
                  I understand that my employment contract will be emailed to me separately and I will need to sign it before my start date
                </label>
              </div>
            </div>
            <Button type="submit" disabled={!agreed} className="w-full">
              {isEdit ? 'Update' : 'Complete'} Document Process
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const ToolsSetupDialog = ({ step, onComplete, isEdit = false }: { step: PreboardingStep, onComplete: (data: any) => void, isEdit?: boolean }) => {
    const existingData = step.data || {};
    const [formData, setFormData] = useState({
      preferredGoogleAccount: existingData.preferredGoogleAccount || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onComplete(formData);
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <button className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium">
            {isEdit ? 'Edit' : 'Start'}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit' : 'Complete'} Tools Setup</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="googleAccount">Preferred Google Account</Label>
                <Input
                  id="googleAccount"
                  type="email"
                  value={formData.preferredGoogleAccount}
                  onChange={(e) => setFormData({...formData, preferredGoogleAccount: e.target.value})}
                  placeholder="your.email@gmail.com"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This will be used for Google Workspace (email, calendar, docs)
                </p>
              </div>
              
              <div className="space-y-3">
                <Label>Slack Setup</Label>
                <div className="bg-muted/20 p-4 rounded-lg border border-muted">
                  <h4 className="font-medium mb-2">Slack Setup Instructions:</h4>
                  <div className="space-y-2 text-sm">
                    <p>• You will receive a Slack invitation email to your preferred email address before your start date</p>
                    <p>• Download the Slack app on your devices when you receive the invitation</p>
                    <p>• Complete your profile with a professional photo</p>
                    <p>• Join relevant team channels as directed in the invitation</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-muted">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="slackUnderstanding"
                        required
                        className="rounded"
                      />
                      <label htmlFor="slackUnderstanding" className="text-sm font-medium">
                        I understand I will receive the Slack invitation via email before my start date
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full">
              {isEdit ? 'Update' : 'Complete'} Tools Setup
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const renderStepDialog = (step: PreboardingStep, isEdit = false) => {
    const stepType = step.step_type;
    
    if (stepType === 'emergency_info') {
      return <EmergencyInfoDialog step={step} onComplete={(formData) => completeStep(step.id, stepType, formData)} isEdit={isEdit} />;
    } else if (stepType === 'documents') {
      return <DocumentsDialog step={step} onComplete={(formData) => completeStep(step.id, stepType, formData)} isEdit={isEdit} />;
    } else if (stepType === 'tools_setup') {
      return <ToolsSetupDialog step={step} onComplete={(formData) => completeStep(step.id, stepType, formData)} isEdit={isEdit} />;
    }
    
    // For steps without dialogs, return a simple button
    return (
      <button 
        onClick={() => completeStep(step.id, stepType, {})}
        className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
      >
        {isEdit ? 'Edit' : 'Start'}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your welcome page...</p>
        </div>
      </div>
    );
  }

  if (!welcomeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-destructive mb-2">Welcome Page Not Found</h1>
            <p className="text-muted-foreground">
              This welcome link may have expired or is invalid. Please contact HR for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fullscreen Hero Section */}
      <div className="h-screen relative flex items-center justify-center">
        {/* NYC Sunset Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/lovable-uploads/7a9bbb93-df90-4042-acf9-0148a57b4632.png')"
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Animated Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][i % 5],
                left: `${Math.random() * 100}%`,
              }}
              initial={{ 
                y: -20,
                opacity: 1,
                rotate: 0
              }}
              animate={{ 
                y: '100vh',
                opacity: 0,
                rotate: 360
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative z-10 text-center px-6 max-w-4xl"
        >
          <motion.h1 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-6xl md:text-8xl font-bold text-white mb-6 drop-shadow-2xl"
          >
            Congratulations, {welcomeData.applicant_name}!
          </motion.h1>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-3xl md:text-5xl font-semibold text-white mb-4 drop-shadow-xl"
          >
            Welcome to the Finlo AI family
          </motion.h2>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/70 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Content Sections */}
      <div className="relative bg-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          
          {/* Role & Team Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">
            
            {/* Role Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-12 bg-primary rounded-full"></div>
                  <h2 className="text-2xl font-light text-black uppercase tracking-wide">Your Role</h2>
                </div>
                
                {jobApplication?.job_roles && (
                  <>
                    <h3 className="text-5xl font-light text-black leading-tight">
                      {jobApplication.job_roles.title}
                    </h3>
                    
                    <div className="inline-flex px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                      ✓ Position Accepted
                    </div>
                  </>
                )}
              </div>

              {jobApplication?.job_roles && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-black uppercase tracking-wide">Location</div>
                      <div className="text-xl text-black">{jobApplication.job_roles.location}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-black uppercase tracking-wide">Department</div>
                      <div className="text-xl text-black">{jobApplication.job_roles.department}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-black uppercase tracking-wide">Type</div>
                      <div className="text-xl text-black">{jobApplication.job_roles.type}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-black uppercase tracking-wide">Email</div>
                      <div className="text-xl text-black">{jobApplication.email}</div>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setRoleExpanded(!roleExpanded)}
                      className="flex items-center justify-between w-full py-4 px-6 text-left bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-lg font-medium text-black">
                        View Role Description
                      </span>
                      <span className={`transform transition-transform text-black ${roleExpanded ? 'rotate-180' : ''}`}>
                        ↓
                      </span>
                    </button>
                    
                    {roleExpanded && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                      <div className="p-6 max-h-96 overflow-y-auto">
                          <div className="text-lg leading-relaxed text-black whitespace-pre-line">
                            {jobApplication.job_roles.description}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {welcomeData.start_date && (
                <div className="space-y-4 pt-8 border-t border-muted-foreground/10">
                  <div className="text-sm font-medium text-black uppercase tracking-wide">Start Date</div>
                  <div className="text-3xl font-light text-black">
                    {(() => {
                      // Parse date string directly without timezone issues
                      // Add 'T12:00:00' to ensure we're in the middle of the day to avoid timezone shifts
                      const date = new Date(welcomeData.start_date + 'T12:00:00');
                      return date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                    })()}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Team Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-12 bg-primary rounded-full"></div>
                  <h2 className="text-2xl font-light text-black uppercase tracking-wide">Who You Report To</h2>
                </div>
              </div>
              
              <div className="space-y-6">
                {welcomeData.supervisors && Array.isArray(welcomeData.supervisors) && welcomeData.supervisors.length > 0 ? (
                  welcomeData.supervisors.map((supervisor: any, index: number) => (
                    <div key={index} className="space-y-4 pb-6 border-b border-muted-foreground/10 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="text-2xl font-light text-black">{supervisor.name}</div>
                          <div className="text-sm font-medium text-black uppercase tracking-wide">Supervisor</div>
                        </div>
                        {supervisor.linkedin_url && (
                          <a 
                            href={supervisor.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-md"
                            title="View LinkedIn Profile"
                          >
                            <img 
                              src="/lovable-uploads/e6db85c0-52bc-41d3-8b8e-9bf1e094b86c.png" 
                              alt="LinkedIn" 
                              className="h-5 w-5"
                            />
                            <span className="text-sm font-medium">LinkedIn</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-lg text-black">Your team information will be updated soon.</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Preboarding Steps */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-16"
          >
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <h2 className="text-4xl font-light text-black">Preboarding Checklist</h2>
              </div>
              <p className="text-xl text-black max-w-3xl mx-auto leading-relaxed">
                Complete these steps before your first day to ensure a smooth onboarding experience.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Confirmed Acceptance */}
              <div className="flex items-center gap-8 py-8 border-b border-green-200">
                <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                 <div className="flex-1 space-y-2">
                   <h3 className="text-2xl font-light text-black">Confirmed Acceptance</h3>
                   <p className="text-lg text-green-600 font-medium">✓ Completed automatically</p>
                 </div>
                <div className="flex-shrink-0">
                  <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    Complete
                  </div>
                </div>
              </div>

              {/* Other Steps - Only show the defined steps */}
              {steps.filter(step => ['emergency_info', 'documents', 'tools_setup'].includes(step.step_type)).map((step) => {
                const IconComponent = stepIcons[step.step_type] || Circle;
                const isCompleted = step.status === 'completed';
                
                return (
                  <div 
                    key={step.id} 
                    className={`flex items-center gap-8 py-8 border-b transition-colors ${
                      isCompleted ? 'border-green-200' : 'border-muted-foreground/10'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-100' : 'bg-red-50'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <IconComponent className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-2xl font-light text-black">
                        {stepTitles[step.step_type]}
                      </h3>
                      <p className={`text-lg ${isCompleted ? 'text-green-600' : 'text-black'}`}>
                        {stepDescriptions[step.step_type]}
                      </p>
                      {step.completed_at && (
                        <p className="text-sm text-green-600">
                          Completed on {new Date(step.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 space-x-2">
                      {isCompleted ? (
                        <div className="flex items-center gap-2">
                          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                            Complete
                          </div>
                          {renderStepDialog(step, true)}
                          <button 
                            onClick={() => deleteStep(step.id, step.step_type)}
                            className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        renderStepDialog(step)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* First Week Preview */}
            <div className="max-w-4xl mx-auto pt-16 border-t border-muted-foreground/10">
               <div className="text-center space-y-8">
                 <h3 className="text-3xl font-light text-black">Your First Week</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-4">
                     <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                       <span className="text-primary font-bold">1</span>
                     </div>
                     <h4 className="text-xl font-medium text-black">HR Onboarding</h4>
                     <p className="text-black">Complete paperwork and company orientation</p>
                   </div>
                   <div className="space-y-4">
                     <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                       <span className="text-primary font-bold">2</span>
                     </div>
                     <h4 className="text-xl font-medium text-black">Meet Your Supervisor</h4>
                     <p className="text-black">1:1 meeting to discuss goals and expectations</p>
                   </div>
                   <div className="space-y-4">
                     <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                       <span className="text-primary font-bold">3</span>
                     </div>
                     <h4 className="text-xl font-medium text-black">Team Introduction</h4>
                     <p className="text-black">Meet your colleagues and understand team dynamics</p>
                   </div>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
