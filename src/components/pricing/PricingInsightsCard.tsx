import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Loader2, TrendingUp, DollarSign, Globe, Sparkles } from 'lucide-react';
import { usePricingResearch, ResearchType } from '@/hooks/usePricingResearch';
import ReactMarkdown from 'react-markdown';

interface PricingInsightsCardProps {
  brands?: string[];
  onAskAI?: (context: string) => void;
}

const researchTypes: { type: ResearchType; label: string; icon: React.ElementType }[] = [
  { type: 'market_overview', label: 'Market', icon: TrendingUp },
  { type: 'competitor_pricing', label: 'Pricing', icon: DollarSign },
  { type: 'forex_impact', label: 'FOREX', icon: Globe },
  { type: 'trend_analysis', label: 'Trends', icon: Sparkles },
];

export function PricingInsightsCard({ brands = [], onAskAI }: PricingInsightsCardProps) {
  const { loading, research, fetchResearch } = usePricingResearch();
  const [activeType, setActiveType] = useState<ResearchType>('market_overview');

  // Auto-fetch on mount
  useEffect(() => {
    fetchResearch('market_overview', { brands, industry: 'fragrance and cosmetics wholesale' });
  }, []);

  const handleRefresh = () => {
    fetchResearch(activeType, { brands, industry: 'fragrance and cosmetics wholesale' });
  };

  const handleTypeChange = (type: ResearchType) => {
    setActiveType(type);
    fetchResearch(type, { brands, industry: 'fragrance and cosmetics wholesale' });
  };

  const handleAskAI = () => {
    if (research?.content && onAskAI) {
      onAskAI(`Market Research Context:\n${research.content}`);
    }
  };

  return (
    <Card className="bg-white border border-zinc-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-zinc-900">Market Intelligence</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Research Type Tabs */}
        <div className="flex gap-1 mt-3">
          {researchTypes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeType === type
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {loading && !research ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-zinc-500">Researching market data...</span>
          </div>
        ) : research?.content ? (
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none text-zinc-700 [&>ul]:space-y-2 [&>ul]:mt-2 [&>p]:text-sm [&>ul>li]:text-sm">
              <ReactMarkdown>{research.content}</ReactMarkdown>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              <span className="text-xs text-zinc-400">
                Updated {new Date(research.generatedAt).toLocaleTimeString()}
              </span>
              {onAskAI && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAskAI}
                  className="text-xs h-7"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Ask AI about this
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click refresh to load market intelligence</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
