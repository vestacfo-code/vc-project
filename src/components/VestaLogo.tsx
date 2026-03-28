import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VestaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { icon: 'w-4 h-4', text: 'text-lg', gap: 'gap-2' },
  md: { icon: 'w-5 h-5', text: 'text-xl', gap: 'gap-2.5' },
  lg: { icon: 'w-7 h-7', text: 'text-3xl', gap: 'gap-3' },
};

export const VestaLogo = ({ size = 'md', className }: VestaLogoProps) => {
  const s = sizeMap[size];
  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <div className="relative">
        <Building2 className={cn(s.icon, 'text-amber-400')} strokeWidth={1.5} />
      </div>
      <span className={cn('font-serif font-normal tracking-wide text-amber-400', s.text)}>
        Vesta
      </span>
    </div>
  );
};

export default VestaLogo;
