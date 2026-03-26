import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface PortalAnimationContextType {
  isActive: boolean;
  userName: string;
  startAnimation: (name: string) => void;
  endAnimation: () => void;
}

const PortalAnimationContext = createContext<PortalAnimationContextType | undefined>(undefined);

// Safety net: max 15 seconds for animation to complete
const MAX_ANIMATION_DURATION = 15000;

export const PortalAnimationProvider = ({ children }: { children: ReactNode }) => {
  const [isActive, setIsActive] = useState(false);
  const [userName, setUserName] = useState('');
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const endAnimation = () => {
    // Clear safety timeout if it exists
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    setIsActive(false);
    setUserName('');
  };

  const startAnimation = (name: string) => {
    // Clear any existing safety timeout
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
    }
    
    setUserName(name);
    setIsActive(true);
    
    // Safety net: force end animation after max duration
    safetyTimeoutRef.current = setTimeout(() => {
      console.warn('Portal animation safety timeout triggered - forcing end');
      endAnimation();
    }, MAX_ANIMATION_DURATION);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <PortalAnimationContext.Provider value={{ isActive, userName, startAnimation, endAnimation }}>
      {children}
    </PortalAnimationContext.Provider>
  );
};

export const usePortalAnimation = () => {
  const context = useContext(PortalAnimationContext);
  if (context === undefined) {
    throw new Error('usePortalAnimation must be used within PortalAnimationProvider');
  }
  return context;
};
