import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TrainingFiltersProps {
  category: string;
  onCategoryChange: (value: string) => void;
  difficulty: string;
  onDifficultyChange: (value: string) => void;
}

export default function TrainingFilters({
  category,
  onCategoryChange,
  difficulty,
  onDifficultyChange,
}: TrainingFiltersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="category-filter" className="text-sm">Category</Label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger id="category-filter" className="h-9 text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="soft-skills">Soft Skills</SelectItem>
            <SelectItem value="product">Product</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="difficulty-filter" className="text-sm">Difficulty</Label>
        <Select value={difficulty} onValueChange={onDifficultyChange}>
          <SelectTrigger id="difficulty-filter" className="h-9 text-sm">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
