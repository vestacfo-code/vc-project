import { FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PDFViewer from './PDFViewer';
import type { ContentBlock } from './ContentBlockEditor';

interface ContentBlockViewerProps {
  blocks: ContentBlock[];
}

export default function ContentBlockViewer({ blocks }: ContentBlockViewerProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <div key={block.id} className="animate-in fade-in-50">
          {block.type === 'title' && (
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {block.content}
            </h2>
          )}

          {block.type === 'text' && (
            <div 
              className="prose prose-sm sm:prose-base max-w-none text-foreground [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-1"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          )}

          {block.type === 'image' && block.content && (
            <div className="my-6">
              <img
                src={block.content}
                alt={block.metadata?.alt || 'Training image'}
                className="w-full max-w-3xl mx-auto rounded-lg shadow-md"
              />
              {block.metadata?.alt && (
                <p className="text-sm text-muted-foreground text-center mt-2 italic">
                  {block.metadata.alt}
                </p>
              )}
            </div>
          )}

          {block.type === 'document' && block.content && (
            <div className="my-6">
              <PDFViewer 
                url={block.content} 
                fileName={block.metadata?.fileName}
              />
            </div>
          )}

          {block.type === 'embed' && block.content && (
            <div className="my-6">
              <div 
                className="relative w-full aspect-video max-w-4xl mx-auto rounded-lg overflow-hidden shadow-md bg-background [&_iframe]:absolute [&_iframe]:top-0 [&_iframe]:left-0 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
