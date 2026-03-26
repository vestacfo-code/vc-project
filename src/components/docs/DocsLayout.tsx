import { Link, useLocation } from "react-router-dom";
import { 
  Sparkles, ChevronDown, ChevronRight, 
  ArrowLeft, Menu, Mail
} from "lucide-react";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import finloLogo from "@/assets/finlo-logo-white-text.png";
import NextPageLink from "./NextPageLink";
import DocsSupportChat from "./DocsSupportChat";
import Header from "@/components/shared/Header";

interface TableOfContentsItem {
  title: string;
  href: string;
}

interface NextPageInfo {
  href: string;
  title: string;
}

interface DocsLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  tableOfContents?: TableOfContentsItem[];
  nextPage?: NextPageInfo;
}

interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navigation: NavSection[] = [
  {
    title: "Documentation",
    defaultOpen: true,
    items: [
      { title: "API Reference", href: "/docs/api", badge: "Soon" },
      { title: "Webhook Events", href: "/docs/webhooks", badge: "Soon" },
      { title: "Knowledge Base", href: "/docs/knowledge" },
    ],
  },
  {
    title: "Getting Started",
    defaultOpen: true,
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Account Setup", href: "/docs/getting-started/setup" },
      { title: "Quick Tour", href: "/docs/getting-started/tour" },
    ],
  },
  {
    title: "Quickstart",
    defaultOpen: true,
    items: [
      { title: "Integrations", href: "/docs/connect" },
      { title: "Connect QuickBooks", href: "/docs/connect/quickbooks" },
      { title: "Connect Xero", href: "/docs/connect/xero" },
      { title: "Connect Wave", href: "/docs/connect/wave" },
      { title: "Connect Zoho", href: "/docs/connect/zoho" },
      { title: "Upload CSV Data", href: "/docs/connect/csv" },
      { title: "Manual Data Entry", href: "/docs/connect/manual" },
    ],
  },
  {
    title: "Features",
    defaultOpen: false,
    items: [
      { title: "AI Financial Chat", href: "/docs/features/ai-chat" },
      { title: "Dashboard Analytics", href: "/docs/features/analytics" },
      { title: "Automated Reports", href: "/docs/features/reports" },
      { title: "Cash Flow Forecasting", href: "/docs/features/cashflow" },
      { title: "Expense Analysis", href: "/docs/features/expenses" },
    ],
  },
  {
    title: "Learn",
    defaultOpen: false,
    items: [
      { title: "Understanding Your Data", href: "/docs/learn/data" },
      { title: "Best Practices", href: "/docs/learn/practices" },
      { title: "FAQ", href: "/docs/learn/faq" },
    ],
  },
];

const SidebarNavSection = ({ section, currentPath, onLinkClick }: { section: NavSection; currentPath: string; onLinkClick?: () => void }) => {
  const isActiveSection = section.items.some(item => item.href === currentPath);
  const [isOpen, setIsOpen] = useState(section.defaultOpen || isActiveSection);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-xs uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">
        <span>{section.title}</span>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="space-y-1 pb-4">
          {section.items.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={onLinkClick}
                className={`flex items-center justify-between px-3 py-1.5 text-sm rounded-md transition-all ${
                  currentPath === item.href
                    ? "bg-[#7ba3e8]/10 text-[#7ba3e8] border-l-2 border-[#7ba3e8] -ml-[2px]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.title}</span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};

const DocsLayout = ({ children, title, description, tableOfContents = [], nextPage }: DocsLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPath]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Global Header */}
      <div className="border-b border-white/10 bg-[#0a0a0a]">
        <Header variant="dark" />
      </div>

      {/* Docs Sub-header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-[#0a0a0a] border-r border-white/10 p-0">
                <div className="p-4 border-b border-white/10">
                  <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                    <img src={finloLogo} alt="Finlo" className="h-6" />
                  </Link>
                </div>
                <ScrollArea className="h-[calc(100vh-65px)]">
                  <nav className="p-4">
                    {navigation.map((section) => (
                      <SidebarNavSection 
                        key={section.title} 
                        section={section} 
                        currentPath={currentPath}
                        onLinkClick={() => setMobileMenuOpen(false)}
                      />
                    ))}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Link to="/docs" className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">Documentation</span>
            </Link>
          </div>

          <button 
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar - Desktop only */}
        <aside className="hidden lg:block w-60 border-r border-white/10 bg-[#0a0a0a] fixed h-[calc(100vh-65px)] overflow-y-auto">
          <ScrollArea className="h-full">
            <nav className="p-4">
              {navigation.map((section) => (
                <SidebarNavSection key={section.title} section={section} currentPath={currentPath} />
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-60 xl:mr-52">
          <div className="max-w-3xl mx-auto px-6 py-12">
            {/* Back link for sub-pages */}
            {currentPath !== "/docs" && (
              <Link 
                to="/docs" 
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Documentation
              </Link>
            )}

            {/* Page Title */}
            <h1 className="font-serif text-4xl md:text-5xl font-normal text-white mb-4">
              {title}
            </h1>
            
            {description && (
              <p className="text-lg text-slate-400 mb-8">{description}</p>
            )}

            {/* Page Content */}
            <div className="prose prose-invert prose-slate max-w-none">
              {children}
            </div>

            {/* Next Page Navigation */}
            {nextPage && (
              <NextPageLink href={nextPage.href} title={nextPage.title} />
            )}
          </div>
        </main>

        {/* Right Sidebar - Table of Contents */}
        {tableOfContents.length > 0 && (
          <aside className="hidden xl:block w-52 fixed right-0 h-[calc(100vh-65px)] overflow-y-auto border-l border-white/10">
            <div className="p-6">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4">On this page</h4>
              <ul className="space-y-2">
                {tableOfContents.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="lg:ml-60 border-t border-white/10 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© 2025 Finlo. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a href="mailto:support@joinfinlo.ai" className="hover:text-white transition-colors flex items-center gap-1">
              <Mail className="h-3 w-3" />
              support@joinfinlo.ai
            </a>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

      {/* AI Support Chat */}
      <DocsSupportChat isOpen={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default DocsLayout;
