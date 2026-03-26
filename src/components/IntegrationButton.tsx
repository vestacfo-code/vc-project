import { Button } from '@/components/ui/button';
import { IntegrationConfig } from '@/config/integrations';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntegrationButtonProps {
  integration: IntegrationConfig;
  onConnect?: () => void;
  disabled?: boolean;
  className?: string;
}

export const IntegrationButton = ({ 
  integration, 
  onConnect, 
  disabled = false,
  className 
}: IntegrationButtonProps) => {
  const isComingSoon = integration.status === 'coming-soon';
  
  return (
    <Button
      onClick={onConnect}
      disabled={disabled || isComingSoon}
      className={cn(
        "w-full h-12 flex items-center justify-center gap-3 font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md",
        integration.colors.primary,
        integration.colors.hover,
        integration.colors.text,
        isComingSoon && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <img 
        src={integration.logo} 
        alt={`${integration.name} logo`}
        className="w-6 h-6 object-contain"
      />
      {isComingSoon ? (
        `${integration.displayName} (Coming Soon)`
      ) : (
        `Connect ${integration.displayName}`
      )}
    </Button>
  );
};