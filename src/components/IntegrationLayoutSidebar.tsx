// Stub: legacy integrations sidebar layout

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
