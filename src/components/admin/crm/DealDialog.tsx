import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Deal, DealStage, Contact } from '@/types/crm';
import { CalendarIcon, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  onSuccess?: () => void;
}

interface ContactOption {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
}

export const DealDialog = ({ open, onOpenChange, deal, onSuccess }: DealDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    contact_id: '',
    title: '',
    value: '',
    currency: 'USD',
    stage: 'prospecting' as DealStage,
    probability: 50,
    expected_close_date: undefined as Date | undefined,
    notes: ''
  });

  useEffect(() => {
    if (open) {
      loadContacts();
      if (deal) {
        setFormData({
          contact_id: deal.contact_id,
          title: deal.title,
          value: deal.value.toString(),
          currency: deal.currency,
          stage: deal.stage,
          probability: deal.probability,
          expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : undefined,
          notes: deal.notes || ''
        });
      } else {
        setFormData({
          contact_id: '',
          title: '',
          value: '',
          currency: 'USD',
          stage: 'prospecting',
          probability: 50,
          expected_close_date: undefined,
          notes: ''
        });
      }
    }
  }, [deal, open]);

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, company, email')
        .order('last_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    return (
      contact.first_name?.toLowerCase().includes(query) ||
      contact.last_name?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dealData = {
        contact_id: formData.contact_id,
        title: formData.title,
        value: parseFloat(formData.value),
        currency: formData.currency,
        stage: formData.stage,
        probability: formData.probability,
        expected_close_date: formData.expected_close_date ? format(formData.expected_close_date, 'yyyy-MM-dd') : null,
        notes: formData.notes
      };

      if (deal) {
        const { error } = await supabase
          .from('crm_deals')
          .update(dealData)
          .eq('id', deal.id);

        if (error) throw error;

        toast({
          title: 'Deal Updated',
          description: 'Deal has been updated successfully.'
        });
      } else {
        const { error } = await supabase
          .from('crm_deals')
          .insert(dealData);

        if (error) throw error;

        toast({
          title: 'Deal Created',
          description: 'New deal has been created successfully.'
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to save deal. Please try again.',
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
          <DialogTitle>{deal ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact">Contact *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={formData.contact_id} onValueChange={(value) => setFormData({ ...formData, contact_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {filteredContacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} {contact.company && `(${contact.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Deal Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Q1 Enterprise License"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Deal Value *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="50000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value as DealStage })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospecting">Prospecting</SelectItem>
                <SelectItem value="qualification">Qualification</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed_won">Closed Won</SelectItem>
                <SelectItem value="closed_lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="probability">Probability: {formData.probability}%</Label>
            <Slider
              id="probability"
              min={0}
              max={100}
              step={5}
              value={[formData.probability]}
              onValueChange={(value) => setFormData({ ...formData, probability: value[0] })}
            />
          </div>

          <div className="space-y-2">
            <Label>Expected Close Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {formData.expected_close_date ? format(formData.expected_close_date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.expected_close_date}
                  onSelect={(date) => setFormData({ ...formData, expected_close_date: date })}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information about this deal..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deal ? 'Update Deal' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
