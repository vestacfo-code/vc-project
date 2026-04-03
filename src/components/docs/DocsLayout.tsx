import { Link, useLocation } from "react-router-dom";
import { 
  Sparkles, ChevronDown, ChevronRight, 
  ArrowLeft, Menu
} from "lucide-react";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import NextPageLink from "./NextPageLink";
import DocsSupportChat from "./DocsSupportChat";
import Header from "@/components/shared/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { VestaLogo } from "@/components/VestaLogo";

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
      { title: "Data & PMS connections", href: "/docs/connect" },
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
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-xs uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors">
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
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{item.title}</span>
                {item.badge && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
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
    <div className="min-h-screen bg-vesta-cream text-slate-900">
      {/* Global Header */}
      <div className="border-b border-slate-200 bg-white">
        <Header variant="light" />
      </div>

      {/* Docs Sub-header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="-ml-2 p-2 text-slate-600 transition-colors hover:text-slate-900 lg:hidden">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-r border-slate-200 bg-white p-0">
                <div className="border-b border-slate-200 p-4">
                  <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                    <VestaLogo size="sm" tone="light" />
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
              <span className="text-sm font-medium text-slate-700">Documentation</span>
            </Link>
          </div>

          <button 
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar - Desktop only */}
        <aside className="fixed hidden h-[calc(100vh-65px)] w-60 overflow-y-auto border-r border-slate-200 bg-white lg:block">
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
                className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Documentation
              </Link>
            )}

            {/* Page Title */}
            <h1 className="mb-4 font-serif text-4xl font-normal text-slate-900 md:text-5xl">
              {title}
            </h1>
            
            {description && (
              <p className="mb-8 text-lg text-slate-600">{description}</p>
            )}

            {/* Page Content */}
            <div className="prose prose-slate max-w-none">
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
          <aside className="fixed right-0 hidden h-[calc(100vh-65px)] w-52 overflow-y-auto border-l border-slate-200 bg-white xl:block">
            <div className="p-6">
              <h4 className="mb-4 text-xs uppercase tracking-wider text-slate-500">On this page</h4>
              <ul className="space-y-2">
                {tableOfContents.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-sm text-slate-600 transition-colors hover:text-slate-900"
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

      <SiteFooter variant="light" className="border-t border-slate-200 lg:ml-60" />

      {/* AI Support Chat */}
      <DocsSupportChat isOpen={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default DocsLayout;
