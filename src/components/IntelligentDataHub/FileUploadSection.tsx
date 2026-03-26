import { Upload, CheckCircle, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadProps } from './types';

const FileUploadSection = ({ 
  isUploading, 
  isAnalyzing, 
  uploadSuccess, 
  onFileUpload, 
  onTriggerAnalysis 
}: FileUploadProps) => {
  return (
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
              {uploadSuccess ? "Data Uploaded Successfully!" : "Upload Financial Data"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
              {uploadSuccess 
                ? "Your data has been processed and your AI mind is learning from it"
                : "Upload your financial documents to train your personal AI CFO"
              }
            </p>
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
              onChange={onFileUpload}
              disabled={isUploading || isAnalyzing}
              className="hidden"
              id="financial-upload"
            />
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <label htmlFor="financial-upload">
                <Button 
                  asChild 
                  disabled={isUploading || isAnalyzing} 
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
              {uploadSuccess && (
                <Button 
                  onClick={onTriggerAnalysis} 
                  disabled={isAnalyzing}
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 rounded-xl border-2 border-primary/40 hover:border-primary/60 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 transition-all duration-300 backdrop-blur-sm"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5 mr-2" />
                      Run AI Analysis
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadSection;