import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface FinancialInsight {
  summary: string;
  keyMetrics: {
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number;
  };
  insights: string[];
  recommendations: string[];
}

const FinancialInterpreter = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<FinancialInsight | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV file with your financial data.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    
    try {
      // Read the CSV file
      const text = await file.text();
      
      // Process the CSV data through our edge function
      const { data: processResult, error: processError } = await supabase.functions.invoke(
        'process-financial-data',
        {
          body: {
            csvData: text,
            userId: user.id
          }
        }
      );

      if (processError) throw processError;

      setUploadSuccess(true);
      toast({
        title: "Data uploaded successfully!",
        description: `Processed ${processResult.recordsProcessed} financial records.`,
      });

      // Automatically trigger AI analysis with the summary
      await triggerAIAnalysis(processResult.summary);

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to process your financial data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerAIAnalysis = async (financialSummary?: any) => {
    if (!user) return;

    setIsAnalyzing(true);

    try {
      // If no summary provided, get the latest financial data
      let analysisData = financialSummary;
      
      if (!analysisData) {
        const { data: finData } = await supabase
          .from('financial_data')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!finData || finData.length === 0) {
          toast({
            title: "No data found",
            description: "Please upload your financial data first.",
            variant: "destructive",
          });
          return;
        }

        // Calculate summary from existing data
        const totalRevenue = finData.reduce((sum, record) => sum + (record.revenue || 0), 0);
        const totalExpenses = finData.reduce((sum, record) => sum + (record.expenses || 0), 0);
        const totalCashFlow = finData.reduce((sum, record) => sum + (record.cash_flow || 0), 0);

        analysisData = {
          totalRevenue,
          totalExpenses,
          totalCashFlow,
          profit: totalRevenue - totalExpenses
        };
      }

      // Call the financial analysis edge function
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
        'financial-analysis',
        {
          body: {
            financialData: {
              revenue: analysisData.totalRevenue,
              expenses: analysisData.totalExpenses,
              cashFlow: analysisData.totalCashFlow,
              period: 'Recent Period'
            },
            userId: user.id
          }
        }
      );

      if (analysisError) throw analysisError;

      // Transform the result to match our interface
      const transformedInsights: FinancialInsight = {
        summary: analysisResult.summary,
        keyMetrics: {
          revenue: analysisData.totalRevenue || 0,
          expenses: analysisData.totalExpenses || 0,
          profit: (analysisData.totalRevenue || 0) - (analysisData.totalExpenses || 0),
          cashFlow: analysisData.totalCashFlow || 0
        },
        insights: analysisResult.insights || [],
        recommendations: analysisResult.recommendations || []
      };

      setInsights(transformedInsights);

      toast({
        title: "AI analysis complete!",
        description: "Your financial insights are ready to review.",
      });

    } catch (error) {
      console.error('Error analyzing data:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze your financial data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-primary" />
            <CardTitle>Financial Interpreter</CardTitle>
          </div>
          <CardDescription>
            Upload your financial data and get instant AI insights in plain language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <Label htmlFor="financial-data">Upload Financial Data</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {uploadSuccess ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : (
                    <Upload className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {uploadSuccess ? "Data Uploaded Successfully!" : "Upload Financial Data"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {uploadSuccess 
                      ? "Your data has been processed and is ready for AI analysis"
                      : "Upload your CSV file with financial data for AI analysis"
                    }
                  </p>
                  <input
                    id="financial-data"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isUploading || isAnalyzing}
                    className="hidden"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                    <label htmlFor="financial-data">
                      <Button asChild disabled={isUploading || isAnalyzing} variant={uploadSuccess ? "outline" : "default"}>
                        <span className="cursor-pointer">
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : uploadSuccess ? (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload New File
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Choose CSV File
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    {uploadSuccess && (
                      <Button 
                        onClick={() => triggerAIAnalysis()} 
                        disabled={isAnalyzing}
                        className="sm:ml-2"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Run AI Analysis
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">CSV Format Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Required columns: Date, Revenue, Expenses, Cash Flow</li>
                <li>• Optional columns: Category, Description</li>
                <li>• Date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
                <li>• Numbers without currency symbols (e.g., 1000.50)</li>
              </ul>
            </div>
          </div>

          {(isUploading || isAnalyzing) && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  {isUploading ? "Processing your financial data..." : "AI is analyzing your data..."}
                </p>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {insights && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Executive Summary</h3>
                <p className="text-muted-foreground">{insights.summary}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-success/10 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-lg font-semibold text-success">
                    {formatCurrency(insights.keyMetrics.revenue)}
                  </p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Expenses</p>
                  <p className="text-lg font-semibold text-destructive">
                    {formatCurrency(insights.keyMetrics.expenses)}
                  </p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Profit</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatCurrency(insights.keyMetrics.profit)}
                  </p>
                </div>
                <div className="bg-accent/10 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Cash Flow</p>
                  <p className="text-lg font-semibold text-accent">
                    {formatCurrency(insights.keyMetrics.cashFlow)}
                  </p>
                </div>
              </div>

              {/* Insights */}
              <div>
                <h3 className="font-semibold mb-3">Key Insights</h3>
                <div className="space-y-2">
                  {insights.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="font-semibold mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {insights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialInterpreter;