import type { ReactNode } from 'react';
import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';

interface MarketingPageShellProps {
  children: ReactNode;
}

export function MarketingPageShell({ children }: MarketingPageShellProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <MarketingNav />
      <main className="flex-1 pt-14 sm:pt-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}
