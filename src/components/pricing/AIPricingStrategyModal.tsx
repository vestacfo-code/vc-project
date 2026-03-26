import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AIPricingStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (strategy: PricingStrategy) => void;
  initialStrategy?: PricingStrategy;
}

export interface PricingStrategy {
  targetMarginPercent: number;
  competitorStrategy: 'beat-all' | 'beat-lowest' | 'match-average' | 'premium';
  minMarginFloor: number;
  customPrompt: string;
}

export function AIPricingStrategyModal({ open, onOpenChange, onSave, initialStrategy }: AIPricingStrategyModalProps) {
  const { toast } = useToast();
  const [strategy, setStrategy] = useState<PricingStrategy>(() => initialStrategy || {
    targetMarginPercent: 15,
    competitorStrategy: 'beat-lowest',
    minMarginFloor: 10,
    customPrompt: '',
  });

  // Update local state when initialStrategy changes (e.g., loaded from localStorage)
  useEffect(() => {
    if (initialStrategy) {
      setStrategy(initialStrategy);
    }
  }, [initialStrategy]);

  const handleSave = () => {
    onSave?.(strategy);
    toast({
      title: "Strategy Saved",
      description: "AI will now use your pricing strategy for recommendations.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-zinc-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">
            AI Pricing Strategy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <p className="text-sm text-slate-400">
            Configure how the AI should calculate optimal prices based on your business goals.
          </p>

          {/* Target Margin */}
          <div className="space-y-2">
            <Label className="text-white">Target Margin Above COGS (%)</Label>
            <Input
              type="number"
              value={strategy.targetMarginPercent}
              onChange={(e) => setStrategy({ ...strategy, targetMarginPercent: Number(e.target.value) })}
              className="bg-[#1a1a1a] border-zinc-700 text-white focus:border-zinc-500 focus:ring-0"
              placeholder="15"
            />
            <p className="text-xs text-slate-500">
              The ideal profit margin you want to maintain above your cost of goods.
            </p>
          </div>

          {/* Competitor Strategy */}
          <div className="space-y-2">
            <Label className="text-white">Competitor Pricing Strategy</Label>
            <Select
              value={strategy.competitorStrategy}
              onValueChange={(value: PricingStrategy['competitorStrategy']) => 
                setStrategy({ ...strategy, competitorStrategy: value })
              }
            >
              <SelectTrigger className="bg-[#1a1a1a] border-zinc-700 text-white focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-zinc-700">
                <SelectItem value="beat-all" className="text-white focus:bg-white focus:text-black">
                  Beat All Suppliers
                </SelectItem>
                <SelectItem value="beat-lowest" className="text-white focus:bg-white focus:text-black">
                  Beat Lowest Supplier Only
                </SelectItem>
                <SelectItem value="match-average" className="text-white focus:bg-white focus:text-black">
                  Match Market Average
                </SelectItem>
                <SelectItem value="premium" className="text-white focus:bg-white focus:text-black">
                  Premium Positioning (+5% Above Average)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Minimum Margin Floor */}
          <div className="space-y-2">
            <Label className="text-white">Minimum Margin Floor (%)</Label>
            <Input
              type="number"
              value={strategy.minMarginFloor}
              onChange={(e) => setStrategy({ ...strategy, minMarginFloor: Number(e.target.value) })}
              className="bg-[#1a1a1a] border-zinc-700 text-white focus:border-zinc-500 focus:ring-0"
              placeholder="10"
            />
            <p className="text-xs text-slate-500">
              Never recommend a price below this margin, even to beat competitors.
            </p>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label className="text-white">Custom AI Instructions (Optional)</Label>
            <Textarea
              value={strategy.customPrompt}
              onChange={(e) => setStrategy({ ...strategy, customPrompt: e.target.value })}
              className="bg-[#1a1a1a] border-zinc-700 text-white focus:border-zinc-500 focus:ring-0 min-h-[100px] resize-none"
              placeholder="E.g., 'Prioritize volume over margin for clearance items' or 'Always maintain at least $2 profit per unit on fragrances under $20 COGS'"
            />
            <p className="text-xs text-slate-500">
              Add any specific rules or considerations for the AI to follow.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white text-white hover:bg-white hover:text-black bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-white text-black hover:bg-slate-200"
            >
              Save Strategy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
