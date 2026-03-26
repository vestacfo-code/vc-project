import { useEffect, useState } from 'react';
import { Phone, Mail, Building, Search, Filter, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Contact, ContactStatus } from '@/types/crm';
import { UserBadge } from './UserBadge';
import { ContactDialog } from './ContactDialog';
import { ContactDetailSheet } from './ContactDetailSheet';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export const ContactList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  useEffect(() => {
    loadContacts();

    // Real-time subscription
    const channel = supabase
      .channel('contacts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'crm_contacts'
      }, () => {
        loadContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const getDisplayName = (contact: Contact) => {
    const firstName = contact.first_name?.trim();
    const lastName = contact.last_name?.trim();
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (contact.company) {
      return contact.company;
    }
    return 'Unnamed Contact';
  };

  const getStatusColor = (status: ContactStatus) => {
    switch (status) {
      case 'lead': return 'default';
      case 'prospect': return 'secondary';
      case 'demo_scheduled': return 'default';
      case 'customer': return 'default';
      case 'inactive': return 'outline';
      default: return 'default';
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    const displayName = getDisplayName(contact);
    return (
      displayName.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.company?.toLowerCase().includes(searchLower) ||
      contact.phone?.includes(searchQuery)
    );
  });

  const handleRowClick = (contactId: string) => {
    setSelectedContactId(contactId);
    setDetailSheetOpen(true);
  };

  return (
    <>
      <Card className="border-border/40">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg">Contacts</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">Manage CRM contacts</CardDescription>
            </div>
            <Button onClick={() => setContactDialogOpen(true)} size="sm" className="h-8 text-xs">
              <UserPlus className="h-3.5 w-3.5 sm:mr-1.5" />
              <span>Add Contact</span>
            </Button>
          </div>
        </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ContactStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs sm:text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="demo_scheduled">Demo</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No contacts found</div>
        ) : (
          <>
            {/* Mobile: Compact card layout */}
            <div className="sm:hidden space-y-2">
              {filteredContacts.map((contact) => (
                <Card 
                  key={contact.id} 
                  className="cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors border-border/40"
                  onClick={() => handleRowClick(contact.id)}
                >
                  <CardContent className="p-3 space-y-2">
                    {/* Compact header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {getDisplayName(contact)}
                        </p>
                        {contact.title && (
                          <p className="text-xs text-muted-foreground truncate">{contact.title}</p>
                        )}
                      </div>
                      <Badge variant={getStatusColor(contact.status)} className="flex-shrink-0 text-[10px] h-5 px-1.5">
                        {contact.status}
                      </Badge>
                    </div>
                    
                    {/* Company - more compact */}
                    {contact.company && (
                      <div className="flex items-center gap-1.5 text-xs min-w-0">
                        <Building className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{contact.company}</span>
                      </div>
                    )}
                    
                    {/* Contact info - condensed */}
                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-1.5 text-xs min-w-0">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="font-mono">{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Compact action footer */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {contact.phone && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => window.location.href = `tel:${contact.phone}`}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                        )}
                        {contact.email && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => window.location.href = `mailto:${contact.email}`}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Button>
                        )}
                      </div>
                      {contact.last_contacted_at && (
                        <p className="text-[10px] text-muted-foreground truncate ml-2">
                          {formatDistanceToNow(new Date(contact.last_contacted_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow 
                      key={contact.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(contact.id)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {getDisplayName(contact)}
                          </p>
                          {contact.title && (
                            <p className="text-sm text-muted-foreground">{contact.title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.company && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {contact.company}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <UserBadge userId={contact.created_by} />
                      </TableCell>
                      <TableCell>
                        {contact.last_contacted_at && contact.last_contacted_by ? (
                          <div className="text-sm">
                            <UserBadge userId={contact.last_contacted_by} />
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(contact.last_contacted_at))} ago
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {contact.phone && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.location.href = `tel:${contact.phone}`}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          {contact.email && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.location.href = `mailto:${contact.email}`}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>

    <ContactDialog
      open={contactDialogOpen}
      onOpenChange={setContactDialogOpen}
      onSuccess={loadContacts}
    />

    <ContactDetailSheet
      contactId={selectedContactId}
      open={detailSheetOpen}
      onOpenChange={setDetailSheetOpen}
      onUpdate={loadContacts}
    />
    </>
  );
};