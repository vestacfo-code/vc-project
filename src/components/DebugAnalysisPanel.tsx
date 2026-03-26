import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, Play, FileText, Zap } from 'lucide-react';

interface DebugAnalysisPanelProps {
  documentId?: string;
  onAnalysisComplete?: (results: any) => void;
}

interface DebugResult {
  documentAccess: {
    accessible: boolean;
    fileSize: number;
    contentLength: number;
    errors: string[];
  };
  parsingMethods: {
    totalMethods: number;
    successfulMethods: number;
    highestConfidence: number;
    results: Array<{
      source: string;
      method: string;
      confidence: number;
      extractedRevenue: number;
      extractedExpenses: number;
      errors: string[];
    }>;
  };
  modelComparison?: {
    claudeSuccess: boolean;
    openaiSuccess: boolean;
    agreement: boolean;
    recommendations: string[];
  };
  recommendations: string[];
  timestamp: string;
}

export const DebugAnalysisPanel: React.FC<DebugAnalysisPanelProps> = ({
  documentId,
  onAnalysisComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const runDebugAnalysis = async (compareModels = false) => {
    if (!documentId || !user) {
      toast({
        title: "Missing requirements",
        description: "Document ID and user authentication required",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    console.log('🔍 Starting debug analysis for document:', documentId);

    try {
      const { data, error } = await supabase.functions.invoke('debug-document-analysis', {
        body: {
          documentId,
          userId: user.id,
          enableDebugMode: true,
          compareModels
        }
      });

      if (error) throw error;

      console.log('✅ Debug analysis completed:', data);
      setDebugResult(data.debugReport);
      setIsExpanded(true);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }

      toast({
        title: "Debug analysis completed",
        description: `Found ${data.debugReport.parsingMethods.successfulMethods} successful parsing methods`,
      });

    } catch (error) {
      console.error('❌ Debug analysis failed:', error);
      toast({
        title: "Debug analysis failed", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (success: boolean, confidence?: number) => {
    if (success && confidence && confidence >= 0.7) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (success) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Debug Document Analysis
        </CardTitle>
        <CardDescription>
          Deep debug analysis of document parsing and AI model performance
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => runDebugAnalysis(false)}
            disabled={isAnalyzing || !documentId}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isAnalyzing ? 'Analyzing...' : 'Run Debug Analysis'}
          </Button>
          
          <Button
            onClick={() => runDebugAnalysis(true)}
            disabled={isAnalyzing || !documentId}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Compare Models
          </Button>
        </div>

        {debugResult && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Debug Results ({new Date(debugResult.timestamp).toLocaleString()})
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="parsing">Parsing</TabsTrigger>
                  <TabsTrigger value="models">Models</TabsTrigger>
                  <TabsTrigger value="recommendations">Fixes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Document Access</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(debugResult.documentAccess.accessible)}
                          <span className="text-sm">
                            {debugResult.documentAccess.accessible ? 'Accessible' : 'Not Accessible'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {debugResult.documentAccess.fileSize.toLocaleString()} bytes
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Parsing Success</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(debugResult.parsingMethods.successfulMethods > 0)}
                          <span className="text-sm">
                            {debugResult.parsingMethods.successfulMethods}/{debugResult.parsingMethods.totalMethods} methods
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Max confidence: {(debugResult.parsingMethods.highestConfidence * 100).toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {debugResult.documentAccess.errors.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-red-600">Access Errors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {debugResult.documentAccess.errors.map((error, index) => (
                          <p key={index} className="text-xs text-red-600 mb-1">{error}</p>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="parsing" className="space-y-4">
                  {debugResult.parsingMethods.results.map((result, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{result.source}</CardTitle>
                          <Badge 
                            className={`${getConfidenceColor(result.confidence)} text-white`}
                          >
                            {(result.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Method:</span>
                            <p className="font-mono">{result.method}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Revenue:</span>
                            <p className="font-mono">${result.extractedRevenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expenses:</span>
                            <p className="font-mono">${result.extractedExpenses.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Errors:</span>
                            <p className="text-red-600">{result.errors.length}</p>
                          </div>
                        </div>
                        {result.errors.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {result.errors.map((error, errorIndex) => (
                              <p key={errorIndex} className="text-xs text-red-600 bg-red-50 p-1 rounded">
                                {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="models" className="space-y-4">
                  {debugResult.modelComparison ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Claude Analysis</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(debugResult.modelComparison.claudeSuccess)}
                              <span className="text-sm">
                                {debugResult.modelComparison.claudeSuccess ? 'Success' : 'Failed'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">OpenAI Analysis</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(debugResult.modelComparison.openaiSuccess)}
                              <span className="text-sm">
                                {debugResult.modelComparison.openaiSuccess ? 'Success' : 'Failed'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Model Agreement</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(debugResult.modelComparison.agreement)}
                            <span className="text-sm">
                              {debugResult.modelComparison.agreement ? 'Models Agree' : 'Models Disagree'}
                            </span>
                          </div>
                          {debugResult.modelComparison.recommendations.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {debugResult.modelComparison.recommendations.map((rec, index) => (
                                <p key={index} className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                                  {rec}
                                </p>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <p className="text-muted-foreground">
                          No model comparison available. Click "Compare Models" to run cross-model analysis.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  {debugResult.recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {debugResult.recommendations.map((recommendation, index) => {
                        const isError = recommendation.toLowerCase().includes('critical');
                        const isWarning = recommendation.toLowerCase().includes('warning');
                        const isAction = recommendation.toLowerCase().includes('action');
                        
                        return (
                          <Card key={index} className={
                            isError ? 'border-red-200 bg-red-50' :
                            isWarning ? 'border-yellow-200 bg-yellow-50' :
                            isAction ? 'border-blue-200 bg-blue-50' :
                            'border-green-200 bg-green-50'
                          }>
                            <CardContent className="pt-3">
                              <p className="text-sm">{recommendation}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          No critical issues found. Document analysis is working well!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};