import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/crm';
import { UserBadge } from './UserBadge';
import { ContactDialog } from './ContactDialog';
import { useAuth } from '@/hooks/useAuth';
import { 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Linkedin, 
  Globe, 
  Calendar,
  Tag,
  FileText,
  Edit,
  PhoneCall,
  Trash2,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ContactDetailSheetProps {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export const ContactDetailSheet = ({ contactId, open, onOpenChange, onUpdate }: ContactDetailSheetProps) => {
  const { user } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [recordingEmail, setRecordingEmail] = useState(false);

  useEffect(() => {
    if (contactId && open) {
      loadContact();
    }
  }, [contactId, open]);

  const loadContact = async () => {
    if (!contactId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      setContact(data);
    } catch (error) {
      console.error('Error loading contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleCall = () => {
    if (contact?.phone) {
      window.location.href = `tel:${contact.phone}`;
    }
  };

  const handleEmail = () => {
    if (contact?.email) {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  const handleDelete = async () => {
    if (!contactId) return;
    
    setDeleting(true);
    try {
      console.log('[ContactDetailSheet] Attempting to delete contact:', contactId);
      
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', contactId);

      if (error) {
        console.error('[ContactDetailSheet] Delete error:', error);
        throw error;
      }

      toast.success('Contact deleted successfully');
      onOpenChange(false);
      onUpdate?.();
    } catch (error: any) {
      console.error('[ContactDetailSheet] Error deleting contact:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to delete contact';
      
      if (error?.code === '23503') {
        errorMessage = 'Cannot delete contact - it has related records. Please contact support.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleRecordEmail = async () => {
    if (!contactId || !user?.id) return;
    
    setRecordingEmail(true);
    try {
      console.log('[ContactDetailSheet] Recording email sent for contact:', contactId);
      
      // Update last contacted timestamp
      const { error: updateError } = await supabase
        .from('crm_contacts')
        .update({
          last_contacted_at: new Date().toISOString(),
          last_contacted_by: user.id,
        })
        .eq('id', contactId);

      if (updateError) throw updateError;

      // Create activity record
      const { error: activityError } = await supabase
        .from('crm_activities')
        .insert({
          contact_id: contactId,
          activity_type: 'email',
          subject: 'Email sent to contact',
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

      if (activityError) {
        console.warn('[ContactDetailSheet] Failed to create activity:', activityError);
      }

      toast.success('Email contact recorded successfully');
      loadContact();
      onUpdate?.();
    } catch (error: any) {
      console.error('[ContactDetailSheet] Error recording email:', error);
      toast.error(error?.message || 'Failed to record email contact');
    } finally {
      setRecordingEmail(false);
    }
  };

  if (!contact) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const colors = {
      lead: 'default',
      prospect: 'secondary',
      customer: 'success',
      inactive: 'outline'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              <h2 className="text-2xl font-bold">
                {contact.first_name} {contact.last_name}
              </h2>
              {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] pr-4">
            <div className="space-y-6 mt-6">
              {/* Management Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} className="flex-1">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                {contact.phone && (
                  <Button variant="outline" onClick={handleCall}>
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                )}
                {contact.email && (
                  <Button variant="outline" onClick={handleEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleRecordEmail}
                  disabled={recordingEmail}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {recordingEmail ? 'Recording...' : 'Record Email'}
                </Button>
              </div>

              {/* Status & Source */}
              <div className="flex gap-2">
                <Badge variant={getStatusColor(contact.status) as any}>
                  {contact.status}
                </Badge>
                <Badge variant="outline">
                  Source: {contact.source.replace('_', ' ')}
                </Badge>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                
                {contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}

                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${contact.phone}`} className="text-sm hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                )}

                {contact.company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{contact.company}</span>
                  </div>
                )}

                {contact.title && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{contact.title}</span>
                  </div>
                )}

                {contact.linkedin_url && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                      LinkedIn Profile
                    </a>
                  </div>
                )}

                {contact.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                      {contact.website}
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Notes */}
              {contact.notes && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Notes</h3>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {contact.notes}
                    </p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Metadata */}
              <div className="space-y-4">
                <h3 className="font-semibold">Record Information</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created by:</span>
                    <UserBadge userId={contact.created_by} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{format(new Date(contact.created_at), 'PPp')}</span>
                  </div>

                  {contact.last_contacted_at && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Last contacted:</span>
                        <span>{format(new Date(contact.last_contacted_at), 'PPp')}</span>
                      </div>
                      {contact.last_contacted_by && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Last contacted by:</span>
                          <UserBadge userId={contact.last_contacted_by} />
                        </div>
                      )}
                    </>
                  )}

                  {contact.next_follow_up && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Next follow-up:</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(contact.next_follow_up), 'PP')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <ContactDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contact={contact}
        onSuccess={() => {
          loadContact();
          onUpdate?.();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contact.first_name} {contact.last_name}? 
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Contact'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
