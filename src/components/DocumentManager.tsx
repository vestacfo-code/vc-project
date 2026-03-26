import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Calendar, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  processing_status: string;
  upload_date: string;
  records_extracted: number;
  storage_path: string;
  metadata: any;
}

interface DocumentManagerProps {
  onAnalysisView?: (documentId: string) => void;
}

const DocumentManager = ({ onAnalysisView }: DocumentManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error loading documents",
        description: "Failed to load your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: UserDocument) => {
    if (!document.storage_path) {
      toast({
        title: "Download not available",
        description: "This document is not available for download.",
        variant: "destructive",
      });
      return;
    }

    setDownloadingId(document.id);

    try {
      const { data, error } = await supabase.storage
        .from('user-documents')
        .download(document.storage_path);

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: document.file_type });
      const url = URL.createObjectURL(blob);
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
      // Delete linked financial data first
      await supabase
        .from('financial_data')
        .delete()
        .eq('document_id', documentId)
        .eq('user_id', user?.id);

      // Then delete the document
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast({
        title: "Document deleted",
        description: "The document and its related financial records have been removed.",
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('csv') || fileType.includes('excel')) return '📊';
    if (fileType.includes('pdf')) return '📋';
    if (fileType.includes('word')) return '📄';
    return '📎';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading documents...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6 text-primary" />
          <CardTitle>Document Library</CardTitle>
        </div>
        <CardDescription>
          Manage your uploaded financial documents and view AI analysis results
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents uploaded</h3>
            <p className="text-muted-foreground">Upload your first financial document to get started with AI analysis.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getFileIcon(document.file_type)}</div>
                  <div className="space-y-1">
                    <h4 className="font-medium">{document.file_name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(document.upload_date).toLocaleDateString()}</span>
                      </div>
                      <span>•</span>
                      <span>{formatFileSize(document.file_size || 0)}</span>
                      {document.records_extracted && (
                        <>
                          <span>•</span>
                          <span>{document.records_extracted} records</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge variant={getStatusColor(document.processing_status) as any}>
                    {document.processing_status}
                  </Badge>
                  
                  <div className="flex items-center space-x-2">
                    {document.processing_status === 'completed' && onAnalysisView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAnalysisView(document.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Analysis
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      disabled={downloadingId === document.id || !document.storage_path}
                    >
                      {downloadingId === document.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentManager;