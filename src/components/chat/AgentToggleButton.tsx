import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentToggleButtonProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const AgentToggleButton = ({ isActive, onToggle, disabled }: AgentToggleButtonProps) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
        isActive
          ? "bg-purple-100 text-purple-700 ring-1 ring-purple-300 shadow-sm"
          : "text-vesta-navy-muted hover:text-vesta-navy/80 hover:bg-vesta-mist/40",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={isActive ? "Agent Mode ON (5 credits per task)" : "Enable Agent Mode for deep research"}
    >
      <Sparkles className={cn("w-3.5 h-3.5", isActive && "text-purple-600")} />
      <span>Agent</span>
    </button>
  );
};
