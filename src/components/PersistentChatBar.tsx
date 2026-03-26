import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUp } from 'lucide-react';

interface PersistentChatBarProps {
  onSubmit: (text: string) => void;
  darkMode: boolean;
}

export function PersistentChatBar({ onSubmit, darkMode }: PersistentChatBarProps) {
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
      {/* Fade gradient above */}
      <div
        className="h-16 pointer-events-none"
        style={{
          background: darkMode
            ? 'linear-gradient(to bottom, transparent, #0a0a0a)'
            : 'linear-gradient(to bottom, transparent, white)',
        }}
      />
      <div className={`px-4 md:px-6 pb-4 md:pb-6 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className="max-w-2xl mx-auto">
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${
              darkMode
                ? 'bg-[#1a1a1a] border-[#2a2a2a] shadow-lg'
                : 'bg-white border-zinc-200 shadow-xl'
            }`}
          >
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 rounded-full flex-shrink-0 ${
                darkMode
                  ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Plus className="w-4 h-4" />
            </Button>

            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className={`flex-1 bg-transparent border-0 outline-none text-sm font-sans ${
                darkMode
                  ? 'text-white placeholder:text-zinc-500'
                  : 'text-zinc-900 placeholder:text-zinc-400'
              }`}
            />

            <Button
              onClick={handleSubmit}
              disabled={!text.trim()}
              size="sm"
              className={`h-8 w-8 p-0 rounded-full flex-shrink-0 disabled:opacity-30 border-0 ${
                darkMode
                  ? 'bg-[#2a2a2a] hover:bg-[#333] text-zinc-400'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
