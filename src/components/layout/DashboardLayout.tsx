import React from 'react';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main content area */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: '#F7F4EE' }}
      >
        {children}
      </main>
    </div>
  );
};
