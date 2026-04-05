import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUp } from 'lucide-react';

interface PersistentChatBarProps {
  onSubmit: (text: string) => void;
  /** Ignored — app is light-only; kept for call-site compatibility. */
  darkMode?: boolean;
}

export function PersistentChatBar({ onSubmit }: PersistentChatBarProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      <div
        className="pointer-events-none h-16"
        style={{
          background: 'linear-gradient(to bottom, transparent, white)',
        }}
      />
      <div className="bg-white px-4 pb-4 md:px-6 md:pb-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 rounded-2xl border border-vesta-navy/10 bg-white px-4 py-3 shadow-xl transition-all duration-200">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 flex-shrink-0 rounded-full p-0 text-vesta-navy-muted hover:bg-vesta-mist/40 hover:text-vesta-navy/80"
            >
              <Plus className="h-4 w-4" />
            </Button>

            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 border-0 bg-transparent font-sans text-sm text-vesta-navy outline-none placeholder:text-vesta-navy-muted"
            />

            <Button
              onClick={handleSubmit}
              disabled={!text.trim()}
              size="sm"
              className="h-8 w-8 flex-shrink-0 rounded-full border-0 bg-vesta-navy p-0 text-white hover:bg-vesta-navy-muted/30 disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
