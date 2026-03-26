import { Brain } from 'lucide-react';

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="relative z-10">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Intelligent Financial Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered financial analysis tailored to your unique business data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;