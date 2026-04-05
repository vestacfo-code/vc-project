import { useEffect, useRef } from 'react';
import { Upload, Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ScrollSection {
  id: number;
  icon: any;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  color: string;
}

const ScrollAnimatedHowItWorks = () => {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const onScroll = () => {
      const scrollPosition = window.pageYOffset || document.body.scrollTop;
      const sectionHeight = window.innerHeight; // 100vh
      
      // Calculate checkpoints
      const checkPointOne = sectionHeight;
      const checkPointTwo = checkPointOne + sectionHeight;
      const checkPointThree = checkPointTwo + sectionHeight;
      
      const sections = sectionRefs.current;
      
      if (scrollPosition >= 0 && scrollPosition < checkPointOne) {
        // Reset all to normal state
        sections.forEach((section, index) => {
          if (section && index > 0) {
            section.classList.remove('stack-fixed');
            section.style.marginTop = index === 1 ? `${sectionHeight}px` : `${sectionHeight * index}px`;
          }
        });
      } else if (scrollPosition >= checkPointOne && scrollPosition < checkPointTwo) {
        // Fix second section and adjust third
        if (sections[1]) {
          sections[1].classList.add('stack-fixed');
          if (sections[2]) {
            sections[2].style.marginTop = `${checkPointTwo}px`;
          }
        }
        // Remove fixed from others
        if (sections[2]) sections[2].classList.remove('stack-fixed');
        if (sections[3]) sections[3].classList.remove('stack-fixed');
      } else if (scrollPosition >= checkPointTwo && scrollPosition < checkPointThree) {
        // Fix third section and adjust fourth
        if (sections[2]) {
          sections[2].classList.add('stack-fixed');
          if (sections[3]) {
            sections[3].style.marginTop = `${checkPointThree}px`;
          }
        }
        // Remove fixed from fourth
        if (sections[3]) sections[3].classList.remove('stack-fixed');
      } else if (scrollPosition >= checkPointThree) {
        // Fix fourth section
        if (sections[3]) {
          sections[3].classList.add('stack-fixed');
        }
      }
    };

    window.addEventListener('scroll', onScroll, false);
    onScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const sections: ScrollSection[] = [
    {
      id: 1,
      icon: Upload,
      title: "Upload financial document",
      subtitle: "Start with your data",
      description: "Upload your financial documents including PDFs, Excel files, images, and other formats. Our AI will automatically process and extract relevant financial information.",
      features: ["PDF processing", "Excel analysis", "Image recognition", "Multi-format support"],
      color: "from-blue-500 to-purple-600"
    },
    {
      id: 2,
      icon: Brain,
      title: "Generates insights",
      subtitle: "AI-powered analysis",
      description: "Our advanced AI analyzes your financial data to generate meaningful insights, identify trends, and provide actionable recommendations for your business.",
      features: ["AI-powered analysis", "Trend identification", "Custom insights", "Real-time processing"],
      color: "from-purple-600 to-pink-600"
    },
    {
      id: 3,
      icon: TrendingUp,
      title: "See your business health score change",
      subtitle: "Track your progress",
      description: "Watch your business health score update in real-time as new data is processed. Track your financial progress with clear, visual indicators and dashboards.",
      features: ["Real-time updates", "Health scoring", "Visual dashboards", "Progress tracking"],
      color: "from-pink-600 to-red-600"
    },
    {
      id: 4,
      icon: AlertTriangle,
      title: "Look out for strategic alerts",
      subtitle: "Stay informed",
      description: "Receive intelligent alerts about important financial changes, opportunities, and potential risks to help you make informed decisions for your business.",
      features: ["Smart notifications", "Risk detection", "Opportunity alerts", "Actionable insights"],
      color: "from-red-600 to-orange-600"
    }
  ];

  return (
    <>
      {/* Static Header */}
      <div className="text-center py-12 bg-white relative z-50">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          How It Works
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Get started with AI-powered financial insights in four simple steps
        </p>
      </div>

      {/* CSS for fixed positioning */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .stack-fixed {
            position: fixed !important;
            top: 0 !important;
            margin-top: 0px !important;
          }
        `
      }} />
      
      {sections.map((section, index) => (
        <section
          key={section.id}
          ref={(el) => { sectionRefs.current[index] = el; }}
          className={`w-full h-screen ${index === 0 ? 'fixed top-0' : ''}`}
          style={{
            marginTop: index === 1 ? '100vh' : index > 1 ? `${100 * index}vh` : '0',
            zIndex: sections.length - index,
          }}
        >
          <div className="h-full flex items-center justify-center bg-white">
            <div className="container mx-auto px-4 max-w-6xl">
              <Card className="mx-auto border border-vesta-navy/10 bg-white rounded-2xl shadow-lg w-full max-w-5xl h-[400px]">
                <CardContent className="p-6 md:p-8 h-full flex items-center">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center w-full">
                    {/* Left side - Text content */}
                    <div className="space-y-6">
                      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        STEP {section.id}
                      </div>
                      <h3 className="text-3xl lg:text-4xl font-bold leading-tight text-primary">
                        {section.title}
                      </h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {section.description}
                      </p>
                      
                      {/* Features list */}
                      <div className="grid grid-cols-2 gap-3">
                        {section.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Right side - Video placeholder with gradient */}
                    <div className={`bg-gradient-to-br ${section.color} rounded-xl h-64 flex items-center justify-center relative overflow-hidden shadow-lg`}>
                      <div className="text-white text-center z-10">
                        <section.icon className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">Interactive Demo</p>
                        <p className="text-sm opacity-80">Coming Soon</p>
                      </div>
                      <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      ))}
      
      {/* Extra space to ensure last card is visible */}
      <div className="h-screen"></div>
    </>
  );
};

export default ScrollAnimatedHowItWorks;