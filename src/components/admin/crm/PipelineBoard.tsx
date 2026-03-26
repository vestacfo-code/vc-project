import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Deal, DealStage } from '@/types/crm';
import { DealCard } from './DealCard';
import { DealDialog } from './DealDialog';
import { Plus, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: 'prospecting', label: 'Prospecting', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { id: 'qualification', label: 'Qualification', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
];

export const PipelineBoard = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadDeals();

    // Real-time subscription
    const channel = supabase
      .channel('deals-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'crm_deals'
      }, () => {
        loadDeals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: any) => {
    const deal = deals.find(d => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const dealId = active.id as string;
    const newStage = over.id as DealStage;

    try {
      const { error } = await supabase
        .from('crm_deals')
        .update({ 
          stage: newStage,
          actual_close_date: newStage === 'closed_won' || newStage === 'closed_lost' 
            ? new Date().toISOString().split('T')[0] 
            : null
        })
        .eq('id', dealId);

      if (error) throw error;

      // Update local state
      setDeals(deals.map(deal => 
        deal.id === dealId ? { ...deal, stage: newStage } : deal
      ));

      toast.success('Deal stage updated');
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal stage');
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setDealDialogOpen(true);
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const { error } = await supabase
        .from('crm_deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      setDeals(deals.filter(d => d.id !== dealId));
      toast.success('Deal deleted successfully');
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    }
  };

  const getDealsByStage = (stage: DealStage) => {
    return deals.filter(deal => deal.stage === stage);
  };

  const getStageMetrics = (stage: DealStage) => {
    const stageDeals = getDealsByStage(stage);
    const totalValue = stageDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
    const weightedValue = stageDeals.reduce((sum, deal) => sum + (Number(deal.value) * deal.probability / 100), 0);
    
    return {
      count: stageDeals.length,
      totalValue,
      weightedValue
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const totalPipelineValue = deals.reduce((sum, deal) => sum + Number(deal.value), 0);
  const weightedPipelineValue = deals.reduce((sum, deal) => sum + (Number(deal.value) * deal.probability / 100), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pipeline</h2>
            <p className="text-muted-foreground">
              {deals.length} deals · {formatCurrency(totalPipelineValue)} total · {formatCurrency(weightedPipelineValue)} weighted
            </p>
          </div>
          <Button onClick={() => { setEditingDeal(null); setDealDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {STAGES.map((stage) => {
              const stageDeals = getDealsByStage(stage.id);
              const metrics = getStageMetrics(stage.id);

              return (
                <SortableContext
                  key={stage.id}
                  id={stage.id}
                  items={stageDeals.map(d => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                          <Badge variant="secondary">{metrics.count}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(metrics.weightedValue)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 min-h-[400px]">
                      {stageDeals.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No deals in this stage
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </SortableContext>
              );
            })}
          </div>

          <DragOverlay>
            {activeDeal ? (
              <div className="opacity-50">
                <DealCard
                  deal={activeDeal}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <DealDialog
        open={dealDialogOpen}
        onOpenChange={setDealDialogOpen}
        deal={editingDeal}
        onSuccess={loadDeals}
      />
    </>
  );
};
