import { useState, useEffect } from 'react';
import { TrendingUp, Calculator, DollarSign, BarChart3, PieChart } from 'lucide-react';
import { FinloBrand } from '@/components/ui/finlo-brand';
import quickbooksLogo from '@/assets/quickbooks-logo.png';

interface ThinkingAnimationProps {
  userQuery: string;
}

const ThinkingAnimation = ({ userQuery }: ThinkingAnimationProps) => {
  const [visibleSearches, setVisibleSearches] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  
  // Generate contextual thinking based on user query
  const getContextualThinking = (query: string): { thought: string; searches: string[]; icon: any } => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('revenue') || lowerQuery.includes('sales') || lowerQuery.includes('income')) {
      return {
        thought: "Analyzing revenue patterns and sales performance across your business",
        icon: TrendingUp,
        searches: [
          "monthly revenue trends analysis",
          "customer acquisition patterns", 
          "seasonal sales variations",
          "product line performance metrics",
          "average transaction values"
        ]
      };
    } else if (lowerQuery.includes('cash flow') || lowerQuery.includes('cashflow')) {
      return {
        thought: "Examining cash flow patterns to identify liquidity trends and risks",
        icon: DollarSign,
        searches: [
          "accounts receivable aging analysis",
          "payment timing patterns",
          "operating cash flow trends",
          "working capital requirements",
          "cash conversion cycles"
        ]
      };
    } else if (lowerQuery.includes('expense') || lowerQuery.includes('cost') || lowerQuery.includes('spending')) {
      return {
        thought: "Breaking down expense categories to find optimization opportunities",
        icon: PieChart,
        searches: [
          "expense category breakdown",
          "cost per acquisition trends",
          "operational efficiency metrics",
          "vendor spending analysis",
          "budget variance reporting"
        ]
      };
    } else if (lowerQuery.includes('customer') || lowerQuery.includes('client')) {
      return {
        thought: "Analyzing customer data to understand relationship patterns and value",
        icon: BarChart3,
        searches: [
          "customer lifetime value analysis",
          "client retention patterns",
          "payment behavior trends",
          "customer concentration risk",
          "top client revenue contribution"
        ]
      };
    } else if (lowerQuery.includes('profit') || lowerQuery.includes('margin') || lowerQuery.includes('profitability')) {
      return {
        thought: "Computing profitability metrics across different business dimensions",
        icon: Calculator,
        searches: [
          "gross margin trend analysis",
          "product profitability breakdown",
          "operational efficiency ratios",
          "cost structure optimization",
          "profit center performance"
        ]
      };
    } else if (lowerQuery.includes('tax') || lowerQuery.includes('deduction')) {
      return {
        thought: "Reviewing tax-related transactions and deduction opportunities",
        icon: Calculator,
        searches: [
          "deductible business expenses",
          "quarterly tax liability estimates",
          "tax optimization strategies",
          "depreciation schedules",
          "business tax planning opportunities"
        ]
      };
    } else {
      return {
        thought: "Analyzing your complete financial dataset to provide comprehensive insights",
        icon: BarChart3,
        searches: [
          "balance sheet trend analysis",
          "income statement patterns",
          "key financial ratios",
          "business performance indicators",
          "financial health metrics"
        ]
      };
    }
  };

  const { thought, searches, icon: ThinkingIcon } = getContextualThinking(userQuery);

  // Animate search items appearing sequentially
  useEffect(() => {
    const timer = setTimeout(() => {
      // Show first search immediately
      setVisibleSearches([0]);
      setCurrentSearchIndex(0);
      
      // Sequentially add more searches
      searches.forEach((_, index) => {
        if (index > 0) {
          setTimeout(() => {
            setVisibleSearches(prev => [...prev, index]);
            setCurrentSearchIndex(index);
          }, index * 600);
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [searches]);

  return (
    <div className="flex gap-4 mb-8 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
        <FinloBrand size="sm" className="text-white" inline />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium mb-1 font-finlo">Finlo AI</div>
        
        <div className="space-y-4">
          {/* Main thinking statement */}
          <div className="flex items-start gap-3 animate-fade-in">
            <ThinkingIcon className="w-4 h-4 text-primary mt-1 animate-pulse flex-shrink-0" />
            <p className="text-gray-700 text-sm leading-relaxed">
              {thought}
            </p>
          </div>

          {/* Searching indicator */}
          <div className="mt-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-2 text-primary text-sm font-medium mb-3">
              <img src={quickbooksLogo} alt="QuickBooks" className="w-4 h-4" />
              <span>Searching</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>

            {/* Search queries */}
            <div className="space-y-2">
              {searches.map((search, index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ease-out ${
                    visibleSearches.includes(index) 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-4 scale-95'
                  }`}
                >
                  <div className={`flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 border transition-all duration-300 ${
                    currentSearchIndex === index 
                      ? 'border-primary/30 bg-primary/5 shadow-sm' 
                      : 'border-gray-200'
                  }`}>
                    <img src={quickbooksLogo} alt="QuickBooks" className={`w-3 h-3 flex-shrink-0 transition-opacity duration-300 ${
                      currentSearchIndex === index ? 'opacity-100' : 'opacity-60'
                    }`} />
                    <span className={`text-sm font-mono transition-colors duration-300 ${
                      currentSearchIndex === index ? 'text-primary/90' : 'text-gray-600'
                    }`}>
                      {search}
                    </span>
                    {currentSearchIndex === index && (
                      <div className="ml-auto">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
                          <div className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingAnimation;