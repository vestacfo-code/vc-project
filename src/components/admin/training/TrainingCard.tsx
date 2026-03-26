import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Clock, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface TrainingMaterial {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty_level: string;
  estimated_duration: number | null;
  cover_image_url: string | null;
  tags: string[];
}

interface TrainingCardProps {
  material: TrainingMaterial;
  onEdit: (material: TrainingMaterial) => void;
  onDeleted: () => void;
}

export default function TrainingCard({ material, onEdit, onDeleted }: TrainingCardProps) {
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('training_materials')
        .delete()
        .eq('id', material.id);

      if (error) throw error;
      toast.success('Training material deleted');
      onDeleted();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };

  const handleDuplicate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const duplicateData = {
        title: `${material.title} (Copy)`,
        description: material.description,
        category: material.category,
        difficulty_level: material.difficulty_level,
        estimated_duration: material.estimated_duration,
        cover_image_url: material.cover_image_url,
        tags: material.tags,
        created_by: user.id,
        content: '', // Empty content for now
      };

      const { error } = await supabase
        .from('training_materials')
        .insert(duplicateData);

      if (error) throw error;
      toast.success('Training material duplicated');
      onDeleted(); // Refresh the list
    } catch (error) {
      console.error('Error duplicating material:', error);
      toast.error('Failed to duplicate material');
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {material.cover_image_url && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={material.cover_image_url}
            alt={material.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-4 space-y-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{material.title}</h3>
          {material.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {material.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            {material.category}
          </Badge>
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            {material.difficulty_level}
          </Badge>
          {material.estimated_duration && (
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {material.estimated_duration}m
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-xs"
          onClick={() => onEdit(material)}
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={handleDuplicate}
          title="Duplicate"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Training Material?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this training material and all assignments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
