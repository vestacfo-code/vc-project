import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

interface Slide {
  id: number;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageSrc: string;
  imageAlt: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "AI Financial Interpreter",
    description: "Upload your financial data and get instant AI insights in plain language. No more confusing spreadsheets or complicated reports - just clear, actionable intelligence about your business performance.",
    buttonText: "Try it Now",
    buttonLink: "/auth",
    imageSrc: "/lovable-uploads/0ee5a6bb-a762-409a-af9d-040b99540913.png",
    imageAlt: "AI Financial Analysis Dashboard"
  },
  {
    id: 2,
    title: "Business Health Score",
    description: "Get a real-time score from 0-100 that shows exactly how healthy your business is. Our AI analyzes cash flow, profitability, growth trends, and more to give you actionable recommendations for improvement.",
    buttonText: "See Demo",
    buttonLink: "/demo",
    imageSrc: "/lovable-uploads/f1bf9901-3f93-484b-bc52-4ebf83ba2413.png",
    imageAlt: "Business Health Dashboard"
  },
  {
    id: 3,
    title: "Strategic Alerts",
    description: "Never miss critical business moments. Get intelligent notifications about cash flow issues, profitability changes, and growth opportunities before they become problems.",
    buttonText: "Get Alerts",
    buttonLink: "/auth",
    imageSrc: "/lovable-uploads/2827fc6a-0ef5-434b-801f-8a11b116f11e.png",
    imageAlt: "Strategic Alerts Dashboard"
  }
];

export const FeatureSlideshow = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    // Set up auto-rotation every 5 seconds
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    // Listen to slide changes
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });

    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-screen-xl 2xl:max-w-screen-2xl">
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 xl:gap-20 items-center min-h-[450px] lg:min-h-[500px] xl:min-h-[550px]">
                  {/* Image Section */}
                  <div className={`relative w-full h-[350px] sm:h-[400px] lg:h-[450px] xl:h-[500px] 2xl:h-[550px] rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-500 ${slide.id === 3 ? 'bg-gradient-radial from-white via-gray-50 to-gray-100 p-6 lg:p-8' : ''}`}>
                    <img 
                      src={slide.imageSrc}
                      alt={slide.imageAlt}
                      className={`w-full h-full ${slide.id === 3 ? 'object-contain' : 'object-cover'} hover:scale-110 transition-transform duration-700`}
                    />
                  </div>
                  
                  {/* Content Section */}
                  <div className="space-y-4 sm:space-y-6 flex flex-col justify-center">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-background">{slide.title}</h3>
                    <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-background/80 leading-relaxed">
                      {slide.description}
                    </p>
                    <div className="pt-4">
                      <Link to={slide.buttonLink}>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="text-lg border-background text-background bg-white hover:bg-background hover:text-white hover:border-background hover:scale-105 transition-all duration-300"
                        >
                          {slide.buttonText}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation Controls */}
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-background text-background" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-background text-background" />
          
          {/* Slide Indicators */}
          <div className="flex justify-center mt-8 space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  current === index 
                    ? 'bg-background' 
                    : 'bg-background/30 hover:bg-background/50'
                }`}
                onClick={() => api?.scrollTo(index)}
              />
            ))}
          </div>
        </Carousel>
      </div>
    </div>
  );
};