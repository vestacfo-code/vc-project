import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Upload, Brain, MessageCircle, Send, Download, Eye, Calendar, Trash2, Loader2, CheckCircle, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { CreditUsageWrapper } from './CreditUsageWrapper';
import { useFileUploadHandler } from './IntelligentDataHub/FileUploadHandler';

interface UserDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  upload_date: string;
  processing_status: string;
  storage_path?: string;
  metadata?: any;
  markdown_content?: string;
  records_extracted?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface FinancialInsight {
  summary: string;
  keyMetrics?: {
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number;
  };
  insights: string[];
  recommendations: string[];
  healthScore: number;
  riskFactors?: string[];
  reasoning?: any;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

interface UploadData {
  path: string;
  // other properties...
}

async function processUploadDataToMarkdown(filePath: string): Promise<string> {
  try {
    // Download the file from Supabase storage
    const { data, error } = await supabase.storage
      .from('user-documents')
      .download(filePath);
    
    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    // Get file extension from file path
    const pathname = filePath.toLowerCase();
    
    if (pathname.endsWith('.csv')) {
      return await processCSVToMarkdown(data);
    } else if (pathname.endsWith('.xls') || pathname.endsWith('.xlsx')) {
      return await processExcelToMarkdown(data);
    } else {
      throw new Error('Unsupported file type. Only CSV and Excel files are supported.');
    }
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
}

async function processCSVToMarkdown(blob: Blob): Promise<string> {
  const csvText = await blob.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const markdown = convertDataToMarkdown(results.data);
          resolve(markdown);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

async function processExcelToMarkdown(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  // Get the first worksheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  return convertDataToMarkdown(jsonData);
}

function convertDataToMarkdown(data: any[]): string {
  if (!data || data.length === 0) {
    return '| No data available |\n|---|\n';
  }

  // Get headers from the first row
  const headers = Object.keys(data[0]);
  
  // Create markdown table header
  let markdown = '| ' + headers.join(' | ') + ' |\n';
  markdown += '|' + headers.map(() => '---').join('|') + '|\n';
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle null/undefined values and escape pipe characters
      return value != null ? String(value).replace(/\|/g, '\\|') : '';
    });
    markdown += '| ' + values.join(' | ') + ' |\n';
  });
  
  return markdown;
}


const ConsolidatedDocumentHub = () => {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentInsights, setCurrentInsights] = useState<FinancialInsight | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const processFinancialFile = async (file: File) => {
    try {
      console.log('Processing financial file:', file.name, file.type);
      
      // First, upload the file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(`${user.id}/${Date.now()}-${file.name}`, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // process uploadData content to markdown
      const markdownContent = await processUploadDataToMarkdown(uploadData.path);
      console.log(markdownContent);
      
      // Count records from the markdown content (subtract header rows)
      const recordsCount = Math.max(0, markdownContent.split('\n').filter(line => 
        line.trim() && 
        line.includes('|') && 
        !line.includes('---') && 
        !line.startsWith('| No data available')
      ).length - 1); // Subtract 1 for header row
      
      // Create document record
      const { data: documentData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: uploadData.path,
          processing_status: 'processing',
          markdown_content: markdownContent,
          records_extracted: recordsCount
        })
        .select()
        .single();

      if (docError) {
        console.error('Document creation error:', docError);
        throw docError;
      }

      console.log('Document record created:', documentData);

      // Convert file content to base64 for processing
      const fileContent = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      console.log('Calling OpenAI financial analysis...');
      
      // Call OpenAI endpoint to process the file with document ID
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('openai-financial-analysis', {
        body: {
          fileContent,
          fileName: file.name,
          fileType: file.type,
          userId: user?.id,
          documentId: documentData.id
        }
      });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        // Update document status to failed
        await supabase
          .from('documents')
          .update({ processing_status: 'failed' })
          .eq('id', documentData.id);
        throw new Error('Failed to analyze document');
      }

      console.log('Analysis result:', analysisData);

      // Update document status to completed
      await supabase
        .from('documents')
        .update({ 
          processing_status: 'completed'
        })
        .eq('id', documentData.id);

      // Extract financial data from analysis
      if (analysisData?.analysis?.keyMetrics) {
        const metrics = analysisData.analysis.keyMetrics;
        
        // Save to financial_data table with document reference
        const { error: insertError } = await supabase
          .from('financial_data')
          .insert({
            user_id: user?.id,
            document_id: documentData.id,
            revenue: metrics.revenue || 0,
            expenses: metrics.expenses || 0,
            profit: metrics.profit || 0,
            cash_flow: metrics.cashFlow || 0,
            period_start: new Date().toISOString().split('T')[0],
            period_end: new Date().toISOString().split('T')[0]
          });

        if (insertError) {
          console.error('Error saving financial data:', insertError);
          throw insertError;
        }

        console.log('Financial data saved successfully');
      }

      toast({
        title: "Document processed successfully",
        description: `${file.name} has been analyzed and financial data extracted.`
      });

      // Reload documents
      loadDocuments();
      
      return true;
    } catch (error) {
      console.error('Error processing financial file:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process the document. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      for (const file of Array.from(files)) {
        // Check if it's a CSV or Excel file
        const isFinancialFile = file.type.includes('csv') || 
                               file.type.includes('excel') || 
                               file.type.includes('spreadsheet') ||
                               file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                               file.type === 'application/vnd.ms-excel' ||
                               file.name.endsWith('.csv') ||
                               file.name.endsWith('.xlsx') ||
                               file.name.endsWith('.xls');
        
        console.log('File type detection:', { 
          fileName: file.name, 
          fileType: file.type, 
          isFinancialFile 
        });

        if (isFinancialFile) {
          await processFinancialFile(file);
        } else {
          // Handle other file types with regular upload
          const formData = new FormData();
          formData.append('file', file);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('user-documents')
            .upload(`${user.id}/${Date.now()}-${file.name}`, file);

          if (uploadError) throw uploadError;

          // Save document record
          const { error: docError } = await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              storage_path: uploadData.path,
              processing_status: 'completed'
            });

          if (docError) throw docError;
        }
      }

      setUploadSuccess(true);
      loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  useEffect(() => {
    scrollToLastAiMessage();
  }, [chatMessages, streamingText]);

  const scrollToLastAiMessage = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: newDocuments, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('✅ ConsolidatedDocumentHub: Documents loaded:', newDocuments?.length);
      setDocuments(newDocuments || []);
      
    } catch (error) {
      console.error('❌ ConsolidatedDocumentHub: Error loading documents:', error);
      toast({
        title: "Error loading documents",
        description: "Failed to load your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractFinancialDataFromCSV = (content: string) => {
    let revenue = 0;
    let expenses = 0;
    let profit = 0;

    // Extract Net Revenue: $823,725.00
    const revenueMatch = content.match(/Net Revenue[^$]*\$\s*([0-9,]+)/);
    if (revenueMatch) {
      revenue = parseFloat(revenueMatch[1].replace(/,/g, ''));
      console.log('✅ Found Net Revenue:', revenue);
    }

    // Extract Total Expenses: $130,960.00  
    const expensesMatch = content.match(/Total Expenses[^$]*\$\s*([0-9,]+)/);
    if (expensesMatch) {
      expenses = parseFloat(expensesMatch[1].replace(/,/g, ''));
      console.log('✅ Found Total Expenses:', expenses);
    }

    // Extract Net Profit: $621,971.00
    const profitMatch = content.match(/Net Profit[^$]*\$\s*([0-9,]+)/);
    if (profitMatch) {
      profit = parseFloat(profitMatch[1].replace(/,/g, ''));
      console.log('✅ Found Net Profit:', profit);
    }

    return { revenue, expenses, profit };
  };

  const generateAIInsights = async (document: UserDocument) => {
    if (!user) return;

    setSelectedDocument(document);
    setIsAnalyzing(true);
    setIsLightboxOpen(true);
    setIsStreaming(false);
    setStreamingText('');
    setChatMessages([]);

    try {
      let extractedRevenue = 0;
      let extractedExpenses = 0;
      let extractedProfit = 0;

      // Check if we have CSV content to parse
      if (document.file_name.toLowerCase().endsWith('.csv') && document.markdown_content) {
        console.log('🔍 Extracting financial data from CSV markdown content');
        const extracted = extractFinancialDataFromCSV(document.markdown_content);
        extractedRevenue = extracted.revenue;
        extractedExpenses = extracted.expenses;
        extractedProfit = extracted.profit;
      }

      // If direct extraction failed, check financial_data table
      if (extractedRevenue === 0) {
        console.log('💾 Checking financial_data table...');
        const { data: financialData } = await supabase
          .from('financial_data')
          .select('*')
          .eq('user_id', user.id)
          .eq('document_id', document.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (financialData && financialData.length > 0) {
          const data = financialData[0];
          extractedRevenue = data.revenue || 0;
          extractedExpenses = data.expenses || 0;
          extractedProfit = data.profit || 0;
        }
      }

      // If still no data, check document metadata
      if (extractedRevenue === 0) {
        console.log('📋 Checking document metadata...');
        extractedRevenue = document.metadata?.summary?.totalRevenue || document.metadata?.totalRevenue || 0;
        extractedExpenses = document.metadata?.summary?.totalExpenses || document.metadata?.totalExpenses || 0;
        extractedProfit = document.metadata?.summary?.totalProfit || document.metadata?.totalProfit || 0;
      }

      console.log('📊 Final extracted values:', {
        revenue: extractedRevenue,
        expenses: extractedExpenses,
        profit: extractedProfit
      });

      // Calculate health score based on profit margin
      const profitMargin = extractedRevenue > 0 ? (extractedProfit / extractedRevenue) * 100 : 0;
      const healthScore = Math.min(Math.max(50 + profitMargin, 10), 100);
      
      // Create insights structure with extracted data
      const insights = {
        healthScore: Math.round(healthScore),
        keyMetrics: {
          revenue: extractedRevenue,
          expenses: extractedExpenses,
          profit: extractedProfit,
          cashFlow: extractedProfit
        },
        summary: `Financial analysis of ${document.file_name} shows revenue of ${formatCurrency(extractedRevenue)}, expenses of ${formatCurrency(extractedExpenses)}, and net profit of ${formatCurrency(extractedProfit)}.`,
        reasoning: {
          dataSource: extractedRevenue > 0 ? 'CSV content extraction' : 'Document metadata',
          documentId: document.id
        },
        insights: [
          `Revenue: ${formatCurrency(extractedRevenue)}`,
          `Expenses: ${formatCurrency(extractedExpenses)}`,
          `Net Profit: ${formatCurrency(extractedProfit)}`,
          `Profit Margin: ${profitMargin.toFixed(1)}%`
        ],
        recommendations: profitMargin > 20 ? 
          ['Strong profitability - consider expansion opportunities', 'Maintain current operational efficiency'] :
          ['Focus on cost optimization', 'Explore revenue growth strategies']
      };

      setCurrentInsights(insights);
      
      // Create formatted summary using extracted data
      const formattedSummary = `# 📊 Financial Analysis: ${document.file_name}

---

## 📋 Executive Summary
**Business Health Score:** ${insights.healthScore}/100  
**Data Source:** ${insights.reasoning.dataSource}  
**Analysis Date:** ${new Date().toLocaleDateString()}

---

## 💰 Key Financial Metrics

**Total Revenue:** ${formatCurrency(extractedRevenue)}

**Operating Expenses:** ${formatCurrency(extractedExpenses)} (${formatPercent(extractedExpenses, extractedRevenue)} of revenue)

**Net Profit:** ${formatCurrency(extractedProfit)} 
- **Profit Margin:** ${formatPercent(extractedProfit, extractedRevenue)}

**Cash Flow:** ${formatCurrency(extractedProfit)}

---

## 🧠 Key Insights

${insights.insights.map(insight => `• ${insight}`).join('\n')}

---

## 💡 Recommendations

${insights.recommendations.map(rec => `• ${rec}`).join('\n')}

---

**Note:** Analysis based on financial data extracted from your uploaded document.

I'm ready to dive deeper into your financial data! Ask me about:

• Revenue growth strategies • Expense optimization opportunities  
• Cash flow management • Industry benchmarks • Investment recommendations

What would you like to explore first?`;
        
      setStreamingText(formattedSummary);

    } catch (error) {
      console.error('Error analyzing data:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze your financial data. Please try again.",
        variant: "destructive",
      });
      setIsLightboxOpen(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!currentMessage.trim() || !currentInsights || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsSendingMessage(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: currentMessage,
          context: currentInsights,
          userId: user.id
        }
      });

      if (error) throw error;

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'm here to help analyze your financial data. What would you like to know?",
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, aiResponse]);
      scrollToLastAiMessage();
    } catch (chatError) {
      console.error('AI chat failed, falling back to basic response:', chatError);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your question right now. The AI chat service may need additional configuration.",
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDownload = async (document: UserDocument) => {
    if (!document.storage_path) {
      toast({
        title: "Download failed",
        description: "Document file path not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloadingId(document.id);
      
      const { data, error } = await supabase.storage
        .from('user-documents')
        .download(document.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download successful",
        description: `${document.file_name} has been downloaded.`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // Also delete related financial data
      await supabase
        .from('financial_data')
        .delete()
        .eq('document_id', documentId);

      toast({
        title: "Document deleted",
        description: "The document and its related metrics have been removed.",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Document Hub</h2>
          <p className="text-muted-foreground">Upload, analyze, and manage your financial documents</p>
        </div>
      </div>

      {/* Upload Box */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
        <div className="relative border-2 border-dashed border-primary/30 rounded-2xl p-10 text-center hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm hover:from-card/90 hover:to-card/70">
          <div className="space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg" />
              <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center border border-primary/30">
                {uploadSuccess ? (
                  <CheckCircle className="w-10 h-10 text-success" />
                ) : (
                  <Upload className="w-10 h-10 text-primary" />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {uploadSuccess ? "Data Uploaded Successfully!" : "Upload Financial Documents"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                Supported formats: CSV, Excel (XLS/XLSX), PDF, Word (DOC/DOCX), Text files, JSON, XML, Banking files (OFX/QFX/QIF), Images (PNG/JPG for OCR), ZIP archives
              </p>
              <input
                type="file"
                multiple
                accept=".csv,.xlsx,.xls,.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp,.json,.xml,.ofx,.qfx,.qif,.zip"
                onChange={handleDocumentUpload}
                disabled={isUploading}
                className="hidden"
                id="financial-upload"
              />
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <label htmlFor="financial-upload">
                  <Button 
                    asChild 
                    disabled={isUploading} 
                    size="lg" 
                    className="cursor-pointer px-8 py-3 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  >
                    <span>
                      {isUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : uploadSuccess ? (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Upload More Files
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Choose Files
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <Card className="p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No documents uploaded yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload your financial documents to get started with AI-powered analysis
          </p>
          <Button onClick={() => document.getElementById('financial-upload')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Your First Document
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((document) => (
            <Card key={document.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="w-8 h-8 text-primary mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{document.file_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(document.upload_date).toLocaleDateString()}
                      </span>
                      <span>{formatFileSize(document.file_size)}</span>
                      <Badge variant={getStatusColor(document.processing_status)}>
                        {document.processing_status}
                      </Badge>
                      {document.records_extracted && document.records_extracted > 0 && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {document.records_extracted} records
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {document.processing_status === 'completed' && (
                    <CreditUsageWrapper
                      creditsRequired={1}
                      actionName="AI Financial Analysis"
                      onAction={() => generateAIInsights(document)}
                    >
                      <Button variant="outline" size="sm">
                        <Brain className="w-4 h-4 mr-2" />
                        AI Analysis
                      </Button>
                    </CreditUsageWrapper>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(document)}
                    disabled={!document.storage_path || downloadingId === document.id}
                  >
                    {downloadingId === document.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(document.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* AI Analysis Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Financial Analysis
              {selectedDocument && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {selectedDocument.file_name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex gap-4 min-h-0">
            {/* Analysis Results */}
            <div className="flex-1 flex flex-col">
              {currentInsights && (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-muted-foreground">Revenue</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(currentInsights.keyMetrics?.revenue || 0)}
                    </p>
                  </Card>
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-muted-foreground">Expenses</h4>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(currentInsights.keyMetrics?.expenses || 0)}
                    </p>
                  </Card>
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-muted-foreground">Profit</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(currentInsights.keyMetrics?.profit || 0)}
                    </p>
                  </Card>
                  <Card className="p-4 text-center">
                    <h4 className="text-sm font-medium text-muted-foreground">Cash Flow</h4>
                    <p className="text-2xl font-bold text-cyan-600">
                      {formatCurrency(currentInsights.keyMetrics?.cashFlow || 0)}
                    </p>
                  </Card>
                </div>
              )}

              <ScrollArea className="flex-1 border rounded-lg p-4">
                {isAnalyzing ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Brain className="w-8 h-8 animate-pulse mx-auto mb-2 text-primary" />
                      <p>Analyzing your financial data...</p>
                    </div>
                  </div>
                ) : streamingText ? (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                      {streamingText}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>AI Analysis Summary</p>
                      <p className="text-sm">[object Object]</p>
                    </div>
                  </div>
                )}

                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm prose-slate max-w-none">
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </ScrollArea>
            </div>

            {/* Chat Interface */}
            <Card className="w-80 flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="w-5 h-5" />
                  What's Next?
                </CardTitle>
                <CardDescription>
                  I've analyzed your specific document data! Ask me about:
                  <br />• Revenue trends and patterns • Expense optimization opportunities
                  <br />• Cash flow management • Industry comparisons • Strategic recommendations
                  <br /><br />What would you like to explore about your financial data?
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask questions about your financial analysis..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                    disabled={isSendingMessage || !currentInsights}
                  />
                  <Button
                    onClick={sendChatMessage}
                    disabled={!currentMessage.trim() || isSendingMessage || !currentInsights}
                    size="icon"
                  >
                    {isSendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsolidatedDocumentHub;