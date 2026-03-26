import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, User, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AuditLog } from '@/types/crm';

export const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data || []) as AuditLog[]);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const uniqueEntityTypes = Array.from(new Set(logs.map(log => log.entity_type)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>Track all changes made in the CRM system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {uniqueEntityTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace('crm_', '').replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="h-4 w-4 animate-spin mr-2" />
                Loading audit logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionColor(log.action_type)}>
                        {log.action_type}
                      </Badge>
                      <Badge variant="outline">
                        {log.entity_type.replace('crm_', '')}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{log.user_name}</span>
                    <span className="text-muted-foreground">({log.user_email})</span>
                  </div>

                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <div className="font-semibold mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Changes:
                      </div>
                      <div className="space-y-1 ml-4">
                        {Object.entries(log.changes.changed_fields || {}).map(([field, values]: [string, any]) => (
                          <div key={field} className="flex gap-2">
                            <span className="font-medium">{field}:</span>
                            <span className="text-muted-foreground">
                              {JSON.stringify(values.old)} → {JSON.stringify(values.new)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
