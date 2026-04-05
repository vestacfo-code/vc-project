import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Intelligence Cards", href: "#intelligence" },
  { title: "Charts & Visualizations", href: "#charts" },
  { title: "AI-Powered Insights", href: "#insights" },
  { title: "Filters & Export", href: "#filters" },
];

const Analytics = () => {
  return (
    <DocsLayout 
      title="Dashboard Analytics" 
      description="Your financial command center with AI-powered intelligence cards and visualizations."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/features/cashflow", title: "Cash Flow Forecasting" }}
    >
      <section id="intelligence" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Intelligence Cards</h2>
        <p className="text-vesta-navy-muted mb-4">
          Your dashboard features six AI-powered intelligence cards that provide real-time insights:
        </p>
        <div className="grid gap-4">
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Cash Flow Forecast</h4>
            <p className="text-sm text-vesta-navy-muted">Current cash balance, monthly burn rate, runway projection, and future cash flow predictions. <a href="/docs/features/cashflow" className="text-vesta-navy-muted hover:underline">Learn more →</a></p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">AR Intelligence</h4>
            <p className="text-sm text-vesta-navy-muted">At-risk amounts, average days late, customer payment risk profiles, and collection insights. <a href="/docs/features/ar-intelligence" className="text-vesta-navy-muted hover:underline">Learn more →</a></p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Expense Intelligence</h4>
            <p className="text-sm text-vesta-navy-muted">Spending anomaly detection, top vendors, expected vs actual spending, and optimization recommendations. <a href="/docs/features/expense-intelligence" className="text-vesta-navy-muted hover:underline">Learn more →</a></p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Customer Profitability</h4>
            <p className="text-sm text-vesta-navy-muted">Revenue concentration analysis, top customer metrics, engagement tracking, and risk alerts. <a href="/docs/features/customer-profitability" className="text-vesta-navy-muted hover:underline">Learn more →</a></p>
          </div>
        </div>
      </section>

      <section id="charts" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Charts & Visualizations</h2>
        <p className="text-vesta-navy-muted mb-4">
          Interactive charts help you understand your financial data at a glance:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Cash Flow Chart</h4>
            <p className="text-sm text-vesta-navy-muted">Area chart showing cash inflows and outflows over time</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Top Customers</h4>
            <p className="text-sm text-vesta-navy-muted">Bar chart of your highest-revenue customers. <a href="/docs/features/top-customers" className="text-vesta-navy-muted hover:underline">Learn more →</a></p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Expense Distribution</h4>
            <p className="text-sm text-vesta-navy-muted">Pie chart showing vendor expense breakdown. <a href="/docs/features/expense-distribution" className="text-vesta-navy-muted hover:underline">Learn more →</a></p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Trend Lines</h4>
            <p className="text-sm text-vesta-navy-muted">Historical patterns for revenue, expenses, and profit</p>
          </div>
        </div>
      </section>

      <section id="insights" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">AI-Powered Insights</h2>
        <p className="text-vesta-navy-muted mb-4">
          Each intelligence card includes AI-generated insights:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li><strong className="text-vesta-navy">Strategic Alerts:</strong> Warnings about cash runway, concentration risks, and anomalies</li>
          <li><strong className="text-vesta-navy">Trend Analysis:</strong> AI interpretation of patterns in your data</li>
          <li><strong className="text-vesta-navy">Recommendations:</strong> Actionable suggestions to improve financial health</li>
          <li><strong className="text-vesta-navy">Chat Integration:</strong> Click any chat icon to ask AI questions about that specific metric</li>
        </ul>
      </section>

      <section id="filters" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Filters & Export</h2>
        <p className="text-vesta-navy-muted mb-4">
          Customize your view with flexible date ranges:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2 mb-6">
          <li>Last 7, 30, 90 days</li>
          <li>This month / Last month</li>
          <li>This quarter / Last quarter</li>
          <li>This year / Last year</li>
          <li>Custom date range</li>
        </ul>
        <h3 className="text-lg font-medium text-vesta-navy mb-3">Export Options</h3>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li><strong className="text-vesta-navy">CSV:</strong> Raw data for spreadsheets</li>
          <li><strong className="text-vesta-navy">PDF:</strong> Formatted reports with charts</li>
          <li><strong className="text-vesta-navy">PNG:</strong> Chart images for presentations</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default Analytics;
