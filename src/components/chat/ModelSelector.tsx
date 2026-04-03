import { useState } from 'react';
import { Check, ChevronDown, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import iconOpenai from '@/assets/icon-openai.png';
import iconWebSearch from '@/assets/icon-web-search.png';

const ModelIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} className="w-4 h-4 opacity-50 brightness-0 invert" />
);

export interface ModelOption {
  id: string;
  displayName: string;
  modelId: string;
  credits: number;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  hideCredits?: boolean;
}

/** IDs are sent to `streaming-chat`; server maps them to OpenAI models (see ALLOWED_MODELS). */
export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'auto',
    displayName: 'Auto',
    modelId: 'gpt-4o-mini',
    credits: 0,
    description: 'GPT-4o mini, or GPT-4o + web when the question looks time-sensitive',
    icon: <Zap className="w-4 h-4" />,
    hideCredits: true,
  },
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    modelId: 'gpt-4o',
    credits: 1,
    description: 'Strong general model (no forced web search)',
    icon: <ModelIcon src={iconOpenai} alt="GPT-4o" />,
  },
  {
    id: 'gpt-4o-search',
    displayName: 'GPT-4o + web',
    modelId: 'gpt-4o',
    credits: 2,
    description: 'Same model with live web search and link citations',
    icon: <ModelIcon src={iconWebSearch} alt="Search" />,
  },
  {
    id: 'o3-mini',
    displayName: 'o3-mini',
    modelId: 'o3-mini',
    credits: 3,
    description: 'Reasoning-focused (OpenAI chat completions)',
    icon: <ModelIcon src={iconOpenai} alt="o3-mini" />,
  },
  {
    id: 'deep-research',
    displayName: 'Deep research',
    modelId: 'o3-deep-research',
    credits: 5,
    description: 'Background web research (o3-deep-research + search tool)',
    badge: 'Slow',
    icon: <ModelIcon src={iconWebSearch} alt="Deep Research" />,
  },
  {
    id: 'gpt-5',
    displayName: 'GPT-5',
    modelId: 'gpt-5',
    credits: 5,
    description: 'Flagship model if your OpenAI key has access (errors otherwise)',
    badge: 'API',
    icon: <Sparkles className="w-4 h-4" />,
  },
];

export const getModelById = (id: string): ModelOption => {
  return MODEL_OPTIONS.find(m => m.id === id) || MODEL_OPTIONS[0];
};

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export const ModelSelector = ({ selectedModel, onModelChange, disabled }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const selected = getModelById(selectedModel);

  const triggerLabel = selected.id === 'auto' ? 'Auto' : selected.displayName;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-slate-600">{triggerLabel}</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl"
      >
        {/* Model list — no header */}
        <div className="py-1">
          {MODEL_OPTIONS.map((model) => {
            const isSelected = model.id === selected.id;
            return (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-1.5 text-left transition-colors",
                  isSelected
                    ? "bg-slate-100"
                    : "hover:bg-slate-50"
                )}
              >
                {/* Check / icon */}
                <div className="w-4 flex items-center justify-center flex-shrink-0">
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <span className="text-slate-600">{model.icon}</span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-[13px] font-medium",
                      isSelected ? 'text-slate-900' : 'text-slate-700'
                    )}>
                      {model.displayName}
                    </span>
                    {model.badge && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-[10px] font-bold uppercase rounded',
                          model.badge === 'Slow'
                            ? 'bg-amber-100 text-amber-900'
                            : model.badge === 'API'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-violet-100 text-violet-900'
                        )}
                      >
                        {model.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {model.description}
                  </p>
                </div>

                {/* Credit cost — hidden for Auto */}
                {!model.hideCredits && (
                  <div className="flex-shrink-0">
                    <span className="text-[11px] font-medium text-slate-500">
                      {model.credits} cr
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
