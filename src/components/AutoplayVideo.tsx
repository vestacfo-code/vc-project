import { useEffect, useRef, useState } from 'react';

interface AutoplayVideoProps {
  videoId: string;
  className?: string;
}

const AutoplayVideo = ({ videoId, className = "" }: AutoplayVideoProps) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showFinalFrame, setShowFinalFrame] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Reset states when component mounts
    setIsPlaying(true);
    setShowFinalFrame(false);

    // Listen for messages from YouTube iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'video-ended') {
            setIsPlaying(false);
            setShowFinalFrame(true);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* YouTube iframe that autoplays once */}
      <iframe
        ref={iframeRef}
        className="w-full h-full rounded-xl shadow-2xl"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&enablejsapi=1&loop=0&playlist=${videoId}`}
        title="Vesta Demo Video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ 
          opacity: isPlaying ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />
      
      {/* Final frame overlay that shows after video ends */}
      {showFinalFrame && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl shadow-2xl flex items-center justify-center"
          style={{
            opacity: showFinalFrame ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out'
          }}
        >
          <div className="text-center text-foreground">
            <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg"></div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Vesta Logo</h3>
            <p className="text-muted-foreground">AI-Powered Financial Intelligence</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoplayVideo;