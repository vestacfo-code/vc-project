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

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'auto',
    displayName: 'Best',
    modelId: 'gpt-4o-mini',
    credits: 0,
    description: 'Picks the best model for you',
    icon: <Zap className="w-4 h-4" />,
    hideCredits: true,
  },
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    modelId: 'gpt-4o',
    credits: 1,
    description: 'Stronger reasoning',
    icon: <ModelIcon src={iconOpenai} alt="GPT-4o" />,
  },
  {
    id: 'gpt-4o-search',
    displayName: 'GPT-4o Search',
    modelId: 'gpt-4o-search-preview',
    credits: 2,
    description: 'Real-time internet research',
    icon: <ModelIcon src={iconWebSearch} alt="Search" />,
  },
  {
    id: 'o3-mini',
    displayName: 'o3-mini',
    modelId: 'o3-mini',
    credits: 3,
    description: 'Advanced reasoning',
    icon: <ModelIcon src={iconOpenai} alt="o3-mini" />,
  },
  {
    id: 'deep-research',
    displayName: 'Deep Research',
    modelId: 'o3-deep-research',
    credits: 5,
    description: 'Multi-step web research with citations',
    badge: 'New',
    icon: <ModelIcon src={iconWebSearch} alt="Deep Research" />,
  },
  {
    id: 'gpt-5',
    displayName: 'GPT-5',
    modelId: 'gpt-5',
    credits: 5,
    description: 'Most capable model',
    badge: 'Max',
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

  // Show model name when not "Best", otherwise show "Model"
  const triggerLabel = selected.id === 'auto' ? 'Model' : selected.displayName;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
            "text-zinc-400 hover:text-zinc-200 hover:bg-white/10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="text-zinc-400">{triggerLabel}</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-64 p-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden"
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
                    ? "bg-white/5"
                    : "hover:bg-white/5"
                )}
              >
                {/* Check / icon */}
                <div className="w-4 flex items-center justify-center flex-shrink-0">
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <span className="text-zinc-600">{model.icon}</span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-[13px] font-medium",
                      isSelected ? "text-white" : "text-zinc-300"
                    )}>
                      {model.displayName}
                    </span>
                    {model.badge && (
                      <span className={cn(
                        "px-1.5 py-0.5 text-[10px] font-bold uppercase rounded",
                        model.badge === 'New'
                          ? "bg-green-500/20 text-green-400"
                          : "bg-purple-500/20 text-purple-400"
                      )}>
                        {model.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {model.description}
                  </p>
                </div>

                {/* Credit cost — hidden for Best */}
                {!model.hideCredits && (
                  <div className="flex-shrink-0">
                    <span className="text-[11px] font-medium text-zinc-500">
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
