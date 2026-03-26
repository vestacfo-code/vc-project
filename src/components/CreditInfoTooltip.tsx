import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const CreditInfoTooltip = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">How Credits Work</p>
            <div className="text-sm space-y-1">
              <p>• 1 credit when AI returns a message</p>
              <p>• 1 credit when uploading a document</p>
              <p>• 1 credit when generating insights or alerts</p>
              <p>• AI chat may stop mid-conversation if credits run out</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Credits reset monthly based on your plan
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};