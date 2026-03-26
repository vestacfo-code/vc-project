import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Contact, CallOutcome, CallDisposition, CallScript } from '@/types/crm';
import { CallQueue } from './CallQueue';
import { CallHistoryPanel } from './CallHistoryPanel';
import { CallScriptSelector } from './CallScriptSelector';
import { CallScriptManager } from './CallScriptManager';
import { Phone, PhoneOff, Clock, Calendar as CalendarIcon, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const CallCenter = () => {
  const { user } = useAuth();
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [outcome, setOutcome] = useState<CallOutcome | ''>('');
  const [disposition, setDisposition] = useState<CallDisposition | ''>('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState<Date>();
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null);
  const [scriptManagerOpen, setScriptManagerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (inCall && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inCall, callStartTime]);

  const handleStartCall = () => {
    if (!currentContact) return;
    setInCall(true);
    setCallStartTime(new Date());
    setCallDuration(0);
    
    if (currentContact.phone) {
      window.location.href = `tel:${currentContact.phone}`;
    }
  };

  const handleEndCall = () => {
    setInCall(false);
  };

  const handleLogCall = async () => {
    if (!currentContact || !user) return;

    setSaving(true);
    try {
      // Get user profile for caller info (trigger will also set these but we provide defaults)
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('crm_call_logs')
        .insert({
          contact_id: currentContact.id,
          caller_email: profile?.email || user.email || 'unknown',
          caller_name: profile?.full_name || profile?.email || user.email || 'Unknown',
          duration_seconds: callDuration,
          outcome: outcome || null,
          disposition: disposition || null,
          notes,
          follow_up_date: followUpDate ? format(followUpDate, 'yyyy-MM-dd') : null,
          script_used: selectedScript?.name || null
        });

      if (error) throw error;

      if (followUpDate) {
        await supabase
          .from('crm_contacts')
          .update({ next_follow_up: followUpDate.toISOString() })
          .eq('id', currentContact.id);
      }

      toast.success('Call logged successfully');
      
      setCurrentContact(null);
      setInCall(false);
      setCallStartTime(null);
      setCallDuration(0);
      setOutcome('');
      setDisposition('');
      setNotes('');
      setFollowUpDate(undefined);
      setSelectedScript(null);
    } catch (error) {
      console.error('Error logging call:', error);
      toast.error('Failed to log call');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Call Center</h2>
          <p className="text-muted-foreground">Make calls and track conversations</p>
        </div>
        <Button variant="outline" onClick={() => setScriptManagerOpen(true)}>
          <FileText className="h-4 w-4 mr-2" />
          Manage Scripts
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CallQueue onSelectContact={setCurrentContact} />
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Active Call</CardTitle>
              <CardDescription>
                {currentContact 
                  ? `${currentContact.first_name} ${currentContact.last_name}`
                  : 'Select a contact from the queue'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentContact ? (
                <>
                  <div className="text-center py-6">
                    {inCall ? (
                      <>
                        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25"></div>
                          <div className="relative bg-green-500 rounded-full w-24 h-24 flex items-center justify-center">
                            <Phone className="h-10 w-10 text-white" />
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-2xl font-mono">
                          <Clock className="h-5 w-5" />
                          {formatDuration(callDuration)}
                        </div>
                      </>
                    ) : (
                      <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                        <Phone className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {currentContact.company && (
                      <p className="text-muted-foreground">{currentContact.company}</p>
                    )}
                    {currentContact.phone && (
                      <p className="font-mono">{currentContact.phone}</p>
                    )}
                    {currentContact.email && (
                      <p className="text-muted-foreground">{currentContact.email}</p>
                    )}
                  </div>

                  {!inCall ? (
                    <Button onClick={handleStartCall} className="w-full" size="lg">
                      <Phone className="h-5 w-5 mr-2" />
                      Start Call
                    </Button>
                  ) : (
                    <Button onClick={handleEndCall} variant="destructive" className="w-full" size="lg">
                      <PhoneOff className="h-5 w-5 mr-2" />
                      End Call
                    </Button>
                  )}

                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Call Script</Label>
                      <CallScriptSelector
                        selectedScript={selectedScript}
                        onSelectScript={setSelectedScript}
                      />
                    </div>

                    {selectedScript && (
                      <Card className="bg-muted">
                        <CardContent className="p-4">
                          <p className="text-sm whitespace-pre-wrap">{selectedScript.script_content}</p>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-2">
                      <Label>Call Outcome</Label>
                      <Select value={outcome} onValueChange={(value) => setOutcome(value as CallOutcome)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="connected">Connected</SelectItem>
                          <SelectItem value="voicemail">Voicemail</SelectItem>
                          <SelectItem value="no_answer">No Answer</SelectItem>
                          <SelectItem value="busy">Busy</SelectItem>
                          <SelectItem value="wrong_number">Wrong Number</SelectItem>
                          <SelectItem value="not_interested">Not Interested</SelectItem>
                          <SelectItem value="callback_requested">Callback Requested</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Disposition</Label>
                      <Select value={disposition} onValueChange={(value) => setDisposition(value as CallDisposition)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select disposition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hot">Hot</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                          <SelectItem value="cold">Cold</SelectItem>
                          <SelectItem value="not_qualified">Not Qualified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this call..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Schedule Follow-up</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {followUpDate ? format(followUpDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={followUpDate}
                            onSelect={setFollowUpDate}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button onClick={handleLogCall} className="w-full" disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Log Call
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a contact from the queue to start calling</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <CallHistoryPanel />
        </div>
      </div>

      <CallScriptManager
        open={scriptManagerOpen}
        onOpenChange={setScriptManagerOpen}
      />
    </div>
  );
};
