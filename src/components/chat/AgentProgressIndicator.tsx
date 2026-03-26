import { X, Search, Globe, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AgentStep {
  step: number;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

interface AgentProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  currentLabel: string;
  estimatedSecondsRemaining: number;
  thinkingLog: string[];
  completedSteps: AgentStep[];
  onCancel: () => void;
}

export const AgentProgressIndicator = ({
  currentStep,
  totalSteps,
  currentLabel,
  estimatedSecondsRemaining,
  thinkingLog,
  completedSteps,
  onCancel,
}: AgentProgressIndicatorProps) => {
  // Parse thinking log entries into structured sections
  const searchQueries: string[] = [];
  const sources: { title: string; domain: string }[] = [];
  const thoughts: string[] = [];

  thinkingLog.forEach((entry) => {
    if (entry.startsWith('[SEARCH]')) {
      searchQueries.push(entry.replace('[SEARCH] ', ''));
    } else if (entry.startsWith('[SOURCE]')) {
      const parts = entry.replace('[SOURCE] ', '').split('|');
      sources.push({ title: parts[0] || entry, domain: parts[1] || '' });
    } else {
      thoughts.push(entry);
    }
  });

  return (
    <div className="flex gap-3 md:gap-4">
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-zinc-900">Thinking</span>
          <button
            onClick={onCancel}
            className="text-xs text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Thinking entries */}
        <div className="space-y-2.5 mb-3">
          {thoughts.map((thought, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                i === thoughts.length - 1 ? "bg-cyan-400 animate-pulse" : "bg-emerald-400"
              )} />
              <span className="text-sm text-zinc-600 leading-relaxed">{thought}</span>
            </div>
          ))}
          {/* Current label as live entry */}
          {currentLabel && (
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-cyan-400 animate-pulse" />
              <span className="text-sm text-zinc-600 leading-relaxed">{currentLabel}</span>
            </div>
          )}
        </div>

        {/* Search queries section */}
        {searchQueries.length > 0 && (
          <div className="mb-3">
            <span className="text-xs font-medium text-cyan-600 mb-2 block">Searching</span>
            <div className="flex flex-wrap gap-2">
              {searchQueries.map((query, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 rounded-full text-xs text-zinc-600"
                >
                  <Search className="w-3 h-3 text-zinc-400" />
                  {query}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources section */}
        {sources.length > 0 && (
          <div>
            <span className="text-xs font-medium text-cyan-600 mb-2 block">Reviewing sources</span>
            <div className="bg-zinc-50 rounded-xl border border-zinc-100 divide-y divide-zinc-100 overflow-hidden">
              {sources.map((source, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Globe className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <span className="text-sm text-zinc-700 truncate">{source.title}</span>
                  </div>
                  {source.domain && (
                    <span className="text-xs text-zinc-400 flex-shrink-0">{source.domain}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed steps as subtle footer */}
        {completedSteps.length > 0 && thoughts.length === 0 && searchQueries.length === 0 && (
          <div className="space-y-1.5 mt-2">
            {completedSteps.map((s) => (
              <div key={s.step} className="flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
