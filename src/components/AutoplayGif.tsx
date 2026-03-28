import { useState } from 'react';

interface AutoplayGifProps {
  gifSrc: string;
  className?: string;
  duration?: number; // Duration prop kept for API consistency
}

const AutoplayGif = ({ gifSrc, className = "" }: AutoplayGifProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* GIF that loops continuously */}
      <img
        src={gifSrc}
        alt="Vesta Demo"
        className="w-full h-full object-cover rounded-xl shadow-2xl"
        onLoad={handleLoad}
        style={{ 
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />
      
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/20 rounded-xl shadow-2xl flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default AutoplayGif;