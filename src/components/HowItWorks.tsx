import { Card, CardContent } from '@/components/ui/card';
import { Upload, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      id: 1,
      icon: Upload,
      title: "Upload financial documents",
      description: "Simply drag and drop your financial statements, invoices, or other business documents. Our AI processes multiple formats including PDFs, Excel files, and images.",
      color: "from-primary to-accent",
      bgColor: "from-primary/5 to-accent/5"
    },
    {
      id: 2,
      icon: Brain,
      title: "Generate insights", 
      description: "Our advanced AI analyzes your data to extract key financial metrics, identify trends, and generate actionable business insights tailored to your company.",
      color: "from-accent to-primary",
      bgColor: "from-accent/5 to-primary/5"
    },
    {
      id: 3,
      icon: TrendingUp,
      title: "See your business health score change",
      description: "Watch your business health score update in real-time as new data is processed. Track your financial progress with clear, visual indicators.",
      color: "from-primary via-accent to-primary",
      bgColor: "from-primary/5 via-accent/5 to-primary/5"
    },
    {
      id: 4,
      icon: AlertTriangle,
      title: "Look for strategic alerts that were generated",
      description: "Receive intelligent alerts about potential opportunities, risks, and strategic recommendations based on your financial patterns and industry benchmarks.",
      color: "from-accent to-primary",
      bgColor: "from-accent/5 to-primary/5"
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Check if we're scrolling through the section
      if (rect.top <= 100 && rect.bottom >= windowHeight) {
        // Calculate scroll progress (0 to 1)
        const progress = Math.max(0, Math.min(1, (100 - rect.top) / (rect.height - windowHeight + 100)));
        setScrollProgress(progress);
        
        // Calculate active step
        const stepIndex = Math.min(Math.floor(progress * steps.length), steps.length - 1);
        setActiveStep(Math.max(0, stepIndex));
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [steps.length]);

  const currentStep = steps[activeStep];
  const CurrentIcon = currentStep?.icon;

  // Calculate dynamic styles based on scroll progress
  const headerScale = 1 - (scrollProgress * 0.2);
  const headerOpacity = 1 - (scrollProgress * 0.3);
  const cardRotation = scrollProgress * 2;
  const backgroundOpacity = 0.3 + (scrollProgress * 0.4);

  return (
    <section 
      ref={sectionRef} 
      className="relative overflow-hidden"
      style={{ 
        minHeight: `${steps.length * 120}vh`,
        background: `linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--accent) / 0.05) 50%, hsl(var(--primary) / 0.05) 100%)`
      }}
    >
      {/* Dynamic Background Elements */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: currentStep ? `linear-gradient(45deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))` : `linear-gradient(45deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))`,
          transform: `scale(${1 + scrollProgress * 0.3}) rotate(${scrollProgress * 5}deg)`,
          transition: 'background 0.6s ease-in-out'
        }}
      />
      
      {/* Animated Background Shapes */}
      <div 
        className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: `linear-gradient(135deg, hsl(var(--primary) / ${backgroundOpacity * 0.2}), hsl(var(--accent) / ${backgroundOpacity * 0.1}))`,
          transform: `translate(${scrollProgress * 150}px, ${scrollProgress * 80}px) scale(${1 + scrollProgress * 0.3})`,
          transition: 'background 0.6s ease-in-out'
        }}
      />
      <div 
        className="absolute bottom-20 right-10 w-72 h-72 rounded-full blur-3xl"
        style={{
          background: `linear-gradient(135deg, hsl(var(--accent) / ${backgroundOpacity * 0.2}), hsl(var(--primary) / ${backgroundOpacity * 0.1}))`,
          transform: `translate(${-scrollProgress * 100}px, ${-scrollProgress * 60}px) scale(${1 + scrollProgress * 0.2})`,
          transition: 'background 0.6s ease-in-out'
        }}
      />

      {/* Transforming Sticky Bar */}
      <div 
        className="sticky top-0 backdrop-blur-md border-b shadow-lg z-50 transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, ${0.95 - scrollProgress * 0.05}), rgba(255, 255, 255, ${0.9 - scrollProgress * 0.1}))`,
          borderColor: `hsl(var(--primary) / 0.2)`,
          transform: `scale(${headerScale}) translateY(${scrollProgress * -5}px)`,
          opacity: headerOpacity
        }}
      >
        <div className="container px-4 mx-auto max-w-screen-xl py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Morphing Title + Step */}
            <div className="flex items-center space-x-6">
              <h2 
                className="font-bold text-gray-900 transition-all duration-500"
                style={{
                  fontSize: `${2 - scrollProgress * 0.5}rem`,
                  transform: `skew(${scrollProgress * 5}deg)`
                }}
              >
                How It Works
              </h2>
              
              {/* Animated Step Display */}
              <div 
                className="flex items-center space-x-4 px-6 py-3 rounded-full transition-all duration-500"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  transform: `rotate(${cardRotation}deg) scale(${1 + scrollProgress * 0.1})`
                }}
              >
                <div 
                  className="w-12 h-12 bg-white text-gray-900 rounded-full flex items-center justify-center text-xl font-bold shadow-lg"
                  style={{ transform: `rotate(${-cardRotation}deg)` }}
                >
                  {activeStep + 1}
                </div>
                {CurrentIcon && (
                  <div className="flex items-center space-x-3 text-white">
                    <CurrentIcon 
                      className="w-6 h-6"
                      style={{ transform: `rotate(${-cardRotation}deg)` }}
                    />
                    <span 
                      className="text-lg font-semibold hidden md:block"
                      style={{ transform: `rotate(${-cardRotation}deg)` }}
                    >
                      {currentStep.title}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Morphing Progress */}
            <div className="flex items-center space-x-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: index === activeStep ? '16px' : '12px',
                    height: index === activeStep ? '16px' : '12px',
                    background: index === activeStep 
                      ? `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
                      : index < activeStep 
                      ? 'hsl(var(--success))'
                      : 'hsl(var(--muted-foreground) / 0.3)',
                    transform: `scale(${index === activeStep ? 1 + scrollProgress * 0.3 : 1}) rotate(${scrollProgress * 45}deg)`,
                    boxShadow: index === activeStep ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none'
                  }}
                />
              ))}
              <span 
                className="ml-4 text-sm font-medium transition-all duration-300"
                style={{
                  color: `hsl(var(--muted-foreground))`,
                  transform: `scale(${1 + scrollProgress * 0.1})`
                }}
              >
                {activeStep + 1} / {steps.length}
              </span>
            </div>
          </div>

          {/* Mobile title - transforms too */}
          <div 
            className="md:hidden mt-3 text-center transition-all duration-300"
            style={{ transform: `translateY(${scrollProgress * 10}px)` }}
          >
            <span className="text-lg font-semibold text-gray-900">
              {currentStep?.title}
            </span>
          </div>
        </div>
      </div>

      {/* Transforming Cards */}
      <div className="relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeStep;
          const stepProgress = Math.max(0, Math.min(1, (scrollProgress * steps.length) - index));
          
          return (
            <div
              key={step.id}
              className="min-h-screen flex items-center justify-center py-20"
              style={{
                transform: `perspective(1000px) rotateX(${stepProgress * 5}deg) translateZ(${stepProgress * 20}px)`
              }}
            >
              <div className="container px-4 mx-auto max-w-screen-xl">
                <Card 
                  className="mx-auto border bg-white rounded-3xl shadow-2xl max-w-6xl overflow-hidden transition-all duration-700"
                  style={{
                    opacity: isActive ? 1 : 0.4,
                    transform: `
                      scale(${isActive ? 1 : 0.95}) 
                      rotate(${isActive ? 0 : (index - activeStep) * 3}deg)
                      translateY(${isActive ? 0 : (index - activeStep) * 15}px)
                      translateZ(${isActive ? 0 : -50}px)
                    `,
                    borderColor: isActive ? `hsl(var(--primary) / 0.3)` : `hsl(var(--border))`,
                    boxShadow: isActive 
                      ? `0 25px 50px -12px hsl(var(--primary) / 0.25), 0 0 0 1px hsl(var(--primary) / 0.1)`
                      : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[500px]">
                      {/* Content Side */}
                      <div 
                        className="p-12 lg:p-16 flex flex-col justify-center"
                        style={{
                          transform: `translateX(${isActive ? 0 : -20}px)`,
                          transition: 'transform 0.7s ease-out'
                        }}
                      >
                        <div className="flex items-center mb-8">
                          <div 
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mr-6 transition-all duration-500"
                            style={{
                              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                              transform: isActive ? 'rotate(0deg)' : 'rotate(-5deg)'
                            }}
                          >
                            <Icon className="w-10 h-10 text-white" />
                          </div>
                          <div 
                            className="w-16 h-16 bg-white border-4 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg transition-all duration-500"
                            style={{
                              borderColor: `hsl(var(--primary))`,
                              color: `hsl(var(--primary))`,
                              transform: isActive ? 'scale(1)' : 'scale(0.95)'
                            }}
                          >
                            {step.id}
                          </div>
                        </div>

                        <h3 
                          className="text-4xl lg:text-5xl font-bold mb-8 leading-tight transition-all duration-500"
                          style={{
                            background: isActive ? `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))` : `hsl(var(--foreground))`,
                            backgroundClip: isActive ? 'text' : 'unset',
                            WebkitBackgroundClip: isActive ? 'text' : 'unset',
                            color: isActive ? 'transparent' : `hsl(var(--foreground))`,
                            transform: isActive ? 'translateY(0)' : 'translateY(8px)'
                          }}
                        >
                          {step.title}
                        </h3>
                        <p 
                          className="text-xl leading-relaxed transition-all duration-500"
                          style={{
                            color: `hsl(var(--muted-foreground))`,
                            transform: isActive ? 'translateY(0)' : 'translateY(12px)',
                            opacity: isActive ? 1 : 0.8
                          }}
                        >
                          {step.description}
                        </p>
                      </div>

                      {/* Visual Side */}
                      <div className="relative min-h-[400px] lg:min-h-[500px]">
                        <div 
                          className="absolute inset-0 flex items-center justify-center rounded-r-3xl overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                            transform: isActive ? 'scale(1)' : 'scale(0.98)',
                            transition: 'all 0.7s ease-out'
                          }}
                        >
                          <div className="text-white text-center z-10 p-8">
                            <Icon 
                              className="mx-auto mb-8 opacity-90 transition-all duration-700"
                              style={{
                                width: isActive ? '128px' : '96px',
                                height: isActive ? '128px' : '96px',
                                transform: `rotate(${isActive ? 0 : 15}deg)`
                              }}
                            />
                            <p className="text-3xl font-bold mb-4">Step {step.id}</p>
                            <p className="text-xl opacity-90 mb-2">Interactive Demo</p>
                            <p className="text-lg opacity-70">Coming Soon</p>
                          </div>
                          <div className="absolute inset-0 bg-black/5"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;