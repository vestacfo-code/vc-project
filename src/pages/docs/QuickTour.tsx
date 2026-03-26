import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Dashboard Overview", href: "#dashboard" },
  { title: "Navigation", href: "#navigation" },
  { title: "Key Features", href: "#features" },
  { title: "Getting Help", href: "#help" },
];

const QuickTour = () => {
  return (
    <DocsLayout 
      title="Quick Tour" 
      description="A walkthrough of Finlo's main features and interface."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/connect/quickbooks", title: "Connect QuickBooks" }}
    >
      <section id="dashboard" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Dashboard Overview</h2>
        <p className="text-slate-400 mb-4">
          Your Finlo dashboard is the central hub for all your financial insights:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Cash Flow Forecast</h4>
            <p className="text-sm text-slate-400">Current cash, burn rate, runway, and future projections</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">AR Intelligence</h4>
            <p className="text-sm text-slate-400">At-risk amounts, average days late, and customer payment risk</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Expense Intelligence</h4>
            <p className="text-sm text-slate-400">Spending anomalies, top vendors, and optimization insights</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Customer Profitability</h4>
            <p className="text-sm text-slate-400">Revenue concentration, top customers, and risk alerts</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Top Customers Chart</h4>
            <p className="text-sm text-slate-400">Bar chart of your highest-revenue customer relationships</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Expense Distribution</h4>
            <p className="text-sm text-slate-400">Pie chart showing vendor expense breakdown</p>
          </div>
        </div>
      </section>

      <section id="navigation" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Navigation</h2>
        <p className="text-slate-400 mb-4">
          Use the sidebar to access different areas of Finlo:
        </p>
        <div className="grid gap-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Chat</h4>
            <p className="text-sm text-slate-400">Ask questions about your finances in natural language</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Analytics</h4>
            <p className="text-sm text-slate-400">Deep dive into charts, trends, and forecasts</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Reports</h4>
            <p className="text-sm text-slate-400">Generate and schedule automated reports</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Settings</h4>
            <p className="text-sm text-slate-400">Manage integrations, team, and preferences</p>
          </div>
        </div>
      </section>

      <section id="features" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Key Features</h2>
        <ol className="list-decimal list-inside text-slate-400 space-y-3">
          <li><strong className="text-white">AI Chat:</strong> Get instant answers about your business finances</li>
          <li><strong className="text-white">Integrations:</strong> Connect QuickBooks, Xero, Wave, or Zoho</li>
          <li><strong className="text-white">File Upload:</strong> Import CSV, Excel, or PDF documents</li>
          <li><strong className="text-white">Forecasting:</strong> Predict future cash flow and revenue</li>
        </ol>
      </section>

      <section id="help" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Getting Help</h2>
        <p className="text-slate-400 mb-4">
          Need assistance? Here's how to get support:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Click the chat bubble to ask AI for help</li>
          <li>Visit our documentation (you're here!)</li>
          <li>Email support@joinfinlo.ai for direct assistance</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default QuickTour;
