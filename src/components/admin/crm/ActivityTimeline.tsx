import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Calendar, FileText, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelineActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  contactName: string;
  contactId: string;
  description: string;
  timestamp: string;
  status?: string;
  outcome?: string;
  userName: string;
}

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task: CheckCircle,
};

export const ActivityTimeline = () => {
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Real-time subscription
    const channel = supabase
      .channel('timeline-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'crm_activities'
      }, () => {
        fetchActivities();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'crm_call_logs'
      }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      // Fetch activities
      const { data: activitiesData } = await supabase
        .from('crm_activities')
        .select(`
          id,
          activity_type,
          subject,
          description,
          status,
          created_at,
          crm_contacts (
            id,
            first_name,
            last_name
          ),
          profiles!crm_activities_created_by_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch call logs
      const { data: callLogs } = await supabase
        .from('crm_call_logs')
        .select(`
          id,
          outcome,
          notes,
          call_date,
          caller_name,
          crm_contacts (
            id,
            first_name,
            last_name
          )
        `)
        .order('call_date', { ascending: false })
        .limit(20);

      const combined: TimelineActivity[] = [];

      // Process activities
      if (activitiesData) {
        activitiesData.forEach((activity: any) => {
          combined.push({
            id: activity.id,
            type: activity.activity_type,
            contactName: activity.crm_contacts 
              ? `${activity.crm_contacts.first_name || ''} ${activity.crm_contacts.last_name || ''}`.trim()
              : 'Unknown Contact',
            contactId: activity.crm_contacts?.id || '',
            description: activity.subject || activity.description || 'No description',
            timestamp: activity.created_at,
            status: activity.status,
            userName: activity.profiles?.full_name || 'Unknown User',
          });
        });
      }

      // Process call logs
      if (callLogs) {
        callLogs.forEach((call: any) => {
          combined.push({
            id: call.id,
            type: 'call',
            contactName: call.crm_contacts 
              ? `${call.crm_contacts.first_name || ''} ${call.crm_contacts.last_name || ''}`.trim()
              : 'Unknown Contact',
            contactId: call.crm_contacts?.id || '',
            description: call.notes || 'Call logged',
            timestamp: call.call_date,
            outcome: call.outcome,
            userName: call.caller_name,
          });
        });
      }

      // Sort by timestamp
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(combined.slice(0, 50));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeBadgeVariant = (outcome?: string) => {
    switch (outcome) {
      case 'connected':
        return 'default';
      case 'voicemail':
        return 'secondary';
      case 'no_answer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent activities across all contacts</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="h-4 w-4 animate-spin mr-2" />
                Loading activities...
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities found
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = activityIcons[activity.type] || FileText;
                return (
                  <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            {activity.contactName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {activity.outcome && (
                            <Badge variant={getOutcomeBadgeVariant(activity.outcome)}>
                              {activity.outcome.replace('_', ' ')}
                            </Badge>
                          )}
                          {activity.status && (
                            <Badge variant="outline">
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.userName}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
