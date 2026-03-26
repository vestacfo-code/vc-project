import { useState, useEffect, useRef } from 'react';

interface TypingAnimationProps {
  messages: string[];
  className?: string;
}

const TypingAnimation = ({ messages, className = "" }: TypingAnimationProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize on mount
  useEffect(() => {
    setIsInitialized(true);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isInitialized || messages.length === 0) return;

    const currentMessage = messages[currentMessageIndex];
    
    if (isTyping) {
      // Typing phase
      if (displayedText.length < currentMessage.length) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
        }, 50); // Typing speed
      } else {
        // Finished typing, wait before deleting
        timerRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 2000); // Pause time
      }
    } else {
      // Deleting phase
      if (displayedText.length > 0) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 30); // Deleting speed
      } else {
        // Finished deleting, move to next message
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setIsTyping(true);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [displayedText, isTyping, currentMessageIndex, messages, isInitialized]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default TypingAnimation;