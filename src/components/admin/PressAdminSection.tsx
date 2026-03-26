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
import { Megaphone, Edit, Trash2, Plus } from 'lucide-react';

interface PressRelease {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  author_name: string;
  author_id: string;
  featured_image_url?: string;
  press_contact?: string;
  release_date?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  slug: string;
}

interface PressAdminSectionProps {
  hasPermission?: (permission: string) => boolean;
  isSuperAdmin?: boolean;
  userRoles?: string[];
}

export const PressAdminSection = ({ 
  hasPermission = () => false,
  isSuperAdmin = false,
  userRoles = []
}: PressAdminSectionProps = {}) => {
  const { toast } = useToast();
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [editingRelease, setEditingRelease] = useState<PressRelease | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRelease, setNewRelease] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    author_name: 'Admin',
    featured_image_url: '',
    press_contact: '',
    release_date: ''
  });

  useEffect(() => {
    loadReleases();
  }, []);

  const loadReleases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('press_releases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReleases(data || []);
    } catch (error) {
      console.error('Error loading press releases:', error);
      toast({
        title: "Error",
        description: "Failed to load press releases",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRelease = async () => {
    try {
      const releaseData = {
        ...newRelease,
        author_id: '00000000-0000-0000-0000-000000000000', // Use placeholder ID for admin
        release_date: newRelease.release_date || null,
        slug: newRelease.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') // Generate slug from title
      };

      if (editingRelease) {
        const { error } = await supabase
          .from('press_releases')
          .update(releaseData)
          .eq('id', editingRelease.id);

        if (error) throw error;

        setReleases(prev =>
          prev.map(release =>
            release.id === editingRelease.id ? { ...release, ...releaseData } : release
          )
        );

        toast({
          title: "Release Updated",
          description: "Press release has been updated successfully",
        });
      } else {
        const { data, error } = await supabase
          .from('press_releases')
          .insert(releaseData)
          .select()
          .single();

        if (error) throw error;

        setReleases(prev => [data, ...prev]);

        toast({
          title: "Release Created",
          description: "New press release has been created successfully",
        });
      }

      setShowReleaseDialog(false);
      setEditingRelease(null);
      setNewRelease({
        title: '',
        content: '',
        excerpt: '',
        status: 'draft',
        author_name: 'Admin',
        featured_image_url: '',
        press_contact: '',
        release_date: ''
      });
    } catch (error) {
      console.error('Error saving press release:', error);
      toast({
        title: "Error",
        description: "Failed to save press release",
        variant: "destructive"
      });
    }
  };

  const deleteRelease = async (id: string) => {
    try {
      const { error } = await supabase
        .from('press_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReleases(prev => prev.filter(release => release.id !== id));

      toast({
        title: "Release Deleted",
        description: "Press release has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting press release:', error);
      toast({
        title: "Error",
        description: "Failed to delete press release",
        variant: "destructive"
      });
    }
  };

  const openReleaseDialog = (release?: PressRelease) => {
    if (release) {
      setEditingRelease(release);
      setNewRelease({
        title: release.title,
        content: release.content,
        excerpt: release.excerpt,
        status: release.status,
        author_name: release.author_name,
        featured_image_url: release.featured_image_url || '',
        press_contact: release.press_contact || '',
        release_date: release.release_date || ''
      });
    } else {
      setEditingRelease(null);
      setNewRelease({
        title: '',
        content: '',
        excerpt: '',
        status: 'draft',
        author_name: 'Admin',
        featured_image_url: '',
        press_contact: '',
        release_date: ''
      });
    }
    setShowReleaseDialog(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'published': return 'default';
      default: return 'secondary';
    }
  };

  const filteredReleases = releases.filter(release =>
    release.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    release.author_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg min-w-0">
            <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">Press Releases ({releases.length})</span>
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search releases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm text-sm"
            />
            <Button 
              onClick={() => openReleaseDialog()}
              className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-sm h-9 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Release
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="text-sm sm:text-lg text-muted-foreground">Loading...</div>
            </div>
          ) : filteredReleases.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {releases.length === 0 ? "No press releases yet" : "No releases match your search"}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[150px]">Title</TableHead>
                    <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[100px] hidden md:table-cell">Author</TableHead>
                    <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[80px]">Status</TableHead>
                    <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[100px] hidden lg:table-cell">Release Date</TableHead>
                    <TableHead className="text-foreground font-medium text-xs sm:text-sm min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReleases.map((release) => (
                    <TableRow key={release.id} className="border-border">
                      <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                        <div className="truncate max-w-[150px]">{release.title}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                        <div className="truncate max-w-[100px]">{release.author_name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(release.status)} className="capitalize text-[10px] sm:text-xs">
                          {release.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">
                        {release.release_date ? new Date(release.release_date).toLocaleDateString() : 'Not set'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReleaseDialog(release)}
                            className="border-border text-foreground hover:bg-muted rounded-xl h-8 w-8 p-0"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteRelease(release.id)}
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

      <Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingRelease ? 'Edit Press Release' : 'Create New Press Release'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-foreground">Title</Label>
                <Input
                  id="title"
                  value={newRelease.title}
                  onChange={(e) => setNewRelease(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter release title"
                />
              </div>
              <div>
                <Label htmlFor="author" className="text-foreground">Author</Label>
                <Input
                  id="author"
                  value={newRelease.author_name}
                  onChange={(e) => setNewRelease(prev => ({ ...prev, author_name: e.target.value }))}
                  placeholder="Author name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt" className="text-foreground">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={newRelease.excerpt}
                onChange={(e) => setNewRelease(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description of the press release"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-foreground">Content</Label>
              <Textarea
                id="content"
                value={newRelease.content}
                onChange={(e) => setNewRelease(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Full press release content"
                rows={10}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="featured_image" className="text-foreground">Featured Image URL</Label>
                <Input
                  id="featured_image"
                  value={newRelease.featured_image_url}
                  onChange={(e) => setNewRelease(prev => ({ ...prev, featured_image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="press_contact" className="text-foreground">Press Contact</Label>
                <Input
                  id="press_contact"
                  value={newRelease.press_contact}
                  onChange={(e) => setNewRelease(prev => ({ ...prev, press_contact: e.target.value }))}
                  placeholder="press@company.com"
                />
              </div>
              <div>
                <Label htmlFor="release_date" className="text-foreground">Release Date</Label>
                <Input
                  id="release_date"
                  type="date"
                  value={newRelease.release_date}
                  onChange={(e) => setNewRelease(prev => ({ ...prev, release_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-foreground">Status</Label>
              <Select 
                value={newRelease.status} 
                onValueChange={(value) => setNewRelease(prev => ({ ...prev, status: value }))}
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
              <Button onClick={saveRelease} className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl">
                {editingRelease ? 'Update Release' : 'Create Release'}
              </Button>
              <Button variant="outline" onClick={() => setShowReleaseDialog(false)} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};