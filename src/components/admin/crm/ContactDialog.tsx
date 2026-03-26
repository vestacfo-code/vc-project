import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Contact, ContactStatus, ContactSource } from '@/types/crm';
import { Loader2 } from 'lucide-react';

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onSuccess?: () => void;
}

export const ContactDialog = ({ open, onOpenChange, contact, onSuccess }: ContactDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    status: 'lead' as ContactStatus,
    source: 'cold_call' as ContactSource,
    linkedin_url: '',
    website: '',
    tags: '',
    notes: ''
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        title: contact.title || '',
        status: contact.status,
        source: contact.source,
        linkedin_url: contact.linkedin_url || '',
        website: contact.website || '',
        tags: contact.tags?.join(', ') || '',
        notes: contact.notes || ''
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        title: '',
        status: 'lead',
        source: 'cold_call',
        linkedin_url: '',
        website: '',
        tags: '',
        notes: ''
      });
    }
  }, [contact, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contactData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      if (contact) {
        const { error } = await supabase
          .from('crm_contacts')
          .update(contactData)
          .eq('id', contact.id);

        if (error) throw error;

        toast({
          title: 'Contact Updated',
          description: 'Contact has been updated successfully.'
        });
      } else {
        const { error } = await supabase
          .from('crm_contacts')
          .insert(contactData);

        if (error) throw error;

        toast({
          title: 'Contact Created',
          description: 'New contact has been created successfully.'
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to save contact. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Create New Contact'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+14155551234"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="CEO"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as ContactStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value as ContactSource })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="vip, hot-lead, enterprise"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information about this contact..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {contact ? 'Update Contact' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
