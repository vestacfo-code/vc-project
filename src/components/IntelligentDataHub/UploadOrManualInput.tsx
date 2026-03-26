import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Calculator, FileText, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DataConnection, FinancialInsight } from './types';
import { processDocumentClientSide, processManualFinancialData } from '@/lib/documentProcessor';
import { supabase } from '@/integrations/supabase/client';

interface UploadOrManualInputProps {
  connections: DataConnection[];
  setConnections: React.Dispatch<React.SetStateAction<DataConnection[]>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  setInsights: React.Dispatch<React.SetStateAction<FinancialInsight | null>>;
  setPersonalizedContext: React.Dispatch<React.SetStateAction<string>>;
  setUploadSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  isUploading: boolean;
  isAnalyzing: boolean;
  uploadSuccess: boolean;
}

interface ManualFinancialData {
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
}

export default function UploadOrManualInput({
  connections,
  setConnections,
  setIsUploading,
  setIsAnalyzing,
  setInsights,
  setPersonalizedContext,
  setUploadSuccess,
  isUploading,
  isAnalyzing,
  uploadSuccess
}: UploadOrManualInputProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [manualData, setManualData] = useState<ManualFinancialData>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    cashFlow: 0
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['.csv', '.xlsx', '.xls', '.pdf', '.docx', '.doc', '.txt', '.png', '.jpg', '.jpeg', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file format",
        description: "Supported formats: CSV, Excel, PDF, Word, Images (PNG/JPG/WEBP), TXT",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    
    try {
      console.log('🔄 Processing file:', file.name);
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      // Route Excel files to server-side enhanced processor
      if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        console.log('📊 Routing Excel file to enhanced server-side processor...');
        try {
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binaryString = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const fileContent = btoa(binaryString);

          const { data: excelData, error: excelError } = await supabase.functions.invoke('enhanced-xlsx-processor', {
            body: {
              fileContent,
              fileName: file.name,
              userId: user.id,
            },
          });

          if (excelError) throw excelError;
          console.log('✅ Enhanced Excel processing success from UploadOrManualInput:', excelData);

          // Create document record for Excel file so it shows up in documents list
          const { data: docData, error: docError } = await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              file_name: file.name,
              file_type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              file_size: file.size,
              processing_status: 'completed',
              records_extracted: 1,
              metadata: {
                source: 'enhanced-xlsx-processor-manual-upload',
                summary: excelData?.summary || {},
                processed_at: new Date().toISOString()
              }
            })
            .select()
            .single();

          if (docError) {
            console.warn('Failed to create document record from UploadOrManualInput:', docError);
          } else {
            console.log('✅ Document record created from UploadOrManualInput:', docData);
          }
          
          // Convert enhanced Excel data to FinancialInsight format
          if (excelData?.summary) {
            const insight: FinancialInsight = {
              summary: `Enhanced Excel analysis of ${file.name}`,
              keyMetrics: {
                revenue: excelData.summary.totalRevenue || null,
                expenses: excelData.summary.totalExpenses || null,
                profit: excelData.summary.profit || null,
                cashFlow: excelData.summary.totalCashFlow || null,
              },
              insights: [],
              recommendations: [],
              healthScore: excelData.summary.healthScore || 50,
              reasoning: {
                documentAnalysis: `Processed ${file.name} with enhanced scaling detection and categorization`
              },
              riskFactors: []
            };
            setInsights(insight);
          }
        } catch (excelServerError) {
          console.warn('⚠️ Enhanced Excel server processing failed, falling back to client:', excelServerError);
          const processResult = await processDocumentClientSide(file, user.id);
          if (!processResult || !processResult.success) {
            throw new Error('Excel processing failed');
          }
          if (processResult.groqAnalysis) {
            const insights = {
              summary: processResult.groqAnalysis.summary || 'Financial analysis completed successfully.',
              keyMetrics: {
                revenue: (processResult.groqAnalysis.totalRevenue ?? null),
                expenses: (processResult.groqAnalysis.totalExpenses ?? null),
                profit: (processResult.groqAnalysis.netProfit ?? null),
                cashFlow: (processResult.groqAnalysis.cashFlow ?? null)
              },
              insights: [],
              recommendations: [],
              healthScore: processResult.groqAnalysis.healthScore ?? 75,
              reasoning: processResult.groqAnalysis.reasoning || null,
              riskFactors: []
            } as FinancialInsight;
            setInsights(insights);
          }
        }
      } else {
        // Use client-side processing for other file types
        const processResult = await processDocumentClientSide(file, user.id);
        if (!processResult || !processResult.success) {
          throw new Error('Document processing failed');
        }
        if (processResult.groqAnalysis) {
          const insights = {
            summary: processResult.groqAnalysis.summary || 'Financial analysis completed successfully.',
            keyMetrics: {
              revenue: (processResult.groqAnalysis.totalRevenue ?? null),
              expenses: (processResult.groqAnalysis.totalExpenses ?? null),
              profit: (processResult.groqAnalysis.netProfit ?? null),
              cashFlow: (processResult.groqAnalysis.cashFlow ?? null)
            },
            insights: [],
            recommendations: [],
            healthScore: processResult.groqAnalysis.healthScore ?? 75,
            reasoning: processResult.groqAnalysis.reasoning || null,
            riskFactors: []
          } as FinancialInsight;
          setInsights(insights);
        }
      }

      setUploadSuccess(true);
      setConnections(prev => prev.map(conn => 
        conn.name === 'Financial Data' 
          ? { ...conn, status: 'connected' as const, lastSync: new Date().toISOString().split('T')[0] }
          : conn
      ));

      // Trigger dashboard update to refresh documents list
      window.dispatchEvent(new Event('dashboardUpdate'));
      
      toast({
        title: "Document uploaded successfully!",
        description: `Processed financial data from ${file.name}`,
      });

    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process your financial document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsAnalyzing(true);
    
    try {
      console.log('📊 Processing manual data:', manualData);
      const processResult = await processManualFinancialData(manualData, user.id);
      
      if (!processResult || !processResult.success) {
        throw new Error('Manual data processing failed');
      }

      setUploadSuccess(true);
      setConnections(prev => prev.map(conn => 
        conn.name === 'Financial Data' 
          ? { ...conn, status: 'connected' as const, lastSync: new Date().toISOString().split('T')[0] }
          : conn
      ));
      
      toast({
        title: "Data analyzed successfully!",
        description: "Your manual financial data has been processed.",
      });

      // Process insights
      if (processResult.groqAnalysis) {
        const insights = {
          summary: processResult.groqAnalysis.summary || 'Manual financial data analysis completed.',
          keyMetrics: {
            revenue: manualData.revenue,
            expenses: manualData.expenses,
            profit: manualData.profit,
            cashFlow: manualData.cashFlow
          },
          insights: Array.isArray(processResult.groqAnalysis.insights) ? processResult.groqAnalysis.insights : [
            {
              title: "Manual Data Analysis",
              description: "Your manually entered financial data has been analyzed.",
              type: "positive" as const,
              impact: "high" as const
            }
          ],
          recommendations: processResult.groqAnalysis.recommendations || ['Consider uploading detailed financial documents for deeper insights.'],
          healthScore: processResult.groqAnalysis.healthScore ?? 75,
          reasoning: processResult.groqAnalysis.reasoning || null,
          riskFactors: []
        };
        
        setInsights(insights);
        setPersonalizedContext('Analysis based on your manually entered financial data.');
        
        toast({
          title: "Analysis complete!",
          description: "Your financial data has been analyzed with AI insights.",
        });
      }

    } catch (error) {
      console.error('Error processing manual data:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze your financial data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    return parseFloat(numericValue) || 0;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Financial Data or Enter Manually
        </CardTitle>
        <CardDescription>
          Upload financial documents or enter your data manually for AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Drop your financial document here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supports: PDF, CSV, Excel, Word (DOC/DOCX), Images (PNG/JPG/WEBP), TXT files
              </p>
              <input
                type="file"
                multiple
                accept=".csv,.xlsx,.xls,.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <label htmlFor="file-upload">
                <Button variant="outline" disabled={isUploading} asChild>
                  <span className="cursor-pointer">
                    {isUploading ? 'Processing...' : 'Choose Files'}
                  </span>
                </Button>
              </label>
            </div>
            
            {uploadSuccess && (
              <div className="text-center p-4 bg-success/10 text-success rounded-lg">
                ✅ Document processed successfully! Check the AI Insights tab for analysis.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="revenue">Revenue</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="revenue"
                      type="text"
                      placeholder="250,000"
                      className="pl-10"
                      onChange={(e) => setManualData(prev => ({ ...prev, revenue: formatCurrency(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expenses">Expenses</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="expenses"
                      type="text"
                      placeholder="180,000"
                      className="pl-10"
                      onChange={(e) => setManualData(prev => ({ ...prev, expenses: formatCurrency(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profit">Profit</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profit"
                      type="text"
                      placeholder="70,000"
                      className="pl-10"
                      onChange={(e) => setManualData(prev => ({ ...prev, profit: formatCurrency(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cashFlow">Cash Flow</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cashFlow"
                      type="text"
                      placeholder="85,000"
                      className="pl-10"
                      onChange={(e) => setManualData(prev => ({ ...prev, cashFlow: formatCurrency(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isAnalyzing || Object.values(manualData).every(val => val === 0)}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Financial Data"}
              </Button>
            </form>
            
            {uploadSuccess && (
              <div className="text-center p-4 bg-success/10 text-success rounded-lg">
                ✅ Data analyzed successfully! Check the AI Insights tab for analysis.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}