
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Copy, Check, ExternalLink } from 'lucide-react';

interface JobApplication {
  id: string;
  full_name: string;
  email: string;
  status: string;
  job_roles: {
    title: string;
    department: string;
  };
}

interface Supervisor {
  name: string;
  linkedin_url: string;
}

interface WelcomeLinkGeneratorProps {
  acceptedApplications: JobApplication[];
  onLinkGenerated: () => void;
  autoOpenForApplication?: JobApplication | null;
}

export const WelcomeLinkGenerator: React.FC<WelcomeLinkGeneratorProps> = ({
  acceptedApplications,
  onLinkGenerated,
  autoOpenForApplication
}) => {
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [startDate, setStartDate] = useState('');
  const [supervisors, setSupervisors] = useState<Supervisor[]>([
    { name: '', linkedin_url: '' }
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addSupervisor = () => {
    if (supervisors.length < 4) {
      setSupervisors([...supervisors, { name: '', linkedin_url: '' }]);
    }
  };

  const removeSupervisor = (index: number) => {
    if (supervisors.length > 1) {
      setSupervisors(supervisors.filter((_, i) => i !== index));
    }
  };

  const updateSupervisor = (index: number, field: 'name' | 'linkedin_url', value: string) => {
    const updated = supervisors.map((supervisor, i) => 
      i === index ? { ...supervisor, [field]: value } : supervisor
    );
    setSupervisors(updated);
  };

  const generateWelcomeLink = async () => {
    if (!selectedApplication) return;

    setLoading(true);
    try {
      console.log('Generating welcome link for:', selectedApplication);
      
      // Use edge function to create welcome link
      const { data, error } = await supabase.functions.invoke('create-welcome-link', {
        body: {
          applicationId: selectedApplication.id,
          applicantName: selectedApplication.full_name,
          startDate: startDate,
          supervisors: supervisors.filter(s => s.name.trim() !== '')
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Edge function response:', data);

      if (data.success) {
        setGeneratedLink(data.url);
        toast({
          title: "Welcome Link Generated",
          description: "Welcome link created successfully!",
        });
        onLinkGenerated();
      } else {
        throw new Error(data.error || 'Failed to create welcome link');
      }
    } catch (error) {
      console.error('Error generating welcome link:', error);
      toast({
        title: "Error",
        description: `Failed to generate welcome link: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedApplication(null);
    setStartDate('');
    setSupervisors([{ name: '', linkedin_url: '' }]);
    setGeneratedLink(null);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        toast({
          title: "Link Copied",
          description: "Welcome link copied to clipboard!",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        toast({
          title: "Copy Failed",
          description: "Please copy the link manually",
          variant: "destructive"
        });
      }
    }
  };

  // Auto-open dialog when an application is specified
  useEffect(() => {
    if (autoOpenForApplication) {
      setSelectedApplication(autoOpenForApplication);
      setIsOpen(true);
    }
  }, [autoOpenForApplication]);

  // Filter applications that don't already have welcome links
  const availableApplications = acceptedApplications;

  console.log('WelcomeLinkGenerator - Available applications:', availableApplications.length);
  console.log('Accepted applications:', acceptedApplications);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={availableApplications.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          Generate Welcome Link
          {availableApplications.length === 0 && ' (No Accepted Applicants)'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Generate Welcome Link</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {availableApplications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No accepted applicants available for welcome link generation.</p>
              <p className="text-sm text-muted-foreground mt-2">Change an applicant's status to "Accepted" first.</p>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="application">Select Accepted Applicant</Label>
                <Select
                  value={selectedApplication?.id || ''}
                  onValueChange={(value) => {
                    const app = availableApplications.find(a => a.id === value);
                    setSelectedApplication(app || null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an applicant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableApplications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.full_name} - {app.job_roles?.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Supervisors (up to 4)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSupervisor}
                disabled={supervisors.length >= 4}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Supervisor
              </Button>
            </div>
            
            <div className="space-y-4">
              {supervisors.map((supervisor, index) => (
                <Card key={index} className="p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-foreground">Supervisor {index + 1}</h4>
                    {supervisors.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSupervisor(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`supervisor-name-${index}`}>Name</Label>
                      <Input
                        id={`supervisor-name-${index}`}
                        placeholder="Supervisor name"
                        value={supervisor.name}
                        onChange={(e) => updateSupervisor(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`supervisor-linkedin-${index}`}>LinkedIn URL</Label>
                      <Input
                        id={`supervisor-linkedin-${index}`}
                        placeholder="https://linkedin.com/in/..."
                        value={supervisor.linkedin_url}
                        onChange={(e) => updateSupervisor(index, 'linkedin_url', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {generatedLink ? (
            <div className="space-y-4 p-6 bg-muted/30 rounded-lg border-2 border-primary/20">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground text-lg">✅ Welcome Link Generated!</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(generatedLink, '_blank')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 p-3 bg-background rounded-md border border-border shadow-sm">
                <code className="flex-1 text-sm text-foreground font-mono bg-muted/20 px-2 py-1 rounded truncate">
                  {generatedLink}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="shrink-0 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Close & Generate Another
                </Button>
              </div>
            </div>
          ) : availableApplications.length > 0 ? (
            <div className="flex gap-3">
              <Button 
                onClick={generateWelcomeLink} 
                disabled={!selectedApplication || loading}
                className="flex-1"
              >
                {loading ? 'Generating...' : 'Generate Welcome Link'}
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
