 import React, { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import { format } from 'date-fns';
 import { Loader2, Search, RefreshCw, MessageSquare, Clock, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
 
 interface SupportTicket {
   id: string;
   ticket_number: string;
   user_id: string;
   user_email: string;
   user_name: string | null;
   subject: string;
   description: string;
   status: string;
   priority: string;
   created_at: string;
   updated_at: string;
   resolved_at: string | null;
   assigned_to: string | null;
   notes: string | null;
 }
 
 export function SupportAdminSection() {
   const { toast } = useToast();
   const [tickets, setTickets] = useState<SupportTicket[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
   const [detailsOpen, setDetailsOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [statusFilter, setStatusFilter] = useState<string>('all');
   const [saving, setSaving] = useState(false);
   const [adminNotes, setAdminNotes] = useState('');
 
   useEffect(() => {
     loadTickets();
   }, [statusFilter]);
 
   const loadTickets = async () => {
     setLoading(true);
     try {
       let query = supabase
         .from('support_tickets')
         .select('*')
         .order('created_at', { ascending: false });
 
       if (statusFilter !== 'all') {
         query = query.eq('status', statusFilter);
       }
 
       const { data, error } = await query;
       if (error) throw error;
       setTickets(data || []);
     } catch (error) {
       console.error('Error loading tickets:', error);
       toast({
         title: 'Error loading tickets',
         description: 'Please try again.',
         variant: 'destructive',
       });
     } finally {
       setLoading(false);
     }
   };
 
   const updateTicketStatus = async (ticketId: string, newStatus: string) => {
     setSaving(true);
     try {
       const updates: any = { status: newStatus };
       if (newStatus === 'resolved') {
         updates.resolved_at = new Date().toISOString();
       }
 
       const { error } = await supabase
         .from('support_tickets')
         .update(updates)
         .eq('id', ticketId);
 
       if (error) throw error;
 
       toast({ title: 'Status updated' });
       loadTickets();
       if (selectedTicket?.id === ticketId) {
         setSelectedTicket({ ...selectedTicket, status: newStatus });
       }
     } catch (error: any) {
       toast({
         title: 'Failed to update status',
         description: error.message,
         variant: 'destructive',
       });
     } finally {
       setSaving(false);
     }
   };
 
   const saveNotes = async () => {
     if (!selectedTicket) return;
     setSaving(true);
     try {
       const { error } = await supabase
         .from('support_tickets')
         .update({ notes: adminNotes })
         .eq('id', selectedTicket.id);
 
       if (error) throw error;
       toast({ title: 'Notes saved' });
       loadTickets();
     } catch (error: any) {
       toast({
         title: 'Failed to save notes',
         description: error.message,
         variant: 'destructive',
       });
     } finally {
       setSaving(false);
     }
   };
 
   const openTicketDetails = (ticket: SupportTicket) => {
     setSelectedTicket(ticket);
     setAdminNotes(ticket.notes || '');
     setDetailsOpen(true);
   };
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case 'open':
         return <Badge variant="default" className="bg-blue-500">Open</Badge>;
       case 'in_progress':
         return <Badge variant="default" className="bg-yellow-500">In Progress</Badge>;
       case 'resolved':
         return <Badge variant="default" className="bg-green-500">Resolved</Badge>;
       case 'closed':
         return <Badge variant="secondary">Closed</Badge>;
       default:
         return <Badge variant="outline">{status}</Badge>;
     }
   };
 
   const getPriorityBadge = (priority: string) => {
     switch (priority) {
       case 'urgent':
         return <Badge variant="destructive">Urgent</Badge>;
       case 'high':
         return <Badge variant="default" className="bg-orange-500">High</Badge>;
       case 'normal':
         return <Badge variant="outline">Normal</Badge>;
       case 'low':
         return <Badge variant="secondary">Low</Badge>;
       default:
         return <Badge variant="outline">{priority}</Badge>;
     }
   };
 
   const filteredTickets = tickets.filter(ticket => {
     if (!searchQuery) return true;
     const query = searchQuery.toLowerCase();
     return (
       ticket.ticket_number.toLowerCase().includes(query) ||
       ticket.subject.toLowerCase().includes(query) ||
       ticket.user_email.toLowerCase().includes(query) ||
       (ticket.user_name?.toLowerCase().includes(query) ?? false)
     );
   });
 
   const stats = {
     open: tickets.filter(t => t.status === 'open').length,
     inProgress: tickets.filter(t => t.status === 'in_progress').length,
     resolved: tickets.filter(t => t.status === 'resolved').length,
   };
 
   return (
     <div className="space-y-6">
       {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="pt-4">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-blue-100">
                 <MessageSquare className="h-5 w-5 text-blue-600" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Open</p>
                 <p className="text-2xl font-bold">{stats.open}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-4">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-yellow-100">
                 <Clock className="h-5 w-5 text-yellow-600" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">In Progress</p>
                 <p className="text-2xl font-bold">{stats.inProgress}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-4">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-green-100">
                 <CheckCircle className="h-5 w-5 text-green-600" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Resolved</p>
                 <p className="text-2xl font-bold">{stats.resolved}</p>
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-4">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-gray-100">
                 <User className="h-5 w-5 text-gray-600" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Total</p>
                 <p className="text-2xl font-bold">{tickets.length}</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Filters and Search */}
       <Card>
         <CardHeader className="pb-3">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <CardTitle className="text-lg">Support Tickets</CardTitle>
             <div className="flex items-center gap-2">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Search tickets..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-9 w-[250px]"
                 />
               </div>
               <Button variant="outline" size="icon" onClick={loadTickets}>
                 <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
               </Button>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
             <TabsList>
               <TabsTrigger value="all">All</TabsTrigger>
               <TabsTrigger value="open">Open</TabsTrigger>
               <TabsTrigger value="in_progress">In Progress</TabsTrigger>
               <TabsTrigger value="resolved">Resolved</TabsTrigger>
               <TabsTrigger value="closed">Closed</TabsTrigger>
             </TabsList>
           </Tabs>
 
           {loading ? (
             <div className="flex items-center justify-center py-12">
               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
             </div>
           ) : filteredTickets.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               No tickets found
             </div>
           ) : (
             <div className="rounded-md border overflow-hidden">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Ticket</TableHead>
                     <TableHead>User</TableHead>
                     <TableHead>Subject</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Priority</TableHead>
                     <TableHead>Created</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredTickets.map((ticket) => (
                     <TableRow 
                       key={ticket.id} 
                       className="cursor-pointer hover:bg-muted/50"
                       onClick={() => openTicketDetails(ticket)}
                     >
                       <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                       <TableCell>
                         <div>
                           <p className="font-medium">{ticket.user_name || 'Unknown'}</p>
                           <p className="text-xs text-muted-foreground">{ticket.user_email}</p>
                         </div>
                       </TableCell>
                       <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                       <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                       <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                       <TableCell className="text-sm text-muted-foreground">
                         {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Ticket Details Sheet */}
       <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
         <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
           {selectedTicket && (
             <>
               <SheetHeader>
                 <SheetTitle className="flex items-center gap-2">
                   <span className="font-mono">{selectedTicket.ticket_number}</span>
                   {getStatusBadge(selectedTicket.status)}
                 </SheetTitle>
                 <SheetDescription>
                   Created {format(new Date(selectedTicket.created_at), 'PPP p')}
                 </SheetDescription>
               </SheetHeader>
 
               <div className="space-y-6 mt-6">
                 {/* User Info */}
                 <div className="space-y-2">
                   <h3 className="font-medium text-sm text-muted-foreground">From</h3>
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                       <span className="text-sm font-semibold text-primary">
                         {selectedTicket.user_name?.charAt(0)?.toUpperCase() || 
                          selectedTicket.user_email?.charAt(0)?.toUpperCase() || '?'}
                       </span>
                     </div>
                     <div>
                       <p className="font-medium">{selectedTicket.user_name || 'Unknown'}</p>
                       <p className="text-sm text-muted-foreground">{selectedTicket.user_email}</p>
                     </div>
                   </div>
                 </div>
 
                 {/* Subject */}
                 <div className="space-y-2">
                   <h3 className="font-medium text-sm text-muted-foreground">Subject</h3>
                   <p className="font-medium">{selectedTicket.subject}</p>
                 </div>
 
                 {/* Priority */}
                 <div className="space-y-2">
                   <h3 className="font-medium text-sm text-muted-foreground">Priority</h3>
                   {getPriorityBadge(selectedTicket.priority)}
                 </div>
 
                 {/* Description */}
                 <div className="space-y-2">
                   <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                   <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                     {selectedTicket.description}
                   </div>
                 </div>
 
                 {/* Status Update */}
                 <div className="space-y-2">
                   <h3 className="font-medium text-sm text-muted-foreground">Update Status</h3>
                   <Select 
                     value={selectedTicket.status} 
                     onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                     disabled={saving}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="open">Open</SelectItem>
                       <SelectItem value="in_progress">In Progress</SelectItem>
                       <SelectItem value="resolved">Resolved</SelectItem>
                       <SelectItem value="closed">Closed</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
 
                 {/* Admin Notes */}
                 <div className="space-y-2">
                   <h3 className="font-medium text-sm text-muted-foreground">Internal Notes</h3>
                   <Textarea
                     placeholder="Add internal notes about this ticket..."
                     value={adminNotes}
                     onChange={(e) => setAdminNotes(e.target.value)}
                     rows={4}
                   />
                   <Button onClick={saveNotes} disabled={saving} size="sm">
                     {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                     Save Notes
                   </Button>
                 </div>
 
                 {/* Resolution Info */}
                 {selectedTicket.resolved_at && (
                   <div className="space-y-2">
                     <h3 className="font-medium text-sm text-muted-foreground">Resolved</h3>
                     <p className="text-sm">{format(new Date(selectedTicket.resolved_at), 'PPP p')}</p>
                   </div>
                 )}
               </div>
             </>
           )}
         </SheetContent>
       </Sheet>
     </div>
   );
 }