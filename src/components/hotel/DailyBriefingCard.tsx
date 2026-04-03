import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles, Moon, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface DailyBriefingCardProps {
  hotelId: string;
}

type SummaryStatus = 'on_track' | 'attention_needed' | 'critical';

interface AiSummary {
  id: string;
  hotel_id: string;
  date: string;
  period_type: string;
  headline: string;
  body: string;
  status: SummaryStatus;
  generated_at: string;
}

const STATUS_CONFIG: Record<SummaryStatus, { label: string; className: string }> = {
  on_track: {
    label: 'On Track',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  attention_needed: {
    label: 'Attention Needed',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

const DailyBriefingCard: React.FC<DailyBriefingCardProps> = ({ hotelId }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['ai_summary', hotelId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_summaries')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('date', today)
        .eq('period_type', 'daily')
        .maybeSingle();

      if (error) throw error;
      return data as AiSummary | null;
    },
    enabled: !!hotelId,
  });

  const handleGenerateBriefing = async () => {
    setIsGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-hotel-briefing', {
        body: { hotel_id: hotelId },
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['ai_summary', hotelId, today] });
    } catch (err) {
      toast({
        title: 'Failed to generate briefing',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-slate-900/50 border border-slate-700/80 backdrop-blur-sm h-full shadow-lg shadow-black/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#C8963E]" />
            AI Daily Briefing
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isLoading && summary && (
              <Badge
                className={`text-xs border ${STATUS_CONFIG[summary.status as SummaryStatus]?.className ?? ''}`}
              >
                {STATUS_CONFIG[summary.status as SummaryStatus]?.label ?? summary.status}
              </Badge>
            )}
            {!isLoading && summary && (
              <button
                onClick={handleGenerateBriefing}
                disabled={isGenerating}
                aria-label="Refresh briefing"
                className="text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors p-1 rounded"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4 bg-slate-700" />
            <Skeleton className="h-4 w-full bg-slate-700" />
            <Skeleton className="h-4 w-5/6 bg-slate-700" />
            <Skeleton className="h-4 w-4/5 bg-slate-700" />
          </div>
        ) : summary ? (
          <div>
            <h3 className="text-lg font-semibold text-white leading-snug mb-3">
              {summary.headline}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {summary.body}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Moon className="h-8 w-8 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400 font-medium">No briefing yet today</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">AI briefing will be generated tonight</p>
            <Button
              onClick={handleGenerateBriefing}
              disabled={isGenerating}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs h-8 px-3"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Generate Briefing
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyBriefingCard;
