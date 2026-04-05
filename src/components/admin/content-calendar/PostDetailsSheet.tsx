import { SocialMediaPost } from '../ContentCalendarSection';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Hash, Image as ImageIcon, FileText, Trash2, Edit, ExternalLink, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface PostDetailsSheetProps {
  post: SocialMediaPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdated: () => void;
  onPostDeleted: (postId: string) => void;
  onEditPost: (post: SocialMediaPost) => void;
}

const STATUS_COLORS = {
  draft: 'bg-vesta-navy-muted/15',
  scheduled: 'bg-yellow-500',
  published: 'bg-green-500',
  failed: 'bg-red-500',
};

const PLATFORM_COLORS = {
  linkedin: 'bg-blue-600',
  instagram: 'bg-gradient-to-r from-purple-600 to-pink-600',
  facebook: 'bg-blue-700',
};

const PLATFORM_NAMES = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

export const PostDetailsSheet = ({
  post,
  open,
  onOpenChange,
  onPostUpdated,
  onPostDeleted,
  onEditPost,
}: PostDetailsSheetProps) => {
  if (!post) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SheetTitle className="text-2xl">{post.title}</SheetTitle>
              <SheetDescription>
                Created by {post.author_name} on {format(parseISO(post.created_at), 'MMM d, yyyy')}
              </SheetDescription>
            </div>
            <Badge
              variant="secondary"
              className={cn('capitalize', STATUS_COLORS[post.status])}
            >
              {post.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Platforms */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Platforms
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.platforms.map((platform) => (
                <Badge
                  key={platform}
                  variant="outline"
                  className={cn('capitalize', PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS])}
                >
                  {PLATFORM_NAMES[platform as keyof typeof PLATFORM_NAMES]}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Scheduled Date */}
          {post.scheduled_date && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Scheduled For
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(post.scheduled_date), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Content */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Post Content
            </h3>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-sm">{post.content}</p>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {post.content.length} characters
            </div>
          </div>

          <Separator />

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Hashtags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Media */}
          {post.media_urls.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Media ({post.media_urls.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {post.media_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-video rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23999" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E';
                        }}
                      />
                    </a>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          {post.notes && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Internal Notes
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {post.notes}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Published Date */}
          {post.published_at && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2">Published</h3>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(post.published_at), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
              <Separator />
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-6 border-t">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              onEditPost(post);
              onOpenChange(false);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Post
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{post.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onPostDeleted(post.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
};