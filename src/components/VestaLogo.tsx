import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VestaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** `dark` = amber on dark backgrounds (default). `light` = readable on white/light pages. */
  tone?: 'dark' | 'light';
  className?: string;
}

const sizeMap = {
  sm: { icon: 'w-4 h-4', text: 'text-lg', gap: 'gap-2' },
  md: { icon: 'w-5 h-5', text: 'text-xl', gap: 'gap-2.5' },
  lg: { icon: 'w-7 h-7', text: 'text-3xl', gap: 'gap-3' },
};

export const VestaLogo = ({ size = 'md', tone = 'dark', className }: VestaLogoProps) => {
  const s = sizeMap[size];
  const iconClass = tone === 'light' ? 'text-amber-600' : 'text-amber-400';
  const wordClass = tone === 'light' ? 'text-slate-900' : 'text-amber-400';
  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <div className="relative">
        <Building2 className={cn(s.icon, iconClass)} strokeWidth={1.5} />
      </div>
      <span className={cn('font-serif font-normal tracking-wide', wordClass, s.text)}>
        Vesta
      </span>
    </div>
  );
};

export default VestaLogo;
