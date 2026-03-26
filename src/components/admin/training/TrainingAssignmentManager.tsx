import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, UserPlus, X, Trash2, Users as UsersIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import TrainingProgress from './TrainingProgress';

interface TrainingMaterial {
  id: string;
  title: string;
}

interface User {
  user_id: string;
  email: string;
  full_name: string | null;
}

interface Assignment {
  id: string;
  assigned_to: string;
  due_date: string | null;
  status: string;
  progress_percentage: number;
  assigned_at: string;
  training_materials: {
    id: string;
    title: string;
  };
  profiles: {
    full_name: string | null;
    email: string;
  };
}

export default function TrainingAssignmentManager() {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>();
  const [assigning, setAssigning] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [filterUserId, setFilterUserId] = useState<string>('all');

  useEffect(() => {
    fetchMaterials();
    fetchUsers();
    fetchAssignments();
  }, []);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('training_materials')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'hr_staff', 'super_admin', 'staff']);

      if (error) throw error;

      const userIds = data?.map(r => r.user_id) || [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds)
        .order('full_name');

      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const { data, error } = await supabase
        .from('training_assignments')
        .select(`
          id,
          assigned_to,
          due_date,
          status,
          progress_percentage,
          assigned_at,
          training_materials (
            id,
            title
          )
        `)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(a => a.assigned_to))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        // Merge profiles with assignments
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        const enrichedData = data.map(assignment => ({
          ...assignment,
          profiles: profileMap.get(assignment.assigned_to) || { full_name: null, email: 'Unknown' }
        }));

        setAssignments(enrichedData);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeMaterial = (materialId: string) => {
    setSelectedMaterials(prev => prev.filter(id => id !== materialId));
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  const handleBulkAssign = async () => {
    if (selectedMaterials.length === 0 || selectedUsers.length === 0) {
      toast.error('Please select at least one training material and one user');
      return;
    }

    try {
      setAssigning(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const assignments = [];
      for (const userId of selectedUsers) {
        for (const materialId of selectedMaterials) {
          assignments.push({
            training_material_id: materialId,
            assigned_to: userId,
            assigned_by: user.id,
            due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
          });
        }
      }

      const { error } = await supabase
        .from('training_assignments')
        .insert(assignments);

      if (error) {
        if (error.code === '23505') {
          toast.error('Some training materials are already assigned to selected users');
        } else {
          throw error;
        }
        return;
      }

      toast.success(`${assignments.length} training assignment(s) created successfully`);
      setSelectedMaterials([]);
      setSelectedUsers([]);
      setDueDate(undefined);
      fetchAssignments();
    } catch (error) {
      console.error('Error assigning training:', error);
      toast.error('Failed to assign training');
    } finally {
      setAssigning(false);
    }
  };

  const handleRevoke = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('training_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      toast.success('Assignment revoked');
      fetchAssignments();
    } catch (error) {
      console.error('Error revoking assignment:', error);
      toast.error('Failed to revoke assignment');
    }
  };

  const getStatusBadge = (status: string, dueDate: string | null) => {
    if (status === 'completed') {
      return <Badge className="bg-green-500">Completed</Badge>;
    }
    if (status === 'in_progress') {
      return <Badge className="bg-blue-500">In Progress</Badge>;
    }
    if (dueDate && new Date(dueDate) < new Date()) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
  };

  const filteredAssignments = filterUserId === 'all' 
    ? assignments 
    : assignments.filter(a => a.assigned_to === filterUserId);

  const assignedUsers = Array.from(
    new Set(assignments.map(a => a.assigned_to))
  ).map(userId => {
    const assignment = assignments.find(a => a.assigned_to === userId);
    const fullName = assignment?.profiles?.full_name;
    const email = assignment?.profiles?.email;
    const displayName = fullName 
      ? `${fullName} (${email})` 
      : email || 'Unknown';
    return {
      userId,
      name: displayName,
      count: assignments.filter(a => a.assigned_to === userId).length
    };
  });

  return (
    <div className="space-y-6">
      {/* Bulk Assignment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Bulk Assign Training</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material" className="text-sm">Training Materials * (Select multiple)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-auto min-h-9 justify-start text-left font-normal text-sm">
                  {selectedMaterials.length === 0 ? (
                    <span className="text-muted-foreground">Select training materials...</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedMaterials.map(id => {
                        const material = materials.find(m => m.id === id);
                        return material ? (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {material.title}
                            <X 
                              className="ml-1 h-3 w-3 cursor-pointer" 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMaterial(id);
                              }}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {materials.map((material) => (
                    <div key={material.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`material-${material.id}`}
                        checked={selectedMaterials.includes(material.id)}
                        onCheckedChange={() => toggleMaterial(material.id)}
                      />
                      <label
                        htmlFor={`material-${material.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {material.title}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="users" className="text-sm">Assign To * (Select multiple users)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-auto min-h-9 justify-start text-left font-normal text-sm">
                  {selectedUsers.length === 0 ? (
                    <span className="text-muted-foreground">Select users...</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedUsers.map(id => {
                        const user = users.find(u => u.user_id === id);
                        return user ? (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {user.full_name || user.email} {user.full_name && user.email ? `(${user.email})` : ''}
                            <X 
                              className="ml-1 h-3 w-3 cursor-pointer" 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUser(id);
                              }}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.user_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.user_id}`}
                        checked={selectedUsers.includes(user.user_id)}
                        onCheckedChange={() => toggleUser(user.user_id)}
                      />
                      <label
                        htmlFor={`user-${user.user_id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {user.full_name || user.email} {user.full_name && user.email ? `(${user.email})` : ''}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-9 justify-start text-left font-normal text-sm",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button 
            onClick={handleBulkAssign} 
            disabled={assigning || selectedMaterials.length === 0 || selectedUsers.length === 0}
            className="w-full h-9 text-sm"
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            {assigning ? 'Assigning...' : `Assign ${selectedMaterials.length} Training(s) to ${selectedUsers.length} User(s)`}
          </Button>
        </CardContent>
      </Card>

      {/* Assignments Management Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-base sm:text-lg">Current Assignments</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterUserId} onValueChange={setFilterUserId}>
                <SelectTrigger className="w-[200px] h-9 text-sm">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users ({assignments.length})</SelectItem>
                  {assignedUsers.map((user) => (
                    <SelectItem key={user.userId} value={user.userId}>
                      {user.name} ({user.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAssignments ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading assignments...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {filterUserId === 'all' ? 'No assignments yet' : 'No assignments for this user'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">User</TableHead>
                    <TableHead className="text-xs sm:text-sm">Training</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm">Progress</TableHead>
                    <TableHead className="text-xs sm:text-sm">Due Date</TableHead>
                    <TableHead className="text-xs sm:text-sm text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="font-medium">
                          {assignment.profiles?.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {assignment.profiles?.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {assignment.training_materials?.title || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {getStatusBadge(assignment.status, assignment.due_date)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <TrainingProgress percentage={assignment.progress_percentage || 0} />
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {assignment.due_date ? format(new Date(assignment.due_date), "MMM d, yyyy") : 'No due date'}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke Assignment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the training assignment from the user.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevoke(assignment.id)}>
                                Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
