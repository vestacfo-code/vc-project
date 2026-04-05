import { useState, useEffect, useRef } from 'react';

interface SignInPortalAnimationProps {
  userName: string;
  onComplete: () => void;
  isActive: boolean;
}

// Simple typewriter that deletes then types new text
const BackspaceTypewriter = ({ 
  initialText, 
  newText, 
  onComplete 
}: { 
  initialText: string; 
  newText: string; 
  onComplete: () => void;
}) => {
  const [displayText, setDisplayText] = useState(initialText);
  const [phase, setPhase] = useState<'deleting' | 'paused' | 'typing' | 'complete'>('deleting');
  const [showCursor, setShowCursor] = useState(true);
  const onCompleteRef = useRef(onComplete);
  const hasCompleted = useRef(false);
  
  // Keep ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Cursor blinking effect
  useEffect(() => {
    if (phase === 'complete') {
      setShowCursor(false);
      return;
    }
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorTimer);
  }, [phase]);

  // Handle typing animation phases (deleting, paused, typing)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (phase === 'deleting') {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(prev => prev.slice(0, -1));
        }, 40);
      } else {
        setPhase('paused');
      }
    } else if (phase === 'paused') {
      timer = setTimeout(() => {
        setPhase('typing');
      }, 300);
    } else if (phase === 'typing') {
      if (displayText.length < newText.length) {
        timer = setTimeout(() => {
          setDisplayText(newText.slice(0, displayText.length + 1));
        }, 70);
      } else {
        // Just transition to complete - timer is handled separately
        setPhase('complete');
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, phase, newText]);

  // SEPARATE useEffect for completion - prevents timer cancellation bug
  useEffect(() => {
    if (phase === 'complete' && !hasCompleted.current) {
      hasCompleted.current = true;
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  return (
    <span className="font-serif text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal leading-tight">
      {displayText}
      <span 
        className="ml-1 inline-block w-[3px] h-[1em] bg-white/80 align-middle"
        style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s' }}
      />
    </span>
  );
};

export const SignInPortalAnimation = ({ 
  userName, 
  onComplete, 
  isActive 
}: SignInPortalAnimationProps) => {
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const hasCalledComplete = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const personalizedGreeting = `Welcome back, ${userName}.`;

  const handleTypingComplete = () => {
    // Prevent multiple calls
    if (hasCalledComplete.current) return;
    hasCalledComplete.current = true;
    
    // Start fade out
    setOpacity(0);
    
    // Navigate after fade completes
    setTimeout(() => {
      onCompleteRef.current();
    }, 600);
  };

  // Start typewriter after portal appears
  useEffect(() => {
    if (isActive) {
      hasCalledComplete.current = false;
      setOpacity(1);
      const timer = setTimeout(() => {
        setShowTypewriter(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Reset state when deactivated
      setShowTypewriter(false);
      setOpacity(1);
      hasCalledComplete.current = false;
    }
  }, [isActive]);

  // CRITICAL: Return null immediately when not active
  // This must be checked on EVERY render
  if (!isActive) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-gradient-to-b from-vesta-navy-muted to-vesta-navy"
      style={{
        opacity: opacity,
        transition: 'opacity 500ms ease-out',
        // Ensure it's removed from interaction when fading
        pointerEvents: opacity === 0 ? 'none' : 'auto',
      }}
    >
      {/* Decorative lines - top right */}
      <svg className="absolute top-0 right-0 w-[700px] h-[700px] z-0" viewBox="0 0 700 700" fill="none">
        <path d="M700 0 Q500 200 700 400" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
        <path d="M700 80 Q550 280 700 480" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
        <path d="M700 160 Q600 360 700 560" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
      </svg>
      
      {/* Decorative lines - bottom left */}
      <svg className="absolute bottom-0 left-0 w-[600px] h-[600px] z-0" viewBox="0 0 600 600" fill="none">
        <path d="M0 600 Q200 400 0 200" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
        <path d="M0 520 Q150 320 0 120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      </svg>
      
      {/* Centered greeting - z-10 */}
      <div className="absolute inset-0 flex items-center justify-center px-8 z-10">
        <div className="text-center">
          {showTypewriter ? (
            <BackspaceTypewriter 
              initialText="Good to see you."
              newText={personalizedGreeting}
              onComplete={handleTypingComplete}
            />
          ) : (
            <span className="font-serif text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal leading-tight">
              Good to see you.
              <span className="ml-1 inline-block w-[3px] h-[1em] bg-white/80 align-middle animate-pulse" />
            </span>
          )}
        </div>
      </div>

      {/* Grain overlay ABOVE the text (z-20) so text blends into blue */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ opacity: 0.35 }}>
        <defs>
          <filter id="portalGrain1">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="5" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.5" />
              <feFuncG type="linear" slope="1.5" />
              <feFuncB type="linear" slope="1.5" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#portalGrain1)" />
      </svg>
      
      {/* Secondary grain overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ opacity: 0.25, mixBlendMode: 'multiply' }}>
        <defs>
          <filter id="portalGrain2">
            <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="4" stitchTiles="stitch" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#portalGrain2)" />
      </svg>
    </div>
  );
};

export default SignInPortalAnimation;
