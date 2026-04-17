import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  Book,
  FileText,
  Zap,
  BarChart3,
  Upload,
  MessageSquare,
  Settings,
  HelpCircle,
  ExternalLink,
  Database,
  Webhook,
  BookOpen,
  Rocket,
  PlayCircle,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  Users,
  Shield,
  Menu
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NextPageLink from "@/components/docs/NextPageLink";
import DocsSupportChat from "@/components/docs/DocsSupportChat";
import Header from "@/components/shared/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { VestaLogo } from "@/components/VestaLogo";

interface NavSection {
  title: string;
  items: {
    title: string;
    href: string;
    icon?: React.ReactNode;
    badge?: string;
  }[];
  defaultOpen?: boolean;
}

const navigation: NavSection[] = [
  {
    title: "Documentation",
    defaultOpen: true,
    items: [
      { title: "API Reference", href: "/docs/api", icon: <Database className="w-4 h-4" />, badge: "Soon" },
      { title: "Webhook Events", href: "/docs/webhooks", icon: <Webhook className="w-4 h-4" />, badge: "Soon" },
      { title: "Knowledge Base", href: "/docs/knowledge", icon: <BookOpen className="w-4 h-4" /> },
    ],
  },
  {
    title: "Getting Started",
    defaultOpen: true,
    items: [
      { title: "Introduction", href: "/docs", icon: <Book className="w-4 h-4" /> },
      { title: "Account Setup", href: "/docs/getting-started/setup", icon: <Settings className="w-4 h-4" /> },
      { title: "Quick Tour", href: "/docs/getting-started/tour", icon: <PlayCircle className="w-4 h-4" /> },
    ],
  },
  {
    title: "Quickstart",
    defaultOpen: true,
    items: [
      { title: "Connect Mews PMS", href: "/integrations", icon: <Zap className="w-4 h-4" /> },
      { title: "Connect QuickBooks", href: "/docs/connect/quickbooks", icon: <Zap className="w-4 h-4" /> },
      { title: "Upload CSV Data", href: "/docs/connect/csv", icon: <Upload className="w-4 h-4" /> },
      { title: "Manual Data Entry", href: "/docs/connect/manual", icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    title: "Features",
    defaultOpen: false,
    items: [
      { title: "AI Financial Chat", href: "/docs/features/ai-chat", icon: <MessageSquare className="w-4 h-4" /> },
      { title: "Dashboard Analytics", href: "/docs/features/analytics", icon: <BarChart3 className="w-4 h-4" /> },
      { title: "Cash Flow Forecasting", href: "/docs/features/cashflow", icon: <TrendingUp className="w-4 h-4" /> },
      { title: "AR Intelligence", href: "/docs/features/ar-intelligence", icon: <Users className="w-4 h-4" /> },
      { title: "Expense Intelligence", href: "/docs/features/expense-intelligence", icon: <PieChart className="w-4 h-4" /> },
      { title: "Customer Profitability", href: "/docs/features/customer-profitability", icon: <TrendingUp className="w-4 h-4" /> },
      { title: "Top Customers", href: "/docs/features/top-customers", icon: <BarChart3 className="w-4 h-4" /> },
      { title: "Expense Distribution", href: "/docs/features/expense-distribution", icon: <PieChart className="w-4 h-4" /> },
      { title: "Automated Reports", href: "/docs/features/reports", icon: <FileSpreadsheet className="w-4 h-4" /> },
      { title: "Expense Analysis", href: "/docs/features/expenses", icon: <PieChart className="w-4 h-4" /> },
    ],
  },
  {
    title: "Learn",
    defaultOpen: false,
    items: [
      { title: "Understanding Your Data", href: "/docs/learn/data", icon: <BookOpen className="w-4 h-4" /> },
      { title: "Best Practices", href: "/docs/learn/practices", icon: <Shield className="w-4 h-4" /> },
      { title: "FAQ", href: "/docs/learn/faq", icon: <HelpCircle className="w-4 h-4" /> },
    ],
  },
];

const quickstartCards = [
  {
    title: "Connect Mews PMS",
    description: "Sync daily hotel metrics automatically",
    icon: <Zap className="w-5 h-5" />,
    href: "/integrations",
  },
  {
    title: "Connect QuickBooks",
    description: "Sync expenses and P&L in 2 minutes",
    icon: <Zap className="w-5 h-5" />,
    href: "/docs/connect/quickbooks",
  },
  {
    title: "Upload CSV Data",
    description: "Import spreadsheets and CSV files",
    icon: <Upload className="w-5 h-5" />,
    href: "/docs/connect/csv",
  },
  {
    title: "Ask AI Questions",
    description: "Get instant answers about your finances",
    icon: <MessageSquare className="w-5 h-5" />,
    href: "/docs/features/ai-chat",
  },
  {
    title: "Set Up Reports",
    description: "Automate weekly financial reports",
    icon: <FileSpreadsheet className="w-5 h-5" />,
    href: "/docs/features/reports",
  },
  {
    title: "Explore Analytics",
    description: "Visualize your financial data",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/docs/features/analytics",
  },
];

const tableOfContents = [
  { title: "Overview", href: "#overview" },
  { title: "Quickstart", href: "#quickstart" },
  { title: "What you can do", href: "#capabilities" },
  { title: "Next steps", href: "#next-steps" },
];

const SidebarNavSection = ({ section, onLinkClick }: { section: NavSection; onLinkClick?: () => void }) => {
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-xs font-semibold uppercase tracking-wider text-vesta-navy/65 hover:text-vesta-navy transition-colors">
        {section.title}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="space-y-1 pb-4">
          {section.items.map((item) => (
            <li key={item.title}>
              <Link
                to={item.href}
                onClick={onLinkClick}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-vesta-navy/80 transition-colors hover:bg-vesta-mist/40 hover:text-vesta-navy"
              >
                {item.icon && <span className="text-vesta-navy/65 group-hover:text-vesta-navy-muted">{item.icon}</span>}
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className="rounded bg-vesta-mist/40 px-1.5 py-0.5 text-[10px] text-vesta-navy/80">
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

const Docs = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-vesta-cream text-vesta-navy">
      {/* Global Header */}
      <div className="border-b border-vesta-navy/10 bg-white">
        <Header variant="light" />
      </div>

      {/* Docs Sub-header */}
      <header className="sticky top-0 z-40 border-b border-vesta-navy/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="-ml-2 p-2 text-vesta-navy/80 transition-colors hover:text-vesta-navy lg:hidden">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-r border-vesta-navy/10 bg-white p-0">
                <div className="border-b border-vesta-navy/10 p-4">
                  <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                    <VestaLogo size="sm" tone="light" />
                  </Link>
                </div>
                <ScrollArea className="h-[calc(100vh-65px)]">
                  <nav className="p-4 space-y-2">
                    {navigation.map((section) => (
                      <SidebarNavSection 
                        key={section.title} 
                        section={section} 
                        onLinkClick={() => setMobileMenuOpen(false)}
                      />
                    ))}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Link to="/docs" className="flex items-center gap-2">
              <span className="text-sm font-medium text-vesta-navy/90">Documentation</span>
            </Link>
          </div>

          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 text-sm text-vesta-navy/80 transition-colors hover:text-vesta-navy"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </header>

      <div className="flex max-w-[1600px] mx-auto">
        {/* Left Sidebar */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-60 border-r border-vesta-navy/10 bg-white lg:block">
          <ScrollArea className="h-full py-6 px-4">
            <nav className="space-y-2">
              {navigation.map((section) => (
                <SidebarNavSection key={section.title} section={section} />
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-vesta-navy/65 mb-8">
              <span>Documentation</span>
            </div>

            {/* Title */}
            <div className="flex items-center gap-3 mb-6">
              <h1 className="font-serif text-4xl font-normal text-vesta-navy md:text-5xl">
                Introduction
              </h1>
            </div>

            {/* Overview Section */}
            <section id="overview" className="mb-16">
              <p className="mb-8 text-lg leading-relaxed text-vesta-navy/80">
                Vesta is the AI-powered financial intelligence platform that transforms complex 
                financial data into clear, actionable insights. Get CFO-level analysis without 
                hiring a CFO.
              </p>

              <div className="p-6 bg-gradient-to-br from-vesta-navy-muted/10 to-transparent border border-vesta-navy-muted/20 rounded-xl mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-vesta-navy-muted/20 rounded-lg">
                    <Rocket className="w-5 h-5 text-vesta-navy-muted" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-vesta-navy">New to Vesta?</h3>
                    <p className="text-sm text-vesta-navy/80">
                      Start with our{" "}
                      <Link to="/docs/getting-started/setup" className="text-vesta-navy-muted hover:underline">
                        Quickstart guide
                      </Link>{" "}
                      to connect your first data source and ask your first question.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Quickstart Section */}
            <section id="quickstart" className="mb-16">
              <h2 className="mb-6 text-2xl font-semibold text-vesta-navy">Quickstart</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickstartCards.map((card) => (
                  <Link
                    key={card.title}
                    to={card.href}
                    className="group rounded-xl border border-vesta-navy/10 bg-white p-5 transition-all hover:border-vesta-navy/15 hover:bg-vesta-mist/25"
                  >
                    <div className="flex items-start justify-between">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="text-vesta-navy/65 transition-colors group-hover:text-vesta-navy-muted">
                          {card.icon}
                        </span>
                        <h3 className="font-medium text-vesta-navy">{card.title}</h3>
                      </div>
                      <ChevronRight className="h-4 w-4 text-vesta-navy-muted transition-all group-hover:translate-x-0.5 group-hover:text-vesta-navy" />
                    </div>
                    <p className="text-sm text-vesta-navy/65">{card.description}</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Capabilities Section */}
            <section id="capabilities" className="mb-16">
              <h2 className="mb-6 text-2xl font-semibold text-vesta-navy">What you can do</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-vesta-navy">Connect your PMS and accounting software</h4>
                    <p className="text-sm text-vesta-navy/80">Mews PMS and QuickBooks Online — sync daily metrics and expenses automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-vesta-navy">Upload CSV exports from any PMS</h4>
                    <p className="text-sm text-vesta-navy/80">Daily metrics, expenses, and channel revenue from any system</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-vesta-navy">Ask hotel-specific questions</h4>
                    <p className="text-sm text-vesta-navy/80">"Why did RevPAR drop this week?" — Vesta explains in plain English</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-vesta-navy">Get daily AI briefings</h4>
                    <p className="text-sm text-vesta-navy/80">Morning summaries with RevPAR, ADR, GOPPAR, and anomaly flags</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-vesta-navy">Track budget vs actuals</h4>
                    <p className="text-sm text-vesta-navy/80">Set monthly targets and see variance in real-time across all KPIs</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Next Steps Section */}
            <section id="next-steps" className="mb-16">
              <h2 className="mb-6 text-2xl font-semibold text-vesta-navy">Next steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/docs/getting-started/setup"
                  className="group flex items-center gap-4 rounded-xl border border-vesta-navy/10 bg-white p-4 transition-all hover:border-vesta-navy/15"
                >
                  <div className="rounded-lg bg-vesta-mist/40 p-2 transition-colors group-hover:bg-vesta-mist/50">
                    <Users className="h-5 w-5 text-vesta-navy/80" />
                  </div>
                  <div>
                    <h3 className="font-medium text-vesta-navy">Set up your account</h3>
                    <p className="text-sm text-vesta-navy/65">Configure your business profile</p>
                  </div>
                </Link>
                <Link
                  to="/docs/getting-started/tour"
                  className="group flex items-center gap-4 rounded-xl border border-vesta-navy/10 bg-white p-4 transition-all hover:border-vesta-navy/15"
                >
                  <div className="rounded-lg bg-vesta-mist/40 p-2 transition-colors group-hover:bg-vesta-mist/50">
                    <PlayCircle className="h-5 w-5 text-vesta-navy/80" />
                  </div>
                  <div>
                    <h3 className="font-medium text-vesta-navy">Take the quick tour</h3>
                    <p className="text-sm text-vesta-navy/65">Learn the basics in 5 minutes</p>
                  </div>
                </Link>
              </div>
            </section>

            {/* Help Banner */}
            <section className="rounded-xl border border-vesta-navy/10 bg-white p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-vesta-mist/40 p-2">
                    <HelpCircle className="h-5 w-5 text-vesta-navy/80" />
                  </div>
                  <div>
                    <h3 className="font-medium text-vesta-navy">Need help?</h3>
                    <p className="text-sm text-vesta-navy/65">Email us at vestacfo@gmail.com</p>
                  </div>
                </div>
                <a
                  href="mailto:vestacfo@gmail.com"
                  className="flex items-center gap-2 rounded-lg border border-vesta-navy/10 px-4 py-2 text-sm text-vesta-navy/80 transition-all hover:bg-vesta-mist/25 hover:text-vesta-navy"
                >
                  Contact Support
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </section>

            {/* Next Page Navigation */}
            <NextPageLink href="/docs/getting-started/setup" title="Account Setup" />
          </div>
        </main>

        {/* Right Sidebar - Table of Contents */}
        <aside className="hidden xl:block w-52 sticky top-[57px] h-[calc(100vh-57px)]">
          <div className="py-12 px-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-vesta-navy/65 mb-4">
              On this page
            </h4>
            <ul className="space-y-2">
              {tableOfContents.map((item) => (
                <li key={item.title}>
                  <a
                    href={item.href}
                    className="text-sm text-vesta-navy/80 transition-colors hover:text-vesta-navy"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="mt-24">
        <SiteFooter variant="light" />
      </div>

      {/* AI Support Chat */}
      <DocsSupportChat isOpen={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default Docs;
