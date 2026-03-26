import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProcessingResult {
  method: 'python' | 'traditional';
  success: boolean;
  data?: {
    revenue: number;
    expenses: number;
    profit: number;
    confidence: number;
    summary: string;
  };
  error?: string;
  processingTime: number;
}

const PythonExcelProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    setResults([]);
  };

  const processWithPython = async () => {
    if (!uploadedFile || !user) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // Convert file to base64
      const fileData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(uploadedFile);
      });

      const { data, error } = await supabase.functions.invoke('python-excel-processor', {
        body: {
          fileData: fileData.split(',')[1], // Remove data:... prefix
          fileName: uploadedFile.name,
          userId: user.id
        }
      });

      const processingTime = Date.now() - startTime;

      if (error) throw error;

      setResults(prev => [...prev, {
        method: 'python',
        success: true,
        data: data,
        processingTime
      }]);

      toast({
        title: "Python Processing Complete",
        description: `Processed in ${processingTime}ms with ${data.confidence}% confidence`
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      setResults(prev => [...prev, {
        method: 'python',
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
        processingTime
      }]);

      toast({
        title: "Python Processing Failed",
        description: "Falling back to traditional processing method",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Python Excel Processor
          <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded">
            Beta Test
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-3">
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="python-excel-upload"
            />
            <label htmlFor="python-excel-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Upload Excel file for Python processing
              </p>
            </label>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="truncate">{uploadedFile.name}</span>
            </div>
          )}
        </div>

        {/* Process Button */}
        <Button 
          onClick={processWithPython}
          disabled={!uploadedFile || isProcessing}
          className="w-full"
          variant="default"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing with Python...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Process with Python
            </>
          )}
        </Button>

        {/* Results Comparison */}
        {results.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="font-medium text-sm">Processing Results</h4>
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium text-sm capitalize">
                      {result.method} Processing
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {result.processingTime}ms
                  </span>
                </div>

                {result.success && result.data ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Revenue:</span>
                        <div className="font-medium">{formatCurrency(result.data.revenue)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expenses:</span>
                        <div className="font-medium">{formatCurrency(result.data.expenses)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Profit:</span>
                        <div className="font-medium">{formatCurrency(result.data.profit)}</div>
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="ml-1 font-medium">{result.data.confidence}%</span>
                    </div>
                    {result.data.summary && (
                      <p className="text-xs text-muted-foreground">{result.data.summary}</p>
                    )}
                  </div>
                ) : result.error ? (
                  <p className="text-xs text-red-500">{result.error}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PythonExcelProcessor;