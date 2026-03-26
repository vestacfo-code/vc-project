import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PostCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
  editPost?: {
    id: string;
    title: string;
    content: string;
    platforms: string[];
    scheduled_date?: string;
    media_urls: string[];
    notes?: string;
  } | null;
}

const PLATFORM_LIMITS = {
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  email: 50000,
};

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-600' },
  { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-600 to-pink-600' },
  { id: 'facebook', name: 'Facebook', color: 'bg-blue-700' },
  { id: 'email', name: 'Email', color: 'bg-emerald-600' },
];

export const PostCreationDialog = ({ open, onOpenChange, onPostCreated, editPost }: PostCreationDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);

  // Load edit data when dialog opens
  useEffect(() => {
    if (editPost && open) {
      setTitle(editPost.title);
      setContent(editPost.content);
      setPlatforms(editPost.platforms);
      setNotes(editPost.notes || '');
      setExistingMediaUrls(editPost.media_urls || []);
      
      if (editPost.scheduled_date) {
        const date = new Date(editPost.scheduled_date);
        setScheduledDate(date);
        setScheduledTime(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
      }
    } else if (!open) {
      resetForm();
    }
  }, [editPost, open]);

  const maxCharLimit = platforms.length > 0
    ? Math.min(...platforms.map((p) => PLATFORM_LIMITS[p as keyof typeof PLATFORM_LIMITS]))
    : 3000;

  const handlePlatformToggle = (platformId: string) => {
    setPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }
    setMediaFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of mediaFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('social-media-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('social-media-assets')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (status: 'draft' | 'scheduled') => {
    if (!title.trim() || !content.trim() || platforms.length === 0) {
      toast.error('Please fill in title, content, and select at least one platform');
      return;
    }

    if (status === 'scheduled' && !scheduledDate) {
      toast.error('Please select a scheduled date');
      return;
    }

    try {
      setLoading(true);

      // Upload new media files
      const newMediaUrls = await uploadMedia();
      const allMediaUrls = [...existingMediaUrls, ...newMediaUrls];

      // Combine date and time for scheduled posts
      let scheduledDateTime = null;
      if (status === 'scheduled' && scheduledDate) {
        const [hours, minutes] = scheduledTime.split(':');
        scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user?.id)
        .single();

      const postData = {
        title,
        content,
        platforms,
        status,
        scheduled_date: scheduledDateTime?.toISOString(),
        media_urls: allMediaUrls,
        hashtags: [],
        notes,
        author_id: user?.id,
        author_name: profile?.full_name || profile?.email || 'Unknown',
      };

      if (editPost) {
        const { error } = await supabase
          .from('social_media_posts')
          .update(postData)
          .eq('id', editPost.id);

        if (error) throw error;
        toast.success('Post updated successfully');
      } else {
        const { error } = await supabase.from('social_media_posts').insert(postData);

        if (error) throw error;
        toast.success(`Post ${status === 'draft' ? 'saved as draft' : 'scheduled'} successfully`);
      }

      resetForm();
      onPostCreated();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPlatforms([]);
    setScheduledDate(undefined);
    setScheduledTime('09:00');
    setNotes('');
    setMediaFiles([]);
    setExistingMediaUrls([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPost ? 'Edit' : 'Create'} Social Media Post</DialogTitle>
          <DialogDescription>
            {editPost ? 'Update your' : 'Create a new'} post to schedule across your social media platforms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (Internal Reference)</Label>
            <Input
              id="title"
              placeholder="Q1 Product Launch Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label>Platforms *</Label>
            <div className="flex flex-wrap gap-3">
              {PLATFORMS.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={platforms.includes(platform.id)}
                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                  />
                  <Label
                    htmlFor={platform.id}
                    className="cursor-pointer font-normal flex items-center gap-2"
                  >
                    <div className={cn('w-3 h-3 rounded-full', platform.color)} />
                    {platform.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Post Content *</Label>
              <span className={cn(
                'text-sm',
                content.length > maxCharLimit ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {content.length} / {maxCharLimit}
              </span>
            </div>
            <Textarea
              id="content"
              placeholder="Write your post content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          {/* Schedule */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !scheduledDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label>Media Files (Max 10)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                id="media-upload"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="media-upload" className="cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop images/videos
                </p>
              </label>
            </div>

            {(existingMediaUrls.length > 0 || mediaFiles.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {existingMediaUrls.map((url, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => setExistingMediaUrls(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {mediaFiles.map((file, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center text-xs p-2 break-all">
                      {file.name}
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any internal notes about this post..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit('scheduled')} disabled={loading}>
            {loading ? (editPost ? 'Updating...' : 'Creating...') : (editPost ? 'Update Post' : 'Schedule Post')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};