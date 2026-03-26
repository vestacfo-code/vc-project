import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TrainingCard from './TrainingCard';
import TrainingEditor from './TrainingEditor';
import TrainingFilters from './TrainingFilters';

interface TrainingMaterial {
  id: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  difficulty_level: string;
  estimated_duration: number | null;
  cover_image_url: string | null;
  created_at: string;
  tags: string[];
}

export default function TrainingList() {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<TrainingMaterial | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [searchQuery, materials]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('training_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching training materials:', error);
      toast.error('Failed to load training materials');
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = materials;
    
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredMaterials(filtered);
  };

  const handleEdit = (material: TrainingMaterial) => {
    setEditingMaterial(material);
    setShowEditor(true);
  };

  const handleSaved = () => {
    setShowEditor(false);
    setEditingMaterial(null);
    fetchMaterials();
  };

  if (showEditor) {
    return (
      <TrainingEditor
        material={editingMaterial}
        onSave={handleSaved}
        onCancel={() => {
          setShowEditor(false);
          setEditingMaterial(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center sm:justify-between">
          <CardTitle className="text-base sm:text-lg">Training Materials</CardTitle>
          <Button 
            onClick={() => setShowEditor(true)}
            size="sm"
            className="h-9 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm">Create Training</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search training materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? 'No materials found matching your search' : 'No training materials yet'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((material) => (
                <TrainingCard
                  key={material.id}
                  material={material}
                  onEdit={handleEdit}
                  onDeleted={fetchMaterials}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
