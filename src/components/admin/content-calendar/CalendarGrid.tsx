import { useState } from 'react';
import { SocialMediaPost } from '../ContentCalendarSection';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  posts: SocialMediaPost[];
  onPostClick: (post: SocialMediaPost) => void;
}

const PLATFORM_COLORS = {
  linkedin: 'border-l-blue-600',
  instagram: 'border-l-pink-600',
  facebook: 'border-l-blue-700',
};

export const CalendarGrid = ({ posts, onPostClick }: CalendarGridProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get first day of the week (Sunday = 0)
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
  
  // Get last day of the week
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()));

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getPostsForDate = (date: Date) => {
    return posts.filter((post) => {
      if (!post.scheduled_date) return false;
      return isSameDay(parseISO(post.scheduled_date), date);
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-xl sm:text-2xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium border-r last:border-r-0"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayPosts = getPostsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b last:border-r-0',
                  !isCurrentMonth && 'bg-muted/30',
                  index % 7 === 0 && 'border-l-0'
                )}
              >
                <div
                  className={cn(
                    'text-xs sm:text-sm font-medium mb-1 sm:mb-2',
                    isCurrentDay && 'bg-primary text-primary-foreground w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center',
                    !isCurrentMonth && 'text-muted-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>

                {/* Posts for this day */}
                <div className="space-y-1">
                  {dayPosts.slice(0, 2).map((post) => {
                    const platformColor = post.platforms[0] 
                      ? PLATFORM_COLORS[post.platforms[0] as keyof typeof PLATFORM_COLORS]
                      : 'border-l-gray-400';

                    return (
                      <button
                        key={post.id}
                        onClick={() => onPostClick(post)}
                        className={cn(
                          'w-full text-left text-[10px] sm:text-xs p-1 sm:p-1.5 rounded bg-card hover:bg-accent transition-colors border-l-2 sm:border-l-4',
                          platformColor
                        )}
                      >
                        <div className="font-medium truncate">{post.title}</div>
                        <div className="text-muted-foreground text-[9px] sm:text-[10px] hidden sm:block">
                          {format(parseISO(post.scheduled_date!), 'h:mm a')}
                        </div>
                      </button>
                    );
                  })}
                  {dayPosts.length > 2 && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground text-center py-0.5 sm:py-1">
                      +{dayPosts.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};