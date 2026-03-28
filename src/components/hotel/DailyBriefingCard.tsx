import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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

  return (
    <Card className="bg-gray-800/50 border border-gray-700 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            AI Daily Briefing
          </CardTitle>
          {!isLoading && summary && (
            <Badge
              className={`text-xs border ${STATUS_CONFIG[summary.status as SummaryStatus]?.className ?? ''}`}
            >
              {STATUS_CONFIG[summary.status as SummaryStatus]?.label ?? summary.status}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4 bg-gray-700" />
            <Skeleton className="h-4 w-full bg-gray-700" />
            <Skeleton className="h-4 w-5/6 bg-gray-700" />
            <Skeleton className="h-4 w-4/5 bg-gray-700" />
          </div>
        ) : summary ? (
          <div>
            <h3 className="text-lg font-semibold text-white leading-snug mb-3">
              {summary.headline}
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {summary.body}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Moon className="h-8 w-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400 font-medium">No briefing yet today</p>
            <p className="text-xs text-gray-500 mt-1">AI briefing will be generated tonight</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyBriefingCard;
