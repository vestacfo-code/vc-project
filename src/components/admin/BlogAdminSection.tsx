import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Edit, Trash2, Plus } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  author_name: string;
  author_id: string;
  featured_image_url?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at?: string;
  slug: string;
}

interface BlogAdminSectionProps {
  hasPermission?: (permission: string) => boolean;
  isSuperAdmin?: boolean;
  userRoles?: string[];
}

export const BlogAdminSection = ({ 
  hasPermission = () => false,
  isSuperAdmin = false,
  userRoles = []
}: BlogAdminSectionProps = {}) => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    author_name: 'Admin',
    featured_image_url: '',
    tags: ''
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePost = async () => {
    try {
      const postData = {
        ...newPost,
        tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        author_id: '00000000-0000-0000-0000-000000000000', // Use placeholder ID for admin
        slug: newPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') // Generate slug from title
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;

        setPosts(prev =>
          prev.map(post =>
            post.id === editingPost.id ? { ...post, ...postData } : post
          )
        );

        toast({
          title: "Post Updated",
          description: "Blog post has been updated successfully",
        });
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(postData)
          .select()
          .single();

        if (error) throw error;

        setPosts(prev => [data, ...prev]);

        toast({
          title: "Post Created",
          description: "New blog post has been created successfully",
        });
      }

      setShowPostDialog(false);
      setEditingPost(null);
      setNewPost({
        title: '',
        content: '',
        excerpt: '',
        status: 'draft',
        author_name: 'Admin',
        featured_image_url: '',
        tags: ''
      });
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast({
        title: "Error",
        description: "Failed to save blog post",
        variant: "destructive"
      });
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPosts(prev => prev.filter(post => post.id !== id));

      toast({
        title: "Post Deleted",
        description: "Blog post has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive"
      });
    }
  };

  const openPostDialog = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setNewPost({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        status: post.status,
        author_name: post.author_name,
        featured_image_url: post.featured_image_url || '',
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : ''
      });
    } else {
      setEditingPost(null);
      setNewPost({
        title: '',
        content: '',
        excerpt: '',
        status: 'draft',
        author_name: 'Admin',
        featured_image_url: '',
        tags: ''
      });
    }
    setShowPostDialog(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'published': return 'default';
      default: return 'secondary';
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg min-w-0">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">Blog Posts ({posts.length})</span>
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm text-sm"
            />
            <Button 
              onClick={() => openPostDialog()}
              className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-sm h-9 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Post
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="text-sm sm:text-lg text-muted-foreground">Loading...</div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {posts.length === 0 ? "No blog posts yet" : "No posts match your search"}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[150px]">Title</TableHead>
                    <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[100px] hidden md:table-cell">Author</TableHead>
                    <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[80px]">Status</TableHead>
                    <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[80px] hidden lg:table-cell">Created</TableHead>
                    <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id} className="border-border">
                      <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                        <div className="truncate max-w-[150px]">{post.title}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                        <div className="truncate max-w-[100px]">{post.author_name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(post.status)} className="capitalize text-[10px] sm:text-xs">
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                        {new Date(post.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPostDialog(post)}
                            className="border-border text-foreground hover:bg-muted rounded-xl h-8 w-8 p-0"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deletePost(post.id)}
                            className="border-border text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-foreground">Title</Label>
                <Input
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title"
                />
              </div>
              <div>
                <Label htmlFor="author" className="text-foreground">Author</Label>
                <Input
                  id="author"
                  value={newPost.author_name}
                  onChange={(e) => setNewPost(prev => ({ ...prev, author_name: e.target.value }))}
                  placeholder="Author name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt" className="text-foreground">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={newPost.excerpt}
                onChange={(e) => setNewPost(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description of the post"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-foreground">Content</Label>
              <Textarea
                id="content"
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Full post content (Markdown supported)"
                rows={10}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="featured_image" className="text-foreground">Featured Image URL</Label>
                <Input
                  id="featured_image"
                  value={newPost.featured_image_url}
                  onChange={(e) => setNewPost(prev => ({ ...prev, featured_image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="tags" className="text-foreground">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={newPost.tags}
                  onChange={(e) => setNewPost(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="technology, ai, finance"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-foreground">Status</Label>
              <Select 
                value={newPost.status} 
                onValueChange={(value) => setNewPost(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={savePost} className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl">
                {editingPost ? 'Update Post' : 'Create Post'}
              </Button>
              <Button variant="outline" onClick={() => setShowPostDialog(false)} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};