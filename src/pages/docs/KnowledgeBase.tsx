import DocsLayout from "@/components/docs/DocsLayout";
import { Link } from "react-router-dom";
import { 
  BookOpen, Zap, BarChart3, FileText, HelpCircle, 
  Settings, Users, CreditCard, Shield 
} from "lucide-react";

const categories = [
  {
    title: "Getting Started",
    description: "New to Vesta? Start here.",
    icon: BookOpen,
    links: [
      { title: "Account Setup", href: "/docs/getting-started/setup" },
      { title: "Quick Tour", href: "/docs/getting-started/tour" },
    ]
  },
  {
    title: "Integrations",
    description: "Connect your PMS and accounting software.",
    icon: Zap,
    links: [
      { title: "Mews PMS", href: "/integrations" },
      { title: "QuickBooks", href: "/docs/connect/quickbooks" },
      { title: "CSV Import", href: "/docs/connect/csv" },
    ]
  },
  {
    title: "Data Import",
    description: "Bring in your financial data.",
    icon: FileText,
    links: [
      { title: "Upload CSV", href: "/docs/connect/csv" },
      { title: "Manual Entry", href: "/docs/connect/manual" },
    ]
  },
  {
    title: "Analytics",
    description: "Understand your metrics.",
    icon: BarChart3,
    links: [
      { title: "Dashboard Analytics", href: "/docs/features/analytics" },
      { title: "Cash Flow Forecasting", href: "/docs/features/cashflow" },
      { title: "Expense Analysis", href: "/docs/features/expenses" },
    ]
  },
  {
    title: "AI Features",
    description: "Get intelligent insights.",
    icon: HelpCircle,
    links: [
      { title: "AI Financial Chat", href: "/docs/features/ai-chat" },
      { title: "Automated Reports", href: "/docs/features/reports" },
    ]
  },
  {
    title: "Learning",
    description: "Become a power user.",
    icon: Users,
    links: [
      { title: "Understanding Your Data", href: "/docs/learn/data" },
      { title: "Best Practices", href: "/docs/learn/practices" },
      { title: "FAQ", href: "/docs/learn/faq" },
    ]
  },
];

const KnowledgeBase = () => {
  return (
    <DocsLayout 
      title="Knowledge Base" 
      description="Browse all documentation topics organized by category."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((category) => (
          <div key={category.title} className="border border-vesta-navy/10 bg-white rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-vesta-navy-muted/10 p-3 rounded-lg">
                <category.icon className="h-6 w-6 text-vesta-navy-muted" />
              </div>
              <div>
                <h3 className="text-vesta-navy font-semibold">{category.title}</h3>
                <p className="text-sm text-vesta-navy-muted">{category.description}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {category.links.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-vesta-navy-muted hover:text-vesta-navy-muted transition-colors"
                  >
                    → {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gradient-to-r from-vesta-navy-muted/20 to-vesta-navy-muted/5 border border-vesta-navy-muted/20 rounded-xl p-6 text-center">
        <h3 className="text-vesta-navy font-semibold mb-2">Can't find what you're looking for?</h3>
        <p className="text-vesta-navy-muted mb-4">Our AI assistant can help answer your questions.</p>
        <Link 
          to="/chat"
          className="inline-block bg-vesta-navy-muted text-white px-6 py-2 rounded-lg font-medium hover:bg-vesta-navy-muted transition-colors"
        >
          Ask AI Assistant
        </Link>
      </div>
    </DocsLayout>
  );
};

export default KnowledgeBase;
