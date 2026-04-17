import type { ReactNode } from 'react';
import Header from '@/components/shared/Header';
import { MarketingFooter } from './MarketingFooter';

interface MarketingPageShellProps {
  children: ReactNode;
}

export function MarketingPageShell({ children }: MarketingPageShellProps) {
  return (
    <div className="min-h-screen bg-vesta-cream text-vesta-navy flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
