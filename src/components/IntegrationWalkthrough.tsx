import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalkthroughStep {
  title: string;
  description: string;
  targetElement: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface IntegrationWalkthroughProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onConnectClick?: () => void;
  startFromStep?: number;
  persistent?: boolean;
}

const steps: WalkthroughStep[] = [
  {
    title: "Welcome to Finlo",
    description: "Let me guide you through connecting your accounting software so I can help analyze your business.",
    targetElement: "",
    position: "bottom"
  },
  {
    title: "Connect Your Accounting",
    description: "Click here to select and connect your accounting platform (QuickBooks, Xero, etc.)",
    targetElement: "[data-walkthrough='integration-dropdown']",
    position: "right"
  },
  {
    title: "Start Chatting!",
    description: "Once connected, you can chat with me about your financial data and get AI-powered insights.",
    targetElement: "[data-walkthrough='chat-input']",
    position: "top"
  }
];

export const IntegrationWalkthrough = ({ isActive, onComplete, onSkip, onConnectClick, startFromStep = 0, persistent = false }: IntegrationWalkthroughProps) => {
  const [currentStep, setCurrentStep] = useState(startFromStep);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  // Note: Dismissal state is now managed by parent component (IntegrationChat)
  // via the isActive prop - no need for sessionStorage check here

  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      if (!step.targetElement) {
        // Center of screen for welcome message
        setPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 200
        });
        setHighlightRect(null);
        return;
      }

      const element = document.querySelector(step.targetElement);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);

      let top = 0;
      let left = 0;

      switch (step.position) {
        case 'right':
          top = rect.top;
          left = rect.right + 20;
          break;
        case 'left':
          top = rect.top;
          left = rect.left - 420;
          break;
        case 'top':
          top = rect.top - 180;
          left = rect.left - 50;
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left - 50;
          break;
      }

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, isActive]);

  if (!isActive) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // For persistent mode, open settings to connect
      if (persistent && onConnectClick) {
        onConnectClick();
      } else {
        onComplete();
      }
    }
  };

  const handleSkipClick = () => {
    // Don't allow skip in persistent mode
    if (!persistent) {
      onSkip();
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={handleSkipClick}
      />

      {/* Highlight */}
      {highlightRect && (
        <div
          className="fixed z-[9999] rounded-lg ring-4 ring-blue-500 ring-offset-4 ring-offset-black/50 pointer-events-none animate-pulse"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[10000] bg-white rounded-xl shadow-2xl p-6 w-[400px] border border-zinc-200"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>
          {!persistent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="h-8 w-8 p-0 -mt-2 -mr-2 hover:bg-zinc-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-blue-500' : 'bg-zinc-200'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {!persistent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-zinc-600 hover:text-zinc-900"
              >
                Skip
              </Button>
            )}
            <Button
              onClick={handleNext}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {currentStep === steps.length - 1 ? (persistent ? 'Connect to Continue' : 'Got it!') : 'Next'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
