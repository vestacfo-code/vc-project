 import { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, CheckCircle, Plus, Clock, CheckCircle2, AlertCircle, XCircle, ArrowLeft, ChevronRight, ChevronDown, History } from 'lucide-react';
import { format } from 'date-fns';

interface SupportFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface CreditLog {
  id: string;
  action_type: string;
  credits_used: number;
  description: string | null;
  timestamp: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open': return <Clock className="w-3 h-3" />;
    case 'in_progress': return <AlertCircle className="w-3 h-3" />;
    case 'resolved': return <CheckCircle2 className="w-3 h-3" />;
    case 'closed': return <XCircle className="w-3 h-3" />;
    default: return <Clock className="w-3 h-3" />;
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'resolved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'closed': return 'bg-vesta-navy-muted/20 text-vesta-navy-muted border-vesta-navy/30';
    default: return 'bg-vesta-navy-muted/20 text-vesta-navy-muted border-vesta-navy/30';
  }
};

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500/20 text-red-400';
    case 'high': return 'bg-orange-500/20 text-orange-400';
    case 'normal': return 'bg-vesta-navy-muted/20 text-vesta-navy-muted';
    case 'low': return 'bg-vesta-navy-muted/20 text-vesta-navy/65';
    default: return 'bg-vesta-navy-muted/20 text-vesta-navy-muted';
  }
};

const SupportFormDrawer = ({ open, onOpenChange }: SupportFormDrawerProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'tickets' | 'new'>('tickets');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [creditLogs, setCreditLogs] = useState<CreditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [logsExpanded, setLogsExpanded] = useState(false);

  useEffect(() => {
    if (open) {
      loadTickets();
      loadCreditLogs();
    }
  }, [open]);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadCreditLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('credit_usage_log')
        .select('id, action_type, credits_used, description, timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(25);

      if (error) throw error;
      setCreditLogs(data || []);
    } catch (error) {
      console.error('Error loading credit logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const toggleLogSelection = (logId: string) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please fill in both subject and description.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Build description with attached logs
      let fullDescription = description;
      if (selectedLogs.length > 0) {
        const attachedLogs = creditLogs.filter(log => selectedLogs.includes(log.id));
        const logsText = attachedLogs.map(log => 
          `[${format(new Date(log.timestamp), 'MMM d, h:mm a')}] ${log.action_type}: ${log.credits_used} credits${log.description ? ` - ${log.description}` : ''}`
        ).join('\n');
        fullDescription += `\n\n--- Attached Activity Logs ---\n${logsText}`;
      }

      const { data, error } = await supabase.functions.invoke('create-support-ticket', {
        body: { subject, description: fullDescription, priority }
      });

      if (error) throw error;

      setTicketNumber(data.ticketNumber);
      setSubmitted(true);
      toast({
        title: 'Ticket submitted!',
        description: `Your support ticket ${data.ticketNumber} has been created.`,
      });
      loadTickets();
      setActiveTab('tickets');
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      toast({
        title: 'Failed to submit ticket',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSubject('');
      setDescription('');
      setPriority('normal');
      setSubmitted(false);
      setTicketNumber(null);
      setSelectedTicket(null);
      setActiveTab('tickets');
      setSelectedLogs([]);
      setLogsExpanded(false);
    }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="left" 
        className="w-full sm:max-w-md p-0 border-0 bg-white flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-vesta-navy/10">
          <h1 className="font-serif text-3xl text-vesta-navy">Support</h1>
          <p className="text-sm text-vesta-navy-muted mt-1">We're here to help</p>
        </div>

        {/* Content */}
       <div className="flex-1 overflow-y-auto">
          {selectedTicket ? (
           <div className="flex flex-col">
              <div className="px-6 py-4 border-b border-vesta-navy/10">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="flex items-center gap-2 text-vesta-navy-muted hover:text-vesta-navy transition-colors text-sm mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to tickets
                </button>
                <h3 className="font-medium text-vesta-navy text-lg">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-2 mt-3">
                  <span className="font-mono text-xs text-vesta-navy/65">{selectedTicket.ticket_number}</span>
                  <Badge className={`${getStatusStyle(selectedTicket.status)} border text-xs`}>
                    {getStatusIcon(selectedTicket.status)}
                    <span className="ml-1 capitalize">{selectedTicket.status.replace('_', ' ')}</span>
                  </Badge>
                  <Badge className={`${getPriorityStyle(selectedTicket.priority)} text-xs border-0`}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
              </div>
             <div className="px-6 py-5">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-vesta-navy/65 uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-sm text-vesta-navy/80">{format(new Date(selectedTicket.created_at), 'PPp')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-vesta-navy/65 uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm text-vesta-navy/80 whitespace-pre-wrap bg-vesta-mist/25 p-4 rounded-lg border border-vesta-navy/10">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>
             </div>
            </div>
          ) : submitted ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center flex-1">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-vesta-navy mb-2">Ticket Submitted!</h3>
              <p className="text-vesta-navy-muted mb-2">
                Your ticket <span className="font-mono font-medium text-vesta-navy">{ticketNumber}</span> has been created.
              </p>
              <p className="text-sm text-vesta-navy/65 mb-8">
                Our team will respond within 24-48 hours.
              </p>
              <Button 
                onClick={() => {
                  setSubmitted(false);
                  setActiveTab('tickets');
                }} 
                variant="outline"
                className="border-vesta-navy/15 text-vesta-navy hover:bg-vesta-mist/40 bg-transparent"
              >
                View My Tickets
              </Button>
            </div>
          ) : (
           <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tickets' | 'new')} className="flex flex-col">
             <div className="px-6 pt-4 pb-2">
                <TabsList className="w-full bg-vesta-mist/25 p-1 rounded-lg border border-vesta-navy/10">
                  <TabsTrigger 
                    value="tickets" 
                    className="flex-1 data-[state=active]:bg-vesta-mist/40 data-[state=active]:text-vesta-navy text-vesta-navy-muted rounded-md text-sm"
                  >
                    My Tickets
                  </TabsTrigger>
                  <TabsTrigger 
                    value="new" 
                    className="flex-1 data-[state=active]:bg-vesta-mist/40 data-[state=active]:text-vesta-navy text-vesta-navy-muted rounded-md text-sm"
                  >
                    New Request
                  </TabsTrigger>
                </TabsList>
              </div>

             <TabsContent value="tickets" className="flex-1 flex flex-col mt-0">
                {loadingTickets ? (
                 <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-vesta-navy/65" />
                  </div>
                ) : tickets.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-vesta-mist/25 flex items-center justify-center mb-5">
                      <Send className="w-6 h-6 text-vesta-navy/65" />
                    </div>
                    <h3 className="font-medium text-vesta-navy mb-2 text-lg">No tickets yet</h3>
                    <p className="text-sm text-vesta-navy/65 mb-6">Submit a request to get help from our team</p>
                    <Button 
                      onClick={() => setActiveTab('new')}
                      className="bg-white text-black hover:bg-vesta-mist/50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Request
                    </Button>
                  </div>
                ) : (
                   <div className="px-6 py-4 space-y-3">
                      {tickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className="w-full text-left p-4 rounded-xl border border-vesta-navy/10 bg-vesta-mist/25 hover:bg-vesta-mist/40 hover:border-vesta-navy/15 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-vesta-navy truncate">{ticket.subject}</p>
                              <p className="text-xs text-vesta-navy/65 mt-1 font-mono">{ticket.ticket_number}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusStyle(ticket.status)} border text-xs shrink-0`}>
                                {getStatusIcon(ticket.status)}
                                <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                              </Badge>
                              <ChevronRight className="w-4 h-4 text-vesta-navy/80 group-hover:text-vesta-navy transition-colors" />
                            </div>
                          </div>
                          <p className="text-xs text-vesta-navy/65 mt-3">
                            {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                          </p>
                        </button>
                      ))}
                    </div>
                )}
              </TabsContent>

             <TabsContent value="new" className="flex-1 mt-0">
                 <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                   <div className="space-y-1.5">
                      <Label htmlFor="subject" className="text-vesta-navy/80 text-sm">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={submitting}
                        className="bg-vesta-mist/25 border-vesta-navy/10 text-vesta-navy placeholder:text-vesta-navy/65 focus:border-vesta-navy/12 focus:ring-0"
                      />
                    </div>

                   <div className="space-y-1.5">
                      <Label htmlFor="priority" className="text-vesta-navy/80 text-sm">Priority</Label>
                      <Select value={priority} onValueChange={setPriority} disabled={submitting}>
                        <SelectTrigger className="bg-vesta-mist/25 border-vesta-navy/10 text-vesta-navy">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border border-vesta-navy/10 bg-white">
                          <SelectItem value="low" className="text-vesta-navy/80 focus:bg-vesta-mist/40 focus:text-vesta-navy">Low - General question</SelectItem>
                          <SelectItem value="normal" className="text-vesta-navy/80 focus:bg-vesta-mist/40 focus:text-vesta-navy">Normal - Standard issue</SelectItem>
                          <SelectItem value="high" className="text-vesta-navy/80 focus:bg-vesta-mist/40 focus:text-vesta-navy">High - Impacting work</SelectItem>
                          <SelectItem value="urgent" className="text-vesta-navy/80 focus:bg-vesta-mist/40 focus:text-vesta-navy">Urgent - Critical blocker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                   <div className="space-y-1.5">
                      <Label htmlFor="description" className="text-vesta-navy/80 text-sm">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Please describe your issue in detail..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={submitting}
                       rows={5}
                        className="resize-none bg-vesta-mist/25 border-vesta-navy/10 text-vesta-navy placeholder:text-vesta-navy/65 focus:border-vesta-navy/12 focus:ring-0"
                      />
                    </div>

                    {/* Activity Logs Section */}
                   <Collapsible open={logsExpanded} onOpenChange={setLogsExpanded} className="border border-vesta-navy/10 rounded-lg">
                     <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm text-vesta-navy-muted hover:text-vesta-navy transition-colors">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4" />
                          <span>Attach activity logs (optional)</span>
                          {selectedLogs.length > 0 && (
                            <Badge className="bg-vesta-mist/40 text-vesta-navy text-xs border-0">
                              {selectedLogs.length} selected
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${logsExpanded ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                     <CollapsibleContent>
                       <div className="border-t border-vesta-navy/10 max-h-40 overflow-y-auto">
                          {loadingLogs ? (
                           <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 animate-spin text-vesta-navy/65" />
                            </div>
                          ) : creditLogs.length === 0 ? (
                           <p className="text-xs text-vesta-navy/65 text-center py-3">No recent activity</p>
                          ) : (
                            <div className="divide-y divide-white/5">
                              {creditLogs.map((log) => (
                                <label
                                  key={log.id}
                                 className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-vesta-mist/25 transition-colors"
                                >
                                  <Checkbox
                                    checked={selectedLogs.includes(log.id)}
                                    onCheckedChange={() => toggleLogSelection(log.id)}
                                    className="mt-0.5 border-vesta-navy/15 data-[state=checked]:bg-white data-[state=checked]:text-black"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-vesta-navy">{log.action_type.replace(/_/g, ' ')}</span>
                                      <span className="text-xs text-vesta-navy/65">-{log.credits_used} credits</span>
                                    </div>
                                    <p className="text-xs text-vesta-navy/65 mt-0.5">
                                      {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <Button 
                      type="submit" 
                     className="w-full bg-white text-black hover:bg-vesta-mist/50 h-11 rounded-lg font-medium mt-2" 
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SupportFormDrawer;