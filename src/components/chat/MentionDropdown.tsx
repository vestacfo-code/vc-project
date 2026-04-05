import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { DashboardReference } from '@/contexts/DashboardReferenceContext';
import { BarChart3, DollarSign, TrendingUp, Users, Wallet, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MentionDropdownProps {
  query: string;
  references: DashboardReference[];
  onSelect: (ref: DashboardReference) => void;
  position: { top: number; left: number };
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'dollar-sign': <DollarSign className="h-4 w-4" />,
  'bar-chart': <BarChart3 className="h-4 w-4" />,
  'trending-up': <TrendingUp className="h-4 w-4" />,
  'users': <Users className="h-4 w-4" />,
  'wallet': <Wallet className="h-4 w-4" />,
  'alert-triangle': <AlertTriangle className="h-4 w-4" />,
};

export const MentionDropdown = ({ query, references, onSelect, position, onKeyDown }: MentionDropdownProps) => {
  const filtered = references.filter(ref =>
    ref.name.toLowerCase().includes(query.toLowerCase())
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        onSelect(filtered[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onSelect]);

  return (
    <div
      className="fixed bg-white rounded-lg shadow-lg border border-vesta-navy/10 w-80 max-h-64 overflow-hidden z-50"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <Command className="bg-transparent">
        <CommandList>
          {filtered.length === 0 ? (
            <CommandEmpty className="py-6 text-center text-sm text-vesta-navy/65">
              No dashboard components found
            </CommandEmpty>
          ) : (
            <CommandGroup>
              {filtered.map((ref, index) => (
                <CommandItem
                  key={ref.id}
                  value={ref.id}
                  onSelect={() => onSelect(ref)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-vesta-mist/25 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-blue-600">
                    {iconMap[ref.icon || 'bar-chart'] || <BarChart3 className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-vesta-navy">{ref.name}</span>
                    <span className="text-xs text-vesta-navy/65">{ref.type}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
};
