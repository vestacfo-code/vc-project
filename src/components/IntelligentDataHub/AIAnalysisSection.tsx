import { Bot, Loader2, TrendingUp, FileText, Brain, Lightbulb, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AIAnalysisProps } from './types';

const AIAnalysisSection = ({ 
  isUploading, 
  isAnalyzing, 
  insights, 
  personalizedContext, 
  formatCurrency 
}: AIAnalysisProps) => {
  const showAmount = (v: number | null | undefined) => v == null ? '--' : formatCurrency(v);

  if (isUploading || isAnalyzing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <Loader2 className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">AI is analyzing your data...</h3>
            <p className="text-sm text-muted-foreground">
              {isUploading ? "Processing your financial data..." : "Training your personal AI CFO..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center py-12">
        <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No analysis yet</h3>
        <p className="text-muted-foreground mb-4">
          Upload your financial data to get AI-powered insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Document-Specific Analysis Indicator */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary" />
          <div>
            <h4 className="font-semibold text-primary">Claude AI Enhanced Analysis</h4>
            <p className="text-sm text-muted-foreground">
              This analysis uses Claude Opus 4 for superior accuracy and insights on your financial documents.
            </p>
          </div>
        </div>
      </div>

      {/* Health Score */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Document Health Score
            </h3>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{insights.healthScore == null ? '--' : insights.healthScore}/100</div>
              <p className="text-sm text-muted-foreground">Current Document</p>
            </div>
          </div>
          {personalizedContext && (
            <p className="text-sm text-accent bg-accent/10 p-3 rounded-lg border border-accent/20">
              {personalizedContext}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Executive Summary
          </h3>
          <p className="text-muted-foreground leading-relaxed">{insights.summary}</p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-success/20 bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Revenue</p>
            <p className="text-xl font-bold text-success">
              {showAmount(insights.keyMetrics.revenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Expenses</p>
            <p className="text-xl font-bold text-destructive">
              {showAmount(insights.keyMetrics.expenses)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Profit</p>
            <p className="text-xl font-bold text-primary">
              {showAmount(insights.keyMetrics.profit)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Cash Flow</p>
            <p className="text-xl font-bold text-accent">
              {showAmount(insights.keyMetrics.cashFlow)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Reasoning - Document Specific */}
      {insights.reasoning && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-primary" />
              AI Analysis Details
            </h3>
            <div className="space-y-4">
              {insights.reasoning.documentAnalysis && (
                <div className="bg-secondary/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Document Analysis</h4>
                  <p className="text-sm text-muted-foreground">{insights.reasoning.documentAnalysis}</p>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-success/10 p-4 rounded-lg border border-success/20">
                  <h4 className="font-semibold text-sm mb-2 text-success">Revenue Calculation</h4>
                  <p className="text-sm text-muted-foreground">{insights.reasoning.revenueCalculation}</p>
                </div>
                <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                  <h4 className="font-semibold text-sm mb-2 text-destructive">Expense Calculation</h4>
                  <p className="text-sm text-muted-foreground">{insights.reasoning.expenseCalculation}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-sm mb-2 text-primary">Data Processed</h4>
                  <p className="text-sm text-muted-foreground">{insights.reasoning.dataRowsProcessed} rows analyzed</p>
                </div>
                <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                  <h4 className="font-semibold text-sm mb-2 text-accent">Columns Used</h4>
                  <p className="text-sm text-muted-foreground">{insights.reasoning.columnsUsed}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {insights.insights && insights.insights.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-primary" />
              Key Insights
            </h3>
            <div className="space-y-3">
              {insights.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-secondary/30">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${
                    insight.type === 'positive' ? 'text-success' : 
                    insight.type === 'negative' ? 'text-destructive' : 'text-muted-foreground'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                      insight.impact === 'high' ? 'bg-destructive/20 text-destructive' :
                      insight.impact === 'medium' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
                    }`}>
                      {insight.impact} impact
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Recommendations
            </h3>
            <div className="space-y-3">
              {insights.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAnalysisSection;