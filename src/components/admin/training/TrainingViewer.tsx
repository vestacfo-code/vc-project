import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ContentBlockViewer from './ContentBlockViewer';
import type { ContentBlock, TrainingSection } from './ContentBlockEditor';

interface Assignment {
  id: string;
  status: string;
  progress_percentage: number;
  notes: string | null;
  current_section_index?: number;
  completed_sections?: number[];
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

interface TrainingViewerProps {
  assignment: Assignment;
  onBack: () => void;
}

export default function TrainingViewer({ assignment, onBack }: TrainingViewerProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(assignment.current_section_index || 0);
  const [status, setStatus] = useState(assignment.status);
  const [updating, setUpdating] = useState(false);
  const [completedSections, setCompletedSections] = useState<number[]>(assignment.completed_sections || []);

  const material = assignment.training_materials;

  const sections: TrainingSection[] = (() => {
    try {
      const parsed = JSON.parse(material.content);
      // New format with sections
      if (parsed.sections && Array.isArray(parsed.sections)) {
        return parsed.sections;
      }
      // Legacy format - wrap blocks in single section
      if (Array.isArray(parsed)) {
        return [{ id: 'legacy', title: 'Training Content', blocks: parsed }];
      }
      return [];
    } catch {
      return [];
    }
  })();

  const currentSection = sections[currentSectionIndex];
  const totalSections = sections.length;
  const progress = totalSections > 0 ? Math.round((completedSections.length / totalSections) * 100) : 0;

  const handleNextSection = async () => {
    try {
      setUpdating(true);
      
      // Mark current section as completed
      const newCompletedSections = [...new Set([...completedSections, currentSectionIndex])];
      const nextIndex = currentSectionIndex + 1;
      const isLastSection = nextIndex >= totalSections;
      const newProgress = Math.round((newCompletedSections.length / totalSections) * 100);
      const newStatus = isLastSection ? 'completed' : newProgress > 0 ? 'in_progress' : 'assigned';

      const { error } = await supabase
        .from('training_assignments')
        .update({
          current_section_index: isLastSection ? currentSectionIndex : nextIndex,
          completed_sections: newCompletedSections,
          progress_percentage: newProgress,
          status: newStatus,
        })
        .eq('id', assignment.id);

      if (error) throw error;

      setCompletedSections(newCompletedSections);
      setStatus(newStatus);
      
      if (isLastSection) {
        toast.success('Training completed!');
        setTimeout(() => onBack(), 1000); // Auto-close after showing success message
      } else {
        setCurrentSectionIndex(nextIndex);
        toast.success('Section completed!');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="h-8 text-sm">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Training
      </Button>

      <Card className="overflow-hidden rounded-xl">
        {/* Hero header with cover image */}
        {material.cover_image_url && (
          <div className="relative h-[45vh] min-h-[350px] w-full overflow-hidden">
            <img
              src={material.cover_image_url}
              alt={material.title}
              className="w-full h-full object-cover"
            />
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10 space-y-3">
              <div className="flex items-center gap-3 text-xs text-white/70 font-medium mb-2">
                <span>{material.category}</span>
                <span>•</span>
                <span>{material.difficulty_level}</span>
                {material.estimated_duration && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {material.estimated_duration} min
                    </span>
                  </>
                )}
                {status === 'completed' && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
                {material.title}
              </h1>
              {material.description && (
                <p className="text-sm sm:text-base text-white/85 max-w-3xl leading-relaxed">
                  {material.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {status !== 'completed' && (
          <div className="p-6 border-b space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Section navigation */}
        {totalSections > 1 && (
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                Section {currentSectionIndex + 1} of {totalSections}
              </span>
              <div className="flex gap-1">
                {sections.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSectionIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSectionIndex
                        ? 'w-8 bg-primary'
                        : completedSections.includes(index)
                        ? 'w-2 bg-success'
                        : 'w-2 bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
            <h2 className="text-xl font-semibold">{currentSection?.title}</h2>
          </div>
        )}

        {/* Content */}
        <CardContent className="p-6 space-y-6">
          {currentSection && <ContentBlockViewer blocks={currentSection.blocks} />}
        </CardContent>

        {/* Navigation buttons */}
        {status !== 'completed' && (
          <CardFooter className="flex gap-2 border-t p-6">
            <Button
              variant="outline"
              onClick={handlePreviousSection}
              disabled={currentSectionIndex === 0 || updating}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNextSection}
              disabled={updating}
              className="flex-1"
            >
              {currentSectionIndex === totalSections - 1 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Training
                </>
              ) : (
                <>
                  Next Section
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
