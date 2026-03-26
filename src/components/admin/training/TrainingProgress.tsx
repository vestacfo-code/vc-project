import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TrainingProgressProps {
  percentage: number;
  className?: string;
}

export default function TrainingProgress({ percentage, className }: TrainingProgressProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Progress</span>
        <span>{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
