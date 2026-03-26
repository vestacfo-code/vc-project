import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Upload, X, Save, ArrowLeft, Check, ChevronsUpDown, Clipboard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ContentBlockEditor, { type ContentBlock, type TrainingSection } from './ContentBlockEditor';

interface TrainingMaterial {
  id: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  difficulty_level: string;
  estimated_duration: number | null;
  cover_image_url: string | null;
  tags: string[];
}

interface TrainingEditorProps {
  material?: TrainingMaterial | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function TrainingEditor({ material, onSave, onCancel }: TrainingEditorProps) {
  const [title, setTitle] = useState(material?.title || '');
  const [description, setDescription] = useState(material?.description || '');
  const [sections, setSections] = useState<TrainingSection[]>(() => {
    if (!material?.content) return [{ id: crypto.randomUUID(), title: 'Section 1', blocks: [] }];
    try {
      const parsed = JSON.parse(material.content);
      // Check if it's new format (sections) or old format (blocks array)
      if (parsed.sections && Array.isArray(parsed.sections)) {
        return parsed.sections;
      } else if (Array.isArray(parsed)) {
        // Legacy format: wrap blocks in a single section
        return [{ id: crypto.randomUUID(), title: 'Training Content', blocks: parsed }];
      }
      return [{ id: crypto.randomUUID(), title: 'Section 1', blocks: [] }];
    } catch {
      return [{ id: crypto.randomUUID(), title: 'Section 1', blocks: [] }];
    }
  });
  const [category, setCategory] = useState(material?.category || '');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(material?.difficulty_level || 'beginner');
  const [duration, setDuration] = useState(material?.estimated_duration?.toString() || '');
  const [coverImage, setCoverImage] = useState(material?.cover_image_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverPasteAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('training_materials')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      const uniqueCategories = Array.from(new Set(data?.map(item => item.category).filter(Boolean))) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('training-materials')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('training-materials')
        .getPublicUrl(filePath);

      console.log('Cover image uploaded:', data.publicUrl);
      setCoverImage(data.publicUrl);
      toast.success('Cover image uploaded successfully');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover image');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleImageUpload(file);
          toast.success('Cover image pasted from clipboard');
        }
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!category.trim()) {
      toast.error('Category is required');
      return;
    }

    const hasContent = sections.some(section => 
      section.blocks.length > 0 && section.blocks.some(block => block.content.trim() !== '')
    );

    if (!hasContent) {
      toast.error('Please add at least one section with content');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const trainingData = {
        title: title.trim(),
        description: description.trim() || null,
        content: JSON.stringify({ sections }),
        category: category.trim(),
        difficulty_level: difficulty,
        estimated_duration: duration ? parseInt(duration) : null,
        cover_image_url: coverImage || null,
        tags: [],
      };

      if (material?.id) {
        const { error } = await supabase
          .from('training_materials')
          .update(trainingData)
          .eq('id', material.id);

        if (error) throw error;
        toast.success('Training material updated');
      } else {
        const { error } = await supabase
          .from('training_materials')
          .insert({ ...trainingData, created_by: user.id });

        if (error) throw error;
        toast.success('Training material created');
      }

      onSave();
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error('Failed to save training material');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base sm:text-lg">
            {material ? 'Edit Training Material' : 'Create Training Material'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cover-image" className="text-sm">Cover Image</Label>
          {coverImage ? (
            <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden bg-muted">
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={() => setCoverImage('')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-9 text-sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Cover Image'}
                </Button>
              </div>
              <div
                ref={coverPasteAreaRef}
                onPaste={handleCoverPaste}
                className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                tabIndex={0}
              >
                <Clipboard className="h-4 w-4 mx-auto mb-1" />
                <p>Or paste cover image from clipboard (Ctrl+V)</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Training title"
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            rows={2}
            className="text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm">Category *</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className="w-full h-9 justify-between text-sm"
                >
                  {category || "Select or create category..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search or type new category..." 
                    value={category}
                    onValueChange={setCategory}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && category.trim()) {
                        e.preventDefault();
                        setCategoryOpen(false);
                      }
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>
                      Press enter to create "{category}"
                    </CommandEmpty>
                    {categories.length > 0 && (
                      <CommandGroup>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat}
                            value={cat}
                            onSelect={(currentValue) => {
                              setCategory(currentValue);
                              setCategoryOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                category === cat ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cat}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty" className="text-sm">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm">Duration (min)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Content Sections *</Label>
          <ContentBlockEditor
            blocks={[]}
            onChange={() => {}}
            sections={sections}
            onSectionsChange={setSections}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="h-9 text-sm">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="h-9 text-sm">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Training'}
        </Button>
      </CardFooter>
    </Card>
  );
}
