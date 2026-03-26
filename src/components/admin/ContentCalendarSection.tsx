import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, List, Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { PostCreationDialog } from './content-calendar/PostCreationDialog';
import { CalendarGrid } from './content-calendar/CalendarGrid';
import { PostCard } from './content-calendar/PostCard';
import { PostDetailsSheet } from './content-calendar/PostDetailsSheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SocialMediaPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_date?: string;
  media_urls: string[];
  hashtags: string[];
  author_id: string;
  author_name: string;
  published_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ContentCalendarSectionProps {
  hasPermission?: (permission: string) => boolean;
  isSuperAdmin?: boolean;
  userRoles?: string[];
}

export const ContentCalendarSection = ({ 
  hasPermission = () => false,
  isSuperAdmin = false,
  userRoles = []
}: ContentCalendarSectionProps = {}) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .order('scheduled_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setPosts((data || []) as SocialMediaPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
    setIsCreateDialogOpen(false);
    setEditingPost(null);
  };

  const handleEditPost = (post: SocialMediaPost) => {
    setEditingPost(post);
    setIsCreateDialogOpen(true);
  };

  const handlePostClick = (post: SocialMediaPost) => {
    setSelectedPost(post);
    setIsDetailsOpen(true);
  };

  const handlePostUpdated = () => {
    fetchPosts();
  };

  const handlePostDeleted = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('social_media_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Post deleted successfully');
      fetchPosts();
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform =
      platformFilter === 'all' || post.platforms.includes(platformFilter);
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Content Calendar</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage social media posts across LinkedIn, Instagram, and Facebook
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px] sm:w-[150px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Toggle */}
      <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <CalendarGrid posts={filteredPosts} onPostClick={handlePostClick} />
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first social media post to get started
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => handlePostClick(post)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PostCreationDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingPost(null);
        }}
        onPostCreated={handlePostCreated}
        editPost={editingPost}
      />

      <PostDetailsSheet
        post={selectedPost}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
        onEditPost={handleEditPost}
      />
    </div>
  );
};