import { ReactNode, useState } from 'react';
import { useCredits } from '@/hooks/useCredits';
import { Paywall } from './Paywall';

interface CreditUsageWrapperProps {
  children: ReactNode;
  creditsRequired: number;
  actionName: string;
  onAction: () => void;
  allowFreeMode?: boolean;
  onContinueWithFree?: () => void;
}

export const CreditUsageWrapper = ({
  children,
  creditsRequired,
  actionName,
  onAction,
  allowFreeMode = false,
  onContinueWithFree
}: CreditUsageWrapperProps) => {
  const { useCredits: consumeCredits, canUseCredits } = useCredits();
  const [showPaywall, setShowPaywall] = useState(false);

  const handleAction = async () => {
    // For document analysis actions, bypass credit checks (free analysis)
    if (actionName.toLowerCase().includes('analysis') || actionName.toLowerCase().includes('document')) {
      console.log('Free document analysis - bypassing credit check');
      onAction();
      return;
    }
    
    if (canUseCredits(creditsRequired)) {
      const success = await consumeCredits(creditsRequired, actionName);
      if (success) {
        onAction();
      }
    } else {
      setShowPaywall(true);
    }
  };

  const handleContinueWithFree = () => {
    if (onContinueWithFree) {
      onContinueWithFree();
    }
    setShowPaywall(false);
  };

  return (
    <>
      <div onClick={handleAction}>
        {children}
      </div>
      
      <Paywall
        open={showPaywall}
        onOpenChange={setShowPaywall}
        creditsNeeded={creditsRequired}
        action={actionName}
        allowFreeMode={allowFreeMode}
        onContinueWithFree={allowFreeMode ? handleContinueWithFree : undefined}
      />
    </>
  );
};