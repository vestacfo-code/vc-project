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
    className: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  attention_needed: {
    label: 'Attention Needed',
    className: 'border border-amber-200 bg-amber-50 text-amber-900',
  },
  critical: {
    label: 'Critical',
    className: 'border border-red-200 bg-red-50 text-red-800',
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
    <Card className="h-full border border-vesta-navy/10 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-vesta-navy">
            <Sparkles className="h-4 w-4 text-vesta-gold" />
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
                className="rounded p-1 text-vesta-navy/65 transition-colors hover:bg-vesta-mist/40 hover:text-vesta-navy disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-vesta-navy/65">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4 bg-vesta-mist/50" />
            <Skeleton className="h-4 w-full bg-vesta-mist/50" />
            <Skeleton className="h-4 w-5/6 bg-vesta-mist/50" />
            <Skeleton className="h-4 w-4/5 bg-vesta-mist/50" />
          </div>
        ) : summary ? (
          <div>
            <h3 className="mb-3 text-lg font-semibold leading-snug text-vesta-navy">
              {summary.headline}
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-vesta-navy/80">
              {summary.body}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Moon className="h-8 w-8 text-vesta-navy/80 mb-3" />
            <p className="text-sm font-medium text-vesta-navy/80">No briefing yet today</p>
            <p className="text-xs text-vesta-navy/65 mt-1 mb-4">AI briefing will be generated tonight</p>
            <Button
              onClick={handleGenerateBriefing}
              disabled={isGenerating}
              className="bg-amber-500 hover:bg-amber-400 text-vesta-navy text-xs h-8 px-3"
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
