import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      { title: "Connect QuickBooks", href: "/docs/connect/quickbooks", icon: <Zap className="w-4 h-4" /> },
      { title: "Connect Xero", href: "/docs/connect/xero", icon: <Zap className="w-4 h-4" /> },
      { title: "Connect Wave", href: "/docs/connect/wave", icon: <Zap className="w-4 h-4" /> },
      { title: "Connect Zoho", href: "/docs/connect/zoho", icon: <Zap className="w-4 h-4" /> },
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
    title: "Connect QuickBooks",
    description: "Sync your QuickBooks data in 2 minutes",
    icon: <Zap className="w-5 h-5" />,
    href: "/docs/connect/quickbooks",
  },
  {
    title: "Connect Xero",
    description: "Import your Xero accounting data",
    icon: <Zap className="w-5 h-5" />,
    href: "/docs/connect/xero",
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
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors">
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
                className="flex items-center gap-2 py-1.5 px-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors group"
              >
                {item.icon && <span className="text-slate-500 group-hover:text-[#7ba3e8]">{item.icon}</span>}
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
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
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-[#0a0a0a] border-r border-white/10 p-0">
                <div className="p-4 border-b border-white/10">
                  <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                    <img src={finloLogo} alt="Vesta" className="h-6" />
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
              <span className="text-sm font-medium text-slate-300">Documentation</span>
            </Link>
          </div>

          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </header>

      <div className="flex max-w-[1600px] mx-auto">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-60 border-r border-white/10 sticky top-[57px] h-[calc(100vh-57px)]">
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
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
              <span>Documentation</span>
            </div>

            {/* Title */}
            <div className="flex items-center gap-3 mb-6">
              <h1 className="font-serif text-4xl md:text-5xl font-normal text-white">
                Introduction
              </h1>
            </div>

            {/* Overview Section */}
            <section id="overview" className="mb-16">
              <p className="text-lg text-slate-400 leading-relaxed mb-8">
                Vesta is the AI-powered financial intelligence platform that transforms complex 
                financial data into clear, actionable insights. Get CFO-level analysis without 
                hiring a CFO.
              </p>

              <div className="p-6 bg-gradient-to-br from-[#7ba3e8]/10 to-transparent border border-[#7ba3e8]/20 rounded-xl mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#7ba3e8]/20 rounded-lg">
                    <Rocket className="w-5 h-5 text-[#7ba3e8]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">New to Vesta?</h3>
                    <p className="text-sm text-slate-400">
                      Start with our{" "}
                      <Link to="/docs/getting-started/setup" className="text-[#7ba3e8] hover:underline">
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
              <h2 className="text-2xl font-semibold text-white mb-6">Quickstart</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickstartCards.map((card) => (
                  <Link
                    key={card.title}
                    to={card.href}
                    className="group p-5 bg-[#1a1a1a] border border-white/10 rounded-xl hover:border-white/20 hover:bg-[#1f1f1f] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-slate-400 group-hover:text-[#7ba3e8] transition-colors">
                          {card.icon}
                        </span>
                        <h3 className="font-medium text-white">{card.title}</h3>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-sm text-slate-500">{card.description}</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Capabilities Section */}
            <section id="capabilities" className="mb-16">
              <h2 className="text-2xl font-semibold text-white mb-6">What you can do</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Connect your accounting software</h4>
                    <p className="text-sm text-slate-400">QuickBooks, Xero, Wave, or Zoho — sync in minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Upload financial spreadsheets</h4>
                    <p className="text-sm text-slate-400">CSV, Excel, and other common formats supported</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Ask natural language questions</h4>
                    <p className="text-sm text-slate-400">"What's my profit margin this quarter?" — get instant answers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Generate automated reports</h4>
                    <p className="text-sm text-slate-400">Weekly summaries, cash flow forecasts, expense breakdowns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded mt-0.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Visualize trends and patterns</h4>
                    <p className="text-sm text-slate-400">Interactive charts and dashboards that update in real-time</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Next Steps Section */}
            <section id="next-steps" className="mb-16">
              <h2 className="text-2xl font-semibold text-white mb-6">Next steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/docs/getting-started/setup"
                  className="group flex items-center gap-4 p-4 bg-[#1a1a1a] border border-white/10 rounded-xl hover:border-white/20 transition-all"
                >
                  <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Set up your account</h3>
                    <p className="text-sm text-slate-500">Configure your business profile</p>
                  </div>
                </Link>
                <Link
                  to="/docs/getting-started/tour"
                  className="group flex items-center gap-4 p-4 bg-[#1a1a1a] border border-white/10 rounded-xl hover:border-white/20 transition-all"
                >
                  <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                    <PlayCircle className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Take the quick tour</h3>
                    <p className="text-sm text-slate-500">Learn the basics in 5 minutes</p>
                  </div>
                </Link>
              </div>
            </section>

            {/* Help Banner */}
            <section className="p-6 bg-[#1a1a1a] border border-white/10 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <HelpCircle className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Need help?</h3>
                    <p className="text-sm text-slate-500">Email us at support@vesta.ai</p>
                  </div>
                </div>
                <a
                  href="mailto:support@vesta.ai"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              On this page
            </h4>
            <ul className="space-y-2">
              {tableOfContents.map((item) => (
                <li key={item.title}>
                  <a
                    href={item.href}
                    className="text-sm text-slate-500 hover:text-white transition-colors"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-24">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={finloLogo} alt="Vesta" className="h-5" />
              <span className="text-sm text-slate-500">© 2025 Vesta. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/support" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Support Chat */}
      <DocsSupportChat isOpen={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default Docs;
