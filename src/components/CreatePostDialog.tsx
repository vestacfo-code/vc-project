import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  author_name: string;
  status: 'draft' | 'published';
  tags: string[] | null;
  slug: string;
  featured_image_url: string | null;
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPost?: BlogPost | null;
  onPostCreated: () => void;
}

const CreatePostDialog = ({ open, onOpenChange, editingPost, onPostCreated }: CreatePostDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: editingPost?.title || '',
    content: editingPost?.content || '',
    excerpt: editingPost?.excerpt || '',
    tags: editingPost?.tags || [],
    status: editingPost?.status || 'draft' as 'draft' | 'published',
    featured_image_url: editingPost?.featured_image_url || null
  });
  const [newTag, setNewTag] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, featured_image_url: publicUrl }));
      toast({ title: 'Image uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error uploading image',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, featured_image_url: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const postData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || null,
        author_id: user.id,
        author_name: user.email || 'Admin',
        status: formData.status,
        tags: formData.tags.length > 0 ? formData.tags : null,
        featured_image_url: formData.featured_image_url,
        slug: `${formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`,
        ...(formData.status === 'published' && { published_at: new Date().toISOString() })
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast({ title: 'Blog post updated successfully!' });
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);

        if (error) throw error;
        toast({ title: 'Blog post created successfully!' });
      }

      onPostCreated();
      onOpenChange(false);
      setFormData({ title: '', content: '', excerpt: '', tags: [], status: 'draft', featured_image_url: null });
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast({ 
        title: 'Error saving blog post', 
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter blog post title"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief description of the blog post"
              rows={2}
            />
          </div>
          
          <div>
            <Label>Featured Image (Optional)</Label>
            <div className="mt-2">
              {formData.featured_image_url ? (
                <div className="relative">
                  <img 
                    src={formData.featured_image_url} 
                    alt="Featured image preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Upload a featured image for your blog post
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingImage}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingImage ? 'Uploading...' : 'Choose Image'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your blog post content here..."
              rows={12}
              required
            />
          </div>
          
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <Label>Status</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={formData.status === 'draft' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                variant={formData.status === 'published' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, status: 'published' }))}
              >
                Publish Now
              </Button>
            </div>
          </div>
        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;