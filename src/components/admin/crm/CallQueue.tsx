import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/crm';
import { useAuth } from '@/hooks/useAuth';
import { Phone, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface CallQueueProps {
  onSelectContact: (contact: Contact) => void;
}

export const CallQueue = ({ onSelectContact }: CallQueueProps) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'lead' | 'prospect'>('all');

  useEffect(() => {
    loadQueue();
  }, [showOnlyMine, statusFilter]);

  const loadQueue = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .in('status', ['lead', 'prospect']);

      if (showOnlyMine) {
        query = query.or(`assigned_to.eq.${user.id},last_contacted_by.eq.${user.id}`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Priority order: overdue follow-ups first, then by next_follow_up date
      query = query.order('next_follow_up', { ascending: true, nullsFirst: false });

      const { data, error } = await query;

      if (error) throw error;

      setQueue(data || []);
    } catch (error) {
      console.error('Error loading call queue:', error);
      toast.error('Failed to load call queue');
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (contact: Contact) => {
    if (!contact.next_follow_up) return false;
    return new Date(contact.next_follow_up) < new Date();
  };

  const getContactPriority = (contact: Contact) => {
    if (isOverdue(contact)) return 'high';
    if (contact.status === 'prospect') return 'medium';
    return 'normal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Call Queue</CardTitle>
            <CardDescription>
              {queue.length} contacts ready to call
            </CardDescription>
          </div>
          <Badge variant="secondary">{queue.filter(c => isOverdue(c)).length} overdue</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={showOnlyMine}
              onCheckedChange={setShowOnlyMine}
              id="my-contacts"
            />
            <Label htmlFor="my-contacts">My Contacts Only</Label>
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'lead' | 'prospect')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No contacts in queue
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {queue.map((contact) => {
              const priority = getContactPriority(contact);
              return (
                <Card key={contact.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <Badge variant={getPriorityColor(priority) as any}>
                          {priority}
                        </Badge>
                        {isOverdue(contact) && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      {contact.company && (
                        <p className="text-sm text-muted-foreground">{contact.company}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.next_follow_up && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {isOverdue(contact) 
                              ? `${formatDistanceToNow(new Date(contact.next_follow_up))} overdue`
                              : `Follow up ${formatDistanceToNow(new Date(contact.next_follow_up), { addSuffix: true })}`
                            }
                          </span>
                        )}
                        {contact.last_contacted_at && (
                          <span>
                            Last contacted {formatDistanceToNow(new Date(contact.last_contacted_at))} ago
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button onClick={() => onSelectContact(contact)}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
