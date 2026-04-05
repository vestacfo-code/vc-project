import { SocialMediaPost } from '../ContentCalendarSection';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Hash, Image } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: SocialMediaPost;
  onClick: () => void;
}

const STATUS_COLORS = {
  draft: 'bg-vesta-navy-muted/15',
  scheduled: 'bg-yellow-500',
  published: 'bg-green-500',
  failed: 'bg-red-500',
};

const PLATFORM_ICONS = {
  linkedin: '🔗',
  instagram: '📷',
  facebook: '👥',
};

export const PostCard = ({ post, onClick }: PostCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3 px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-2 text-sm sm:text-base">{post.title}</h3>
          <Badge
            variant="secondary"
            className={cn('capitalize text-xs', STATUS_COLORS[post.status])}
          >
            {post.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-3 sm:px-6 pb-4 sm:pb-6">
        {/* Content Preview */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
          {post.content}
        </p>

        {/* Platforms */}
        <div className="flex gap-1">
          {post.platforms.map((platform) => (
            <span key={platform} className="text-base sm:text-lg" title={platform}>
              {PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]}
            </span>
          ))}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-muted-foreground">
          {post.scheduled_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">{format(parseISO(post.scheduled_date), 'MMM d, h:mm a')}</span>
              <span className="sm:hidden">{format(parseISO(post.scheduled_date), 'MMM d')}</span>
            </div>
          )}
          {post.hashtags.length > 0 && (
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {post.hashtags.length}
            </div>
          )}
          {post.media_urls.length > 0 && (
            <div className="flex items-center gap-1">
              <Image className="h-3 w-3" />
              {post.media_urls.length}
            </div>
          )}
          {post.notes && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Notes</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};