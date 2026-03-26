import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  fileName?: string;
}

// Helper to detect if URL is from Google Drive or Docs
const isGoogleUrl = (url: string) => {
  return url.includes('docs.google.com') || url.includes('drive.google.com');
};

// Convert Google Drive/Docs URLs to viewer-friendly format
const getGoogleViewerUrl = (url: string) => {
  // If it's already a proper viewer URL, return it
  if (url.includes('/preview') || url.includes('/embed')) {
    return url;
  }
  
  // Extract file ID from various Google URL formats
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
  }
  
  return url;
};

export default function PDFViewer({ url, fileName }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  
  // Use native browser PDF viewer for all PDFs
  const viewerUrl = isGoogleUrl(url) ? getGoogleViewerUrl(url) : url;

  return (
    <div className="space-y-4">
      {fileName && (
        <div className="px-2">
          <p className="text-sm font-medium text-foreground">{fileName}</p>
        </div>
      )}
      <div className="relative w-full bg-background border rounded-lg overflow-hidden" style={{ height: '800px' }}>
        <iframe
          src={viewerUrl}
          className="absolute top-0 left-0 w-full h-full border-0"
          title={fileName || 'Training Document'}
          onLoad={() => setLoading(false)}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
