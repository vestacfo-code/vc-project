import type { ReactNode } from 'react';
import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';

interface MarketingPageShellProps {
  children: ReactNode;
}

export function MarketingPageShell({ children }: MarketingPageShellProps) {
  return (
    <div className="min-h-screen bg-vesta-cream text-vesta-navy flex flex-col">
      <MarketingNav />
      <main className="flex-1 pt-[5.25rem] sm:pt-24">{children}</main>
      <MarketingFooter />
    </div>
  );
}
