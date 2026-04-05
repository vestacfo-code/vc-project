import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { preprocessMath } from '@/utils/mathPreprocessor';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  showCursor?: boolean;
  isStreaming?: boolean;
}

export const TypewriterText = ({ 
  text, 
  isStreaming = false 
}: TypewriterTextProps) => {
  // Preprocess math notation to ensure KaTeX compatibility
  const processedText = preprocessMath(text);
  
  return (
    <div className="relative">
      <div className="prose prose-sm prose-neutral max-w-none [&>*:last-child]:mb-0">
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-bold mb-1 mt-2 first:mt-0">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="mb-0.5">{children}</li>,
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              return isInline ? (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              ) : (
                <code className={`block bg-muted p-3 rounded text-sm font-mono overflow-x-auto my-2 ${className || ''}`} {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <pre className="bg-muted p-3 rounded overflow-x-auto my-2">{children}</pre>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2">{children}</blockquote>
            ),
            hr: () => <hr className="my-4 border-border" />,
            a: ({ href, children }) => (
              <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full border-collapse border border-border">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">{children}</th>
            ),
            td: ({ children }) => (
              <td className="border border-border px-3 py-2">{children}</td>
            ),
          }}
        >
          {processedText}
        </ReactMarkdown>
      </div>
      {isStreaming && (
        <span 
          className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom"
          aria-label="Generating response"
        />
      )}
    </div>
  );
};
