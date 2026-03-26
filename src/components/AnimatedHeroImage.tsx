import { useEffect, useState } from 'react';
import { removeBackground } from '../lib/backgroundRemover';

const AnimatedHeroImage = () => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [laptopImageUrl, setLaptopImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processLaptopImage = async () => {
      try {
        // Load the original laptop image
        const response = await fetch('/lovable-uploads/4e07bce3-4d2f-4695-9764-40d834c85a30.png');
        const blob = await response.blob();
        
        // Create image element
        const img = new Image();
        img.onload = async () => {
          try {
            // Remove background
            const processedBlob = await removeBackground(img);
            const processedUrl = URL.createObjectURL(processedBlob);
            setLaptopImageUrl(processedUrl);
            setIsProcessing(false);
            
            // Start animation after image is processed
            setTimeout(() => {
              setIsAnimated(true);
            }, 500);
          } catch (error) {
            console.error('Error removing background:', error);
            // Fallback to original image
            setLaptopImageUrl('/lovable-uploads/4e07bce3-4d2f-4695-9764-40d834c85a30.png');
            setIsProcessing(false);
            setTimeout(() => {
              setIsAnimated(true);
            }, 500);
          }
        };
        img.src = URL.createObjectURL(blob);
      } catch (error) {
        console.error('Error loading image:', error);
        // Fallback to original image
        setLaptopImageUrl('/lovable-uploads/4e07bce3-4d2f-4695-9764-40d834c85a30.png');
        setIsProcessing(false);
        setTimeout(() => {
          setIsAnimated(true);
        }, 500);
      }
    };

    processLaptopImage();
  }, []);

  return (
    <div className="relative w-full max-w-none mx-auto mb-16 h-[70vh] lg:h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Loading State */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Processing image...</div>
        </div>
      )}
      
      {/* Laptop Mockup */}
      {laptopImageUrl && (
        <div className="relative scale-150 lg:scale-[2] xl:scale-[2.5]">{/* Much larger scaling */}
          {/* Laptop Image */}
          <img 
            src={laptopImageUrl} 
            alt="Laptop mockup showing financial dashboard"
            className="w-[600px] h-auto drop-shadow-2xl"
          />
          {/* Screen Content Overlay - Solid Background */}
          <div className="absolute top-[6%] left-[12%] w-[76%] h-[66%] bg-background rounded-lg overflow-hidden border">
            {/* Remove the dashboard screenshot, use solid background instead */}
            
            {/* Animated Dashboard Components */}
            {/* Dashboard Header */}
            <div 
              className={`absolute top-[8%] left-[6%] transition-all duration-600 ease-out ${
                isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`} 
              style={{ transitionDelay: '300ms' }}
            >
              <div className="text-primary text-base font-bold">Dashboard</div>
              <div className="text-muted-foreground text-xs">Welcome back, Join Finlo</div>
            </div>
          
            {/* Health Score Card */}
            <div 
              className={`absolute top-[25%] left-[6%] w-[18%] transition-all duration-600 ease-out ${
                isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`} 
              style={{ transitionDelay: '500ms' }}
            >
              <div className="bg-card rounded-lg p-2 border border-border shadow-sm">
                <div className="text-muted-foreground text-[0.6rem] mb-1">Health Score</div>
                <div className="text-foreground text-sm font-bold flex items-center gap-1">100/100</div>
                <div className="text-primary text-[0.55rem]">+6</div>
              </div>
            </div>
          
            {/* Revenue Card */}
            <div 
              className={`absolute top-[25%] left-[26%] w-[18%] transition-all duration-600 ease-out ${
                isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`} 
              style={{ transitionDelay: '700ms' }}
            >
              <div className="bg-card rounded-lg p-2 border border-border shadow-sm">
                <div className="text-muted-foreground text-[0.6rem] mb-1">Revenue</div>
                <div className="text-foreground text-sm font-bold">$2.9M</div>
                <div className="text-primary text-[0.55rem]">+12%</div>
              </div>
            </div>
          
            {/* Profit Card */}
            <div 
              className={`absolute top-[25%] left-[46%] w-[18%] transition-all duration-600 ease-out ${
                isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`} 
              style={{ transitionDelay: '900ms' }}
            >
              <div className="bg-card rounded-lg p-2 border border-border shadow-sm">
                <div className="text-muted-foreground text-[0.6rem] mb-1">Profit</div>
                <div className="text-foreground text-sm font-bold">$2.4M</div>
                <div className="text-primary text-[0.55rem]">+5%</div>
              </div>
            </div>
          
            {/* Cash Flow Card */}
            <div 
              className={`absolute top-[25%] right-[6%] w-[18%] transition-all duration-600 ease-out ${
                isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`} 
              style={{ transitionDelay: '1100ms' }}
            >
              <div className="bg-card rounded-lg p-2 border border-border shadow-sm">
                <div className="text-muted-foreground text-[0.6rem] mb-1">Cash Flow</div>
                <div className="text-foreground text-sm font-bold">$1.8M</div>
                <div className="text-primary text-[0.55rem]">+8%</div>
              </div>
            </div>
          
            {/* Navigation Tabs */}
            <div 
              className={`absolute top-[48%] left-[50%] transform -translate-x-1/2 transition-all duration-600 ease-out ${
                isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`} 
              style={{ transitionDelay: '1300ms' }}
            >
              <div className="flex space-x-2 text-[0.6rem]">
                <span className="text-muted-foreground">Overview</span>
                <span className="text-muted-foreground">AI Hub</span>
                <span className="text-muted-foreground">Model</span>
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-[0.55rem]">Alerts</span>
                <span className="text-muted-foreground">Reports</span>
                <span className="text-muted-foreground">Settings</span>
              </div>
            </div>
          
            {/* Strategic Alerts Section */}
            <div 
              className={`absolute top-[60%] left-[6%] right-[6%] transition-all duration-600 ease-out ${
                isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`} 
              style={{ transitionDelay: '1500ms' }}
            >
              <div className="bg-card rounded-lg p-3 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-foreground font-semibold text-[0.7rem]">Strategic Alerts</h3>
                    <p className="text-muted-foreground text-[0.5rem]">AI-powered alerts for business events</p>
                  </div>
                  <div className="text-muted-foreground text-[0.5rem]">0 unread</div>
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-1">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground text-[0.55rem]">No alerts. Metrics look good!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimatedHeroImage;