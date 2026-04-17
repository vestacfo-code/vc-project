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
      description="A walkthrough of Vesta's main features and interface."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/connect/quickbooks", title: "Connect QuickBooks" }}
    >
      <section id="dashboard" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Dashboard Overview</h2>
        <p className="text-vesta-navy-muted mb-4">
          Your Vesta dashboard is the central hub for all your financial insights:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Cash Flow Forecast</h4>
            <p className="text-sm text-vesta-navy-muted">Current cash, burn rate, runway, and future projections</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">AR Intelligence</h4>
            <p className="text-sm text-vesta-navy-muted">At-risk amounts, average days late, and customer payment risk</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Expense Intelligence</h4>
            <p className="text-sm text-vesta-navy-muted">Spending anomalies, top vendors, and optimization insights</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Customer Profitability</h4>
            <p className="text-sm text-vesta-navy-muted">Revenue concentration, top customers, and risk alerts</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Top Customers Chart</h4>
            <p className="text-sm text-vesta-navy-muted">Bar chart of your highest-revenue customer relationships</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Expense Distribution</h4>
            <p className="text-sm text-vesta-navy-muted">Pie chart showing vendor expense breakdown</p>
          </div>
        </div>
      </section>

      <section id="navigation" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Navigation</h2>
        <p className="text-vesta-navy-muted mb-4">
          Use the sidebar to access different areas of Vesta:
        </p>
        <div className="grid gap-4">
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Chat</h4>
            <p className="text-sm text-vesta-navy-muted">Ask questions about your finances in natural language</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Analytics</h4>
            <p className="text-sm text-vesta-navy-muted">Deep dive into charts, trends, and forecasts</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Reports</h4>
            <p className="text-sm text-vesta-navy-muted">Generate and schedule automated reports</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Settings</h4>
            <p className="text-sm text-vesta-navy-muted">Manage integrations, team, and preferences</p>
          </div>
        </div>
      </section>

      <section id="features" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Key Features</h2>
        <ol className="list-decimal list-inside text-vesta-navy-muted space-y-3">
          <li><strong className="text-vesta-navy">AI Chat:</strong> Get instant answers about your business finances</li>
          <li><strong className="text-vesta-navy">Integrations:</strong> Connect Mews PMS and QuickBooks Online for automatic daily sync</li>
          <li><strong className="text-vesta-navy">CSV Import:</strong> Import daily metrics, expenses, and channel revenue from any PMS export</li>
          <li><strong className="text-vesta-navy">Forecasting:</strong> Predict future RevPAR, cash flow, and GOP</li>
        </ol>
      </section>

      <section id="help" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Getting Help</h2>
        <p className="text-vesta-navy-muted mb-4">
          Need assistance? Here's how to get support:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Click the chat bubble to ask AI for help</li>
          <li>Visit our documentation (you're here!)</li>
          <li>Email vestacfo@gmail.com for direct assistance</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default QuickTour;
