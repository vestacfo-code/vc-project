import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { LiveRevenueCounter } from '@/components/LiveRevenueCounter';
import { FeatureSlideshow } from '@/components/FeatureSlideshow';
import HowItWorks from '@/components/HowItWorks';

const HeroSection = () => {
  const { user } = useAuth();
  
  // Scroll animation hooks for different sections
  const testimonialsAnimation = useScrollAnimation();

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* Hero Section - Full screen height */}
      <div className="relative overflow-hidden bg-background min-h-screen flex items-center">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-screen-xl 2xl:max-w-screen-2xl w-full">
          <div className="text-center max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto animate-fade-in flex flex-col justify-center min-h-screen py-8 sm:py-12">
            {/* Main Hero Content */}
            <div className="flex flex-col justify-center space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 animate-fade-in">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight leading-tight animate-fade-in px-4 sm:px-2" style={{animationDelay: '0.2s'}}>
                Understand Your Business Like a{' '}
                <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
                  CFO
                </span>
                . Instantly.
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl xl:text-2xl text-muted-foreground leading-relaxed max-w-3xl xl:max-w-4xl mx-auto animate-fade-in px-6 sm:px-4" style={{animationDelay: '0.4s'}}>
                AI-powered insights from your financial data — no spreadsheets, no confusion. 
                Get plain-language explanations and strategic recommendations to grow your business.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center animate-fade-in px-6 sm:px-4" style={{animationDelay: '0.6s'}}>
                {user ? (
                  <Link to="/dashboard" className="w-full sm:w-auto max-w-xs">
                    <Button variant="hero" size="xl" className="w-full sm:w-auto text-base sm:text-lg px-8 py-4 hover:scale-105 transition-all duration-300">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth" className="w-full sm:w-auto max-w-xs">
                    <Button variant="hero" size="xl" className="w-full sm:w-auto text-base sm:text-lg px-8 py-4 hover:scale-105 transition-all duration-300">
                      Get Started Free
                    </Button>
                  </Link>
                )}
                <Button 
                  onClick={scrollToDemo}
                  variant="outline" 
                  size="xl" 
                  className="w-full sm:w-auto max-w-xs text-base sm:text-lg group hover:scale-105 transition-all duration-300"
                >
                  <Play className="w-4 sm:w-5 h-4 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch How It Works
                </Button>
              </div>

              {/* Company Logos */}
              <div className="pt-4 sm:pt-6 animate-fade-in px-6 sm:px-4" style={{animationDelay: '0.8s'}}>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 text-center">
                  Product developed with insights from career professionals from
                </p>
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 opacity-60">
                  <img src="/lovable-uploads/79981afc-f1b1-4a6a-a934-a0dabc0da486.png" alt="Microsoft" className="h-6 sm:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                  <img src="/lovable-uploads/9de50e5c-99f0-4af0-b8c5-5017e8f55b81.png" alt="Shopify" className="h-6 sm:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                  <img src="/lovable-uploads/e290e908-be67-4cbe-9868-4f80344da464.png" alt="Dell" className="h-6 sm:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                  <img src="/lovable-uploads/ae68ed6f-3531-4fb1-aeb5-9d30f5f4ece1.png" alt="Shopify" className="h-6 sm:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                  <img src="/lovable-uploads/a39e4092-f613-482c-95df-8278d5219deb.png" alt="McKinsey" className="h-6 sm:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Slideshow - Right after hero */}
      <div className="relative z-40">
        <FeatureSlideshow />
      </div>

      {/* How It Works - Between FeatureSlideshow and Demo */}
      {/* <HowItWorks /> */}

      {/* Interactive Demo Section - After How It Works */}
      <div id="demo" className="bg-white py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-screen-xl 2xl:max-w-screen-2xl">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 px-4">See Finlo in Action</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4">Experience how easy it is to get AI-powered financial insights</p>
          </div>
          
          <div className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-0">
            <div className="relative w-full" style={{paddingBottom: '56.25%'}}>
              <iframe 
                src="https://app.supademo.com/embed/cmdxmjrs47w659f96uw19trb8?embed_v=2&utm_source=embed" 
                loading="lazy" 
                title="joinfinlo.ai" 
                allow="clipboard-write" 
                allowFullScreen 
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-xl border border-gray-200"
                style={{border: 'none'}}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Wall */}
      <div id="testimonials" className="bg-white py-12 sm:py-16 md:py-20 lg:py-24" ref={testimonialsAnimation.ref}>
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-screen-xl 2xl:max-w-screen-2xl">
          <div className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${testimonialsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 px-4">Built for Scale. Trusted by the Best.</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4">Real results from real businesses</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl xl:max-w-7xl 2xl:max-w-none mx-auto">
            {/* Card 1 - Soft Blue */}
            <div className={`bg-blue-50 border border-blue-100 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 ${testimonialsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: testimonialsAnimation.isVisible ? '100ms' : '0ms'}}>
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 rounded-xl p-3 min-w-12 h-12 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TF</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">"Finlo is incredibly useful for automatically turning our own financial data into powerful sources of business insights. We're really excited to be working with them."</p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Sarah Kim</p>
                      <p className="text-xs text-gray-500">CFO of TechForward</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 - Soft Green */}
            <div className={`bg-emerald-50 border border-emerald-100 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 ${testimonialsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: testimonialsAnimation.isVisible ? '200ms' : '0ms'}}>
              <div className="flex items-start space-x-4">
                <div className="bg-emerald-500 rounded-xl p-3 min-w-12 h-12 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RC</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">"Every time I show a business owner the Finlo dashboard, I get one of 3 responses: a) awesome, b) amazing, or c) love it! It's been years since I've heard executives get this excited about a tool."</p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Mike Johnson</p>
                      <p className="text-xs text-gray-500">Business Advisor, RevCorp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 - Soft Purple */}
            <div className={`bg-purple-50 border border-purple-100 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 ${testimonialsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: testimonialsAnimation.isVisible ? '300ms' : '0ms'}}>
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500 rounded-xl p-3 min-w-12 h-12 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GS</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">"We did a Finlo trial after trying 3-4 other vendors, and our team immediately fell in love with it. They said the insights were the best they'd seen."</p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Lisa Chen</p>
                      <p className="text-xs text-gray-500">Finance Manager, GrowthScale</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4 - Soft Teal */}
            <div className={`bg-teal-50 border border-teal-100 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 ${testimonialsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: testimonialsAnimation.isVisible ? '400ms' : '0ms'}}>
              <div className="flex items-start space-x-4">
                <div className="bg-teal-500 rounded-xl p-3 min-w-12 h-12 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DB</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">"We use Finlo on a daily and hourly basis. Every financial report is analyzed by Finlo to pull insights that drive our business forward. It summarizes everything without our team having to spend hours interpreting the data."</p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">David Rodriguez</p>
                      <p className="text-xs text-gray-500">VP of Finance, DataBridge</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5 - Soft Orange */}
            <div className={`bg-orange-50 border border-orange-100 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 ${testimonialsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: testimonialsAnimation.isVisible ? '500ms' : '0ms'}}>
              <div className="flex items-start space-x-4">
                <div className="bg-orange-500 rounded-xl p-3 min-w-12 h-12 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">WR</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">"We chose Finlo because of their investment in harnessing the power of AI to make financial reporting less repetitive. Saved us countless hours and improved accuracy significantly."</p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Emma Martinez</p>
                      <p className="text-xs text-gray-500">Controller, Wealth & Rivers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 6 - Soft Indigo */}
            <div className={`bg-indigo-50 border border-indigo-100 rounded-2xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 ${testimonialsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay: testimonialsAnimation.isVisible ? '600ms' : '0ms'}}>
              <div className="flex items-start space-x-4">
                <div className="bg-indigo-500 rounded-xl p-3 min-w-12 h-12 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">QP</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">"Finlo gives us an order of magnitude better data insights than we've ever had before. We're making financial decisions with clarity and speed that we never thought possible."</p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">James Wilson</p>
                      <p className="text-xs text-gray-500">CEO, Quantum Partners</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Revenue Counter Section */}
      <LiveRevenueCounter />

      {/* Get Started Guide Link */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-8 text-center max-w-screen-xl 2xl:max-w-screen-2xl">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-10 border border-white/10 max-w-2xl xl:max-w-3xl mx-auto">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 px-2">Need Help Getting Started?</h3>
          <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-4 sm:mb-6 px-2">
            Follow our step-by-step guide with screenshots to create your account and start your financial transformation journey.
          </p>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/how-to-get-started'}
            className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 w-full sm:w-auto"
          >
            View Step-by-Step Guide
          </Button>
        </div>
      </div>

      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" />
    </section>
  );
};

export default HeroSection;