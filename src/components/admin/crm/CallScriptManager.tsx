import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CallScript } from '@/types/crm';
import { Plus, Edit, Trash2, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CallScriptManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CallScriptManager = ({ open, onOpenChange }: CallScriptManagerProps) => {
  const [scripts, setScripts] = useState<CallScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingScript, setEditingScript] = useState<CallScript | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    script_content: '',
    tags: '',
    is_active: true
  });

  useEffect(() => {
    if (open) {
      loadScripts();
    }
  }, [open]);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_call_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error('Error loading scripts:', error);
      toast.error('Failed to load call scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (script: CallScript) => {
    setEditingScript(script);
    setFormData({
      name: script.name,
      description: script.description || '',
      script_content: script.script_content,
      tags: script.tags?.join(', ') || '',
      is_active: script.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (scriptId: string) => {
    if (!confirm('Are you sure you want to delete this script?')) return;

    try {
      const { error } = await supabase
        .from('crm_call_scripts')
        .delete()
        .eq('id', scriptId);

      if (error) throw error;

      toast.success('Script deleted successfully');
      loadScripts();
    } catch (error) {
      console.error('Error deleting script:', error);
      toast.error('Failed to delete script');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const scriptData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      if (editingScript) {
        const { error } = await supabase
          .from('crm_call_scripts')
          .update(scriptData)
          .eq('id', editingScript.id);

        if (error) throw error;
        toast.success('Script updated successfully');
      } else {
        const { error } = await supabase
          .from('crm_call_scripts')
          .insert(scriptData);

        if (error) throw error;
        toast.success('Script created successfully');
      }

      setShowForm(false);
      setEditingScript(null);
      setFormData({
        name: '',
        description: '',
        script_content: '',
        tags: '',
        is_active: true
      });
      loadScripts();
    } catch (error) {
      console.error('Error saving script:', error);
      toast.error('Failed to save script');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Call Scripts Manager</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!showForm ? (
            <div className="space-y-4">
              <Button onClick={() => setShowForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New Script
              </Button>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : scripts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No call scripts yet. Create your first one!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {scripts.map((script) => (
                    <Card key={script.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{script.name}</CardTitle>
                              {!script.is_active && (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </div>
                            {script.description && (
                              <CardDescription>{script.description}</CardDescription>
                            )}
                            {script.tags && script.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {script.tags.map((tag, idx) => (
                                  <Badge key={idx} variant="secondary">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(script)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(script.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{script.script_content}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Script Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cold Call - Initial Contact"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of when to use this script"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="script_content">Script Content *</Label>
                <Textarea
                  id="script_content"
                  value={formData.script_content}
                  onChange={(e) => setFormData({ ...formData, script_content: e.target.value })}
                  placeholder="Hi [First Name], this is [Your Name] from..."
                  rows={12}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="cold-call, follow-up, enterprise"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingScript(null);
                    setFormData({
                      name: '',
                      description: '',
                      script_content: '',
                      tags: '',
                      is_active: true
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingScript ? 'Update Script' : 'Create Script'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
