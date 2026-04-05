import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { extractTextFromPDF } from '@/lib/pdfExtractor';

interface FileUploadButtonProps {
  onFileUploaded: (fileName: string, fileUrl: string, documentId?: string, fileType?: string, extractedContent?: string) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  disabled?: boolean;
  conversationId?: string;
}

// Extract text content from a file client-side so the AI can read it
const extractFileContent = async (file: File): Promise<string | undefined> => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const type = file.type;

  // PDF extraction using pdfjs-dist (client-side)
  if (ext === 'pdf' || type === 'application/pdf') {
    try {
      const text = await extractTextFromPDF(file);
      if (text && text.trim().length > 0) {
        return text.length > 100_000 ? text.slice(0, 100_000) + '\n\n[... truncated — file too large to display in full]' : text;
      }
    } catch (e) {
      console.warn('PDF text extraction failed:', e);
    }
    return undefined;
  }

  // Plain text / code / data files — read as text
  const textExtensions = [
    'txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml', 'toml',
    'html', 'htm', 'css', 'js', 'ts', 'tsx', 'jsx', 'py', 'rb',
    'java', 'c', 'cpp', 'h', 'go', 'rs', 'sql', 'sh', 'bat',
    'log', 'env', 'ini', 'cfg', 'conf', 'svg', 'r', 'php',
    'swift', 'kt', 'scala', 'pl', 'lua', 'dart', 'vue', 'svelte',
    'gitignore', 'dockerfile', 'makefile', 'readme',
    'ofx', 'qfx', 'qif', 'qbo', 'iif', // financial formats (XML-based or text)
  ];

  if (textExtensions.includes(ext) || type.startsWith('text/') || type === 'application/json' || type === 'application/xml') {
    try {
      const text = await file.text();
      return text.length > 100_000 ? text.slice(0, 100_000) + '\n\n[... truncated — file too large to display in full]' : text;
    } catch {
      return undefined;
    }
  }

  return undefined;
};

export const FileUploadButton = ({ 
  onFileUploaded, 
  isUploading, 
  setIsUploading,
  disabled,
  conversationId
}: FileUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Extract text content client-side (for text-based files)
      const extractedContent = await extractFileContent(file);

      // Upload to Supabase Storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filePath);

      // Create document record — store extracted content as markdown_content
      const { data: documentData, error: docError } = await supabase.from('documents').insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        storage_path: filePath,
        processing_status: extractedContent ? 'completed' : 'pending',
        markdown_content: extractedContent || null,
      }).select().single();

      if (docError) throw docError;

      toast({
        title: "Document attached",
        description: `${file.name} is ready for analysis`,
      });

      // Pass filename, storage URL, document ID, file type, and extracted content to chat
      onFileUploaded(file.name, publicUrl, documentData?.id, file.type, extractedContent);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="h-8 w-8 rounded-full bg-vesta-navy-muted/30 hover:bg-vesta-navy-muted/25 text-white border-0"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </>
  );
};
