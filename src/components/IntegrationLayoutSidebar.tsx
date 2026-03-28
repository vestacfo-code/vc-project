// Stub: Legacy Finlo accounting sidebar — replaced in Phase 2

interface IntegrationLayoutSidebarProps {
  onNewChat: () => void;
  onSelectSession?: (sessionId: string) => void;
  currentSessionId?: string;
  onViewDashboard: () => void;
  currentView: 'chat' | 'dashboard' | 'pricing' | 'search' | 'market-trends';
}

const IntegrationLayoutSidebar = (_props: IntegrationLayoutSidebarProps) => {
  return null;
};

export default IntegrationLayoutSidebar;
