import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { CustomQuestion } from '@/types/customQuestions';

export type { CustomQuestion };

interface CustomQuestionBuilderProps {
  questions: CustomQuestion[];
  onChange: (questions: CustomQuestion[]) => void;
}

export const CustomQuestionBuilder: React.FC<CustomQuestionBuilderProps> = ({ questions, onChange }) => {
  const [editingQuestion, setEditingQuestion] = useState<CustomQuestion | null>(null);

  const addQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: `q_${Date.now()}`,
      type: 'text',
      label: '',
      required: false,
      placeholder: ''
    };
    setEditingQuestion(newQuestion);
  };

  const saveQuestion = () => {
    if (!editingQuestion || !editingQuestion.label.trim()) return;

    const existingIndex = questions.findIndex(q => q.id === editingQuestion.id);
    if (existingIndex >= 0) {
      const updated = [...questions];
      updated[existingIndex] = editingQuestion;
      onChange(updated);
    } else {
      onChange([...questions, editingQuestion]);
    }
    setEditingQuestion(null);
  };

  const deleteQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  const updateEditingQuestion = (field: keyof CustomQuestion, value: any) => {
    if (!editingQuestion) return;
    setEditingQuestion({ ...editingQuestion, [field]: value });
  };

  const addOption = () => {
    if (!editingQuestion) return;
    const options = editingQuestion.options || [];
    updateEditingQuestion('options', [...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    if (!editingQuestion) return;
    const options = [...(editingQuestion.options || [])];
    options[index] = value;
    updateEditingQuestion('options', options);
  };

  const removeOption = (index: number) => {
    if (!editingQuestion) return;
    const options = editingQuestion.options?.filter((_, i) => i !== index) || [];
    updateEditingQuestion('options', options);
  };

  const needsOptions = editingQuestion?.type === 'select' || editingQuestion?.type === 'radio';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Custom Application Questions</h3>
        <Button onClick={addQuestion} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Existing Questions */}
      <div className="space-y-2">
        {questions.map((question) => (
          <Card key={question.id} className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{question.label}</span>
                    {question.required && (
                      <span className="text-xs text-destructive">*</span>
                    )}
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                      {question.type}
                    </span>
                  </div>
                  {question.placeholder && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Placeholder: {question.placeholder}
                    </p>
                  )}
                  {question.options && question.options.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Options: {question.options.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingQuestion(question)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Question Editor Dialog */}
      {editingQuestion && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>
              {questions.find(q => q.id === editingQuestion.id) ? 'Edit Question' : 'Add New Question'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="questionLabel">Question Label *</Label>
                <Input
                  id="questionLabel"
                  value={editingQuestion.label}
                  onChange={(e) => updateEditingQuestion('label', e.target.value)}
                  placeholder="e.g., Years of Experience"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="questionType">Question Type</Label>
                <Select
                  value={editingQuestion.type}
                  onValueChange={(value) => updateEditingQuestion('type', value)}
                >
                  <SelectTrigger id="questionType" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Short Text</SelectItem>
                    <SelectItem value="textarea">Long Text</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="radio">Radio Buttons</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="questionPlaceholder">Placeholder Text (Optional)</Label>
              <Input
                id="questionPlaceholder"
                value={editingQuestion.placeholder || ''}
                onChange={(e) => updateEditingQuestion('placeholder', e.target.value)}
                placeholder="Hint text for the applicant"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="questionRequired"
                checked={editingQuestion.required}
                onCheckedChange={(checked) => updateEditingQuestion('required', checked)}
              />
              <Label htmlFor="questionRequired">Required Question</Label>
            </div>

            {/* Options for select/radio */}
            {needsOptions && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Answer Options</Label>
                  <Button onClick={addOption} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {(editingQuestion.options || []).map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={saveQuestion} disabled={!editingQuestion.label.trim()}>
                Save Question
              </Button>
              <Button onClick={() => setEditingQuestion(null)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
