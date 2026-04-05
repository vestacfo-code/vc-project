import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Brain, TrendingUp, AlertTriangle, BarChart3, PieChart, Target } from 'lucide-react';

interface ScrollSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const AppleStyleScrolling = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const sections: ScrollSection[] = [
    {
      id: 'ai-interpreter',
      title: 'AI Financial Interpreter',
      subtitle: 'Your CFO in seconds',
      description: 'Upload any financial document and get instant AI-powered insights in plain language.',
      icon: <Brain className="w-12 h-12" />,
      color: 'from-blue-500 to-purple-600',
      features: ['Natural language explanations', 'Instant analysis', 'Smart recommendations', 'Document parsing']
    },
    {
      id: 'health-score',
      title: 'Business Health Score',
      subtitle: 'Real-time financial pulse',
      description: 'Get a comprehensive 0-100 score that tracks your business health in real-time.',
      icon: <Target className="w-12 h-12" />,
      color: 'from-green-500 to-emerald-600',
      features: ['Real-time scoring', 'Trend analysis', 'Benchmarking', 'Action items']
    },
    {
      id: 'strategic-alerts',
      title: 'Strategic Alerts',
      subtitle: 'Never miss what matters',
      description: 'Get intelligent notifications about cash flow, profitability, and growth opportunities.',
      icon: <AlertTriangle className="w-12 h-12" />,
      color: 'from-orange-500 to-red-600',
      features: ['Smart notifications', 'Cash flow alerts', 'Growth opportunities', 'Risk management']
    },
    {
      id: 'interactive-model',
      title: 'Interactive Financial Model',
      subtitle: 'Plan your future',
      description: 'Build and modify financial projections with our intuitive modeling tools.',
      icon: <BarChart3 className="w-12 h-12" />,
      color: 'from-cyan-500 to-blue-600',
      features: ['Scenario planning', 'Revenue projections', 'Expense modeling', 'What-if analysis']
    },
    {
      id: 'visual-insights',
      title: 'Visual Insights',
      subtitle: 'See the big picture',
      description: 'Beautiful charts and graphs that make complex financial data easy to understand.',
      icon: <PieChart className="w-12 h-12" />,
      color: 'from-purple-500 to-pink-600',
      features: ['Interactive charts', 'Trend visualization', 'Comparative analysis', 'Export capabilities']
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerTop = container.offsetTop;
      const containerHeight = container.offsetHeight;
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate scroll progress within the container
      const startScroll = containerTop - windowHeight;
      const endScroll = containerTop + containerHeight;
      const progress = Math.max(0, Math.min(1, (scrollTop - startScroll) / (endScroll - startScroll)));

      setScrollProgress(progress);

      // Determine active section based on scroll progress
      const sectionIndex = Math.floor(progress * sections.length);
      setActiveSection(Math.min(sectionIndex, sections.length - 1));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections.length]);

  const currentSection = sections[activeSection];

  return (
    <section ref={containerRef} className="relative min-h-[500vh] bg-vesta-cream">
      {/* Sticky container for the main content */}
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-2">
          {/* Left side - Text content */}
          <div className="space-y-8 text-vesta-navy">
            <div className="space-y-4">
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${currentSection.color} transform transition-all duration-1000 ease-out`}>
                {currentSection.icon}
              </div>
              
              <div className="space-y-2 transform transition-all duration-700 ease-out">
                <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                  {currentSection.title}
                </h2>
                <p className="text-2xl font-medium text-vesta-navy/80">
                  {currentSection.subtitle}
                </p>
              </div>
            </div>

            <p className="max-w-lg text-xl leading-relaxed text-vesta-navy/80">
              {currentSection.description}
            </p>

            <div className="space-y-3">
              {currentSection.features.map((feature, index) => (
                <div 
                  key={feature}
                  className="flex items-center space-x-3 transform transition-all duration-500 ease-out"
                  style={{ 
                    transitionDelay: `${index * 100}ms`,
                    opacity: activeSection === sections.findIndex(s => s.id === currentSection.id) ? 1 : 0,
                    transform: activeSection === sections.findIndex(s => s.id === currentSection.id) ? 'translateX(0)' : 'translateX(-20px)'
                  }}
                >
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentSection.color}`} />
                  <span className="text-vesta-navy/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Visual representation */}
          <div className="relative">
            <div className="relative transform transition-all duration-1000 ease-out hover:scale-105">
              <Card className="border border-vesta-navy/10 bg-white p-8 shadow-xl">
                <div className="space-y-6">
                  {/* Mock interface elements that change based on active section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${currentSection.color}`} />
                      <span className="font-semibold text-vesta-navy">{currentSection.title}</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                  </div>

                  {/* Dynamic content based on section */}
                  <div className="space-y-4">
                    {activeSection === 0 && (
                      <div className="space-y-3">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                        <div className="h-2 w-3/4 rounded-full bg-vesta-mist/50" />
                        <div className="h-2 w-1/2 rounded-full bg-vesta-mist/50" />
                      </div>
                    )}
                    
                    {activeSection === 1 && (
                      <div className="flex items-center justify-center">
                        <div className="relative w-24 h-24">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-vesta-navy/50" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.85)}`} className="text-green-500 transition-all duration-1000" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-vesta-navy">85</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === 2 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 p-2 bg-orange-500/20 rounded">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-vesta-navy">Cash flow alert</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-green-500/20 rounded">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-vesta-navy">Growth opportunity</span>
                        </div>
                      </div>
                    )}

                    {activeSection === 3 && (
                      <div className="space-y-2">
                        {[40, 60, 80, 45, 70].map((height, index) => (
                          <div key={index} className="flex items-end space-x-1">
                            <div className={`bg-gradient-to-t ${currentSection.color} rounded-t`} style={{ height: `${height}px`, width: '20px' }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {activeSection === 4 && (
                      <div className="flex items-center justify-center">
                        <div className="relative w-24 h-24">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-600" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 37.5%)' }} />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600" style={{ clipPath: 'polygon(50% 50%, 100% 37.5%, 100% 100%, 62.5% 100%)' }} />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-600" style={{ clipPath: 'polygon(50% 50%, 62.5% 100%, 0% 100%, 0% 0%)' }} />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600" style={{ clipPath: 'polygon(50% 50%, 0% 0%, 50% 0%)' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce delay-1000" />
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="fixed right-8 top-1/2 z-50 -translate-y-1/2 transform">
        <div className="space-y-2">
          {sections.map((_, index) => (
            <div
              key={index}
              className={`h-8 w-2 rounded-full transition-all duration-300 ${
                index === activeSection ? 'bg-vesta-navy' : 'bg-vesta-mist'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppleStyleScrolling;