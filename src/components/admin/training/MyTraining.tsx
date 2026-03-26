import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TrainingViewer from './TrainingViewer';
import { format, isPast, parseISO } from 'date-fns';

interface Assignment {
  id: string;
  status: string;
  due_date: string | null;
  progress_percentage: number;
  notes: string | null;
  current_section_index?: number;
  training_materials: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    category: string;
    difficulty_level: string;
    estimated_duration: number | null;
    cover_image_url: string | null;
  };
}

export default function MyTraining() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('training_assignments')
        .select(`
          id,
          status,
          due_date,
          progress_percentage,
          notes,
          current_section_index,
          training_materials (
            id,
            title,
            description,
            content,
            category,
            difficulty_level,
            estimated_duration,
            cover_image_url
          )
        `)
        .eq('assigned_to', user.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      setAssignments(data || []);
      
      const total = data?.length || 0;
      const completed = data?.filter(a => a.status === 'completed').length || 0;
      const inProgress = data?.filter(a => a.status === 'in_progress').length || 0;
      const overdue = data?.filter(a => 
        a.status !== 'completed' && 
        a.due_date && 
        isPast(parseISO(a.due_date))
      ).length || 0;

      setStats({ total, completed, inProgress, overdue });
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load training assignments');
    } finally {
      setLoading(false);
    }
  };

  if (selectedAssignment) {
    return (
      <TrainingViewer
        assignment={selectedAssignment}
        onBack={() => {
          setSelectedAssignment(null);
          fetchAssignments();
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="text-xs text-muted-foreground mb-1">Total</div>
            <div className="text-2xl sm:text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="text-xs text-muted-foreground mb-1">Completed</div>
            <div className="text-2xl sm:text-3xl font-bold text-success">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="text-xs text-muted-foreground mb-1">In Progress</div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="text-xs text-muted-foreground mb-1">Overdue</div>
            <div className="text-2xl sm:text-3xl font-bold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <h2 className="text-xl sm:text-2xl font-semibold">My Training Assignments</h2>
        
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No training assigned yet
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {assignments.map((assignment) => {
              const isCompleted = assignment.status === 'completed';
              const isOverdue = assignment.due_date && isPast(parseISO(assignment.due_date)) && !isCompleted;
              
              return (
                <Card 
                  key={assignment.id} 
                  className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer rounded-xl"
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  {/* Image with overlay */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {assignment.training_materials.cover_image_url ? (
                      <>
                        <img
                          src={assignment.training_materials.cover_image_url}
                          alt={assignment.training_materials.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* Completed checkmark */}
                        {isCompleted && (
                          <div className="absolute top-4 right-4 bg-success rounded-full p-2">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}

                        {/* Badges on hover only - minimal style */}
                        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-[9px] sm:text-[10px] text-white/90 font-medium px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm w-fit">
                            {assignment.training_materials.category}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-white/90 font-medium px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm w-fit">
                            {assignment.training_materials.difficulty_level}
                          </span>
                          {assignment.training_materials.estimated_duration && (
                            <span className="text-[9px] sm:text-[10px] text-white/90 font-medium px-2 py-0.5 bg-black/30 rounded backdrop-blur-sm w-fit flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {assignment.training_materials.estimated_duration}m
                            </span>
                          )}
                        </div>

                        {/* Title overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 group-hover:opacity-0 transition-opacity duration-300">
                          <h3 className="font-semibold text-sm sm:text-base text-white line-clamp-2 leading-snug">
                            {assignment.training_materials.title}
                          </h3>
                        </div>

                        {/* Hover overlay with centered button */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 sm:p-5">
                          {assignment.training_materials.description && (
                            <p className="text-[11px] sm:text-xs text-white/90 text-center line-clamp-3 mb-4 max-w-[90%]">
                              {assignment.training_materials.description}
                            </p>
                          )}
                          <Button 
                            size="lg" 
                            className="bg-white text-black hover:bg-white/90 font-medium shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAssignment(assignment);
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {isCompleted ? 'Review' : assignment.status === 'in_progress' ? 'Continue' : 'Start Training'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <p className="text-muted-foreground text-sm">No preview available</p>
                      </div>
                    )}
                  </div>

                  {/* Minimal progress indicator */}
                  {!isCompleted && assignment.progress_percentage > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                      <div
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${assignment.progress_percentage}%` }}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
