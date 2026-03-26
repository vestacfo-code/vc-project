import { useCallback } from 'react';
import { useCredits } from './useCredits';
import { toast } from '@/hooks/use-toast';

export type CreditAction = 'ai_message' | 'integration_sync' | 'document_upload' | 'generate_insights' | 'generate_alerts' | 'ai_pricing_analysis' | 'agent_research';

// Credit costs for different actions - transparent and consistent
export const CREDIT_COSTS = {
  ai_message: 1,            // 1 credit per AI chat message
  integration_sync: 2,      // 2 credits per integration sync
  document_upload: 1,       // 1 credit per document analysis
  generate_insights: 1,     // 1 credit per insight generation
  generate_alerts: 1,       // 1 credit per alert generation
  ai_pricing_analysis: 0.01, // 0.01 credits per product analyzed
  agent_research: 5,        // 5 credits per agent research task
} as const;

interface UseCreditGuardReturn {
  checkAndUseCredits: (action: CreditAction, description?: string, customCreditCost?: number) => Promise<boolean>;
  canUseCredits: (creditsNeeded?: number) => boolean;
  getRemainingCredits: () => number;
  getCreditCost: (action: CreditAction) => number;
}

export const useCreditGuard = (): UseCreditGuardReturn => {
  const { credits, loading, useCredits: useCreditsFn, canUseCredits: canUse } = useCredits();

  const getActionDescription = (action: CreditAction): string => {
    switch (action) {
      case 'ai_message':
        return 'AI chat message';
      case 'integration_sync':
        return 'Integration data sync';
      case 'document_upload':
        return 'Document upload and processing';
      case 'generate_insights':
        return 'Generate insights';
      case 'generate_alerts':
        return 'Generate strategic alerts';
      case 'ai_pricing_analysis':
        return 'AI pricing analysis';
      case 'agent_research':
        return 'Agent research task';
      default:
        return 'Unknown action';
    }
  };

  const getCreditCost = useCallback((action: CreditAction): number => {
    return CREDIT_COSTS[action] || 1;
  }, []);

  const checkAndUseCredits = useCallback(async (action: CreditAction, description?: string, customCreditCost?: number): Promise<boolean> => {
    // If still loading, proceed optimistically - server will validate
    if (loading) {
      return true;
    }
    
    if (!credits) {
      // Only show error if we're done loading and still no credits
      console.warn('[CreditGuard] Credits not loaded after loading complete');
      return true; // Proceed optimistically, server will validate
    }

    // Use the defined credit cost for this action
    const creditsToUse = customCreditCost ?? getCreditCost(action);
    const actionDescription = description || getActionDescription(action);

    // Check for unlimited credits (founder/special accounts) 
    const isUnlimited = credits.current_credits >= 999999;
    const hasEnoughCredits = isUnlimited || credits.current_credits >= creditsToUse;
    
    if (!hasEnoughCredits) {
      // Trigger Settings Modal to open on "plan-credits" tab
      window.dispatchEvent(new CustomEvent('openSettings', { 
        detail: { tab: 'plan-credits' } 
      }));
      
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsToUse} credit to ${actionDescription.toLowerCase()}. You have ${credits.current_credits} credits remaining. The Settings modal will open to upgrade your plan or purchase add-ons.`,
        variant: "destructive",
      });
      return false;
    }

    // Use the credits
    const success = await useCreditsFn(creditsToUse, action, actionDescription);
    
    if (!success) {
      toast({
        title: "Credit Usage Failed",
        description: `Failed to deduct credits for ${actionDescription.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [credits, loading, useCreditsFn, getCreditCost]);

  const canUseCredits = useCallback((creditsNeeded: number = 1): boolean => {
    // If still loading credits, assume user can proceed (optimistic)
    // The server will reject if they truly have no credits
    if (loading || !credits) return true;
    // Check for unlimited credits (founder/special accounts)
    const isUnlimited = credits.current_credits >= 999999;
    return isUnlimited || credits.current_credits >= creditsNeeded;
  }, [credits, loading]);

  const getRemainingCredits = useCallback((): number => {
    return credits?.current_credits || 0;
  }, [credits]);

  return {
    checkAndUseCredits,
    canUseCredits,
    getRemainingCredits,
    getCreditCost
  };
};