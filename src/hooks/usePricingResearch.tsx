import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ResearchType = 'market_overview' | 'competitor_pricing' | 'forex_impact' | 'trend_analysis' | 'brand_analysis';

interface ResearchContext {
  brands?: string[];
  products?: string[];
  industry?: string;
  region?: string;
}

interface ResearchResult {
  success: boolean;
  researchType: ResearchType;
  content: string;
  generatedAt: string;
}

export function usePricingResearch() {
  const [loading, setLoading] = useState(false);
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchResearch = async (researchType: ResearchType, context?: ResearchContext) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('pricing-research', {
        body: { researchType, context }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setResearch(data);
        return data;
      } else {
        throw new Error(data?.error || 'Failed to generate research');
      }
    } catch (err: any) {
      const message = err.message || 'Failed to fetch market research';
      setError(message);
      toast({
        title: 'Research Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearResearch = () => {
    setResearch(null);
    setError(null);
  };

  return {
    loading,
    research,
    error,
    fetchResearch,
    clearResearch,
  };
}
