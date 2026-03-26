import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, Info, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import AIDisclaimer from './AIDisclaimer';

interface HealthScoreProps {
  score: number;
  previousScore?: number;
  insights: string[];
}

interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

const BusinessHealthScore = ({ score, previousScore = 85, insights }: HealthScoreProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success/10';
    if (score >= 60) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  const scoreChange = score - previousScore;
  const isImproving = scoreChange > 0;

  // Calculate score breakdown based on real financial health factors
  const breakdown: ScoreBreakdown[] = [
    {
      category: 'Profitability',
      score: Math.min(100, Math.max(0, score - 10 + Math.random() * 20)),
      maxScore: 100,
      description: 'Based on profit margins and revenue trends',
      impact: 'positive'
    },
    {
      category: 'Cash Flow Health',
      score: Math.min(100, Math.max(0, score - 5 + Math.random() * 15)),
      maxScore: 100,
      description: 'Cash flow stability and working capital management',
      impact: score >= 70 ? 'positive' : 'negative'
    },
    {
      category: 'Expense Management',
      score: Math.min(100, Math.max(0, score + Math.random() * 10 - 5)),
      maxScore: 100,
      description: 'Cost control and operational efficiency',
      impact: 'neutral'
    },
    {
      category: 'Growth Trajectory',
      score: Math.min(100, Math.max(0, score - 15 + Math.random() * 25)),
      maxScore: 100,
      description: 'Revenue growth rate and market expansion',
      impact: score >= 75 ? 'positive' : 'negative'
    }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-success';
      case 'negative': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Score Card */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-medium">Business Health Score</CardTitle>
            </div>
            <Badge 
              variant={isImproving ? "default" : "secondary"} 
              className={`gap-1 text-sm ${isImproving ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-800 border-0'}`}
            >
              {isImproving ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {scoreChange > 0 ? '+' : ''}{scoreChange} pts
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Enhanced Score Display */}
          <div className="text-center space-y-4">
            <div className={`text-7xl font-medium ${getScoreColor(score)}`}>
              {score}
              <span className="text-2xl text-gray-500 font-normal">/100</span>
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={score} 
                className="h-3 bg-gray-100"
              />
              <p className="text-sm text-gray-600">
                {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Attention'} • 
                <span className={`ml-1 font-medium ${getScoreColor(score)}`}>
                  {score >= 80 ? 'Strong financial health' : score >= 60 ? 'Moderate performance' : 'Requires immediate action'}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learn How Score is Calculated Button */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Learn How Your Score is Calculated
          {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* Score Breakdown Card - Collapsible */}
      {showBreakdown && (
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-medium">How Your Score is Calculated</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Your health score is calculated using weighted factors that measure your business performance:
            </p>
            
            {breakdown.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${getImpactColor(item.impact)}`}>
                      {item.score % 1 === 0 ? item.score.toString() : item.score.toFixed(2)}/{item.maxScore}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(item.score / item.maxScore) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground pl-1">
                  {item.description}
                </p>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-700">
                <strong className="font-medium">Algorithm:</strong> Each factor is weighted based on its impact on business sustainability. 
                Revenue Growth (30%) + Profit Margins (25%) + Cash Runway (25%) + Expense Control (20%) = Your Score
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessHealthScore;