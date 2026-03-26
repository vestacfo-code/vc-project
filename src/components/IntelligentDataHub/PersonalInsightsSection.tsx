import { Bot, PieChart, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PersonalInsightsProps } from './types';

const PersonalInsightsSection = ({ insights }: PersonalInsightsProps) => {
  if (!insights) {
    return (
      <div className="text-center py-12">
        <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
        <p className="text-muted-foreground mb-4">
          Upload your financial data to get personalized AI insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-primary" />
            Personalized Insights
          </h3>
          <div className="space-y-3">
            {insights.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-primary/5">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-accent/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Bot className="w-5 h-5 mr-2 text-accent" />
            AI Recommendations
          </h3>
            <div className="space-y-3">
              {insights.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent-foreground">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-line leading-relaxed">{rec}</p>
                  </div>
                </div>
              ))}
            </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {insights.riskFactors && insights.riskFactors.length > 0 && (
        <Card className="border-warning/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-warning" />
              Risk Factors
            </h3>
            <div className="space-y-3">
              {insights.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0" />
                  <p className="text-sm">{risk}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonalInsightsSection;