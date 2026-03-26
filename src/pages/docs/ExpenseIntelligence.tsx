import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Overview", href: "#overview" },
  { title: "Spending Anomalies", href: "#anomalies" },
  { title: "Top Vendors", href: "#vendors" },
  { title: "Optimization Insights", href: "#optimization" },
];

const ExpenseIntelligence = () => {
  return (
    <DocsLayout 
      title="Expense Intelligence" 
      description="Detect spending anomalies and optimize expenses with AI-powered analysis."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/features/customer-profitability", title: "Customer Profitability" }}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
        <p className="text-slate-400 mb-4">
          Expense Intelligence automatically monitors your spending patterns to help you:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Detect unusual spending patterns before they become problems</li>
          <li>Identify your top vendors and spending categories</li>
          <li>Discover cost-saving opportunities</li>
          <li>Track expense trends over time</li>
        </ul>
      </section>

      <section id="anomalies" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Spending Anomalies</h2>
        <p className="text-slate-400 mb-4">
          Finlo uses AI to detect when expenses deviate significantly from expected patterns:
        </p>
        <div className="grid gap-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Deviation Alerts</h4>
            <p className="text-sm text-slate-400">Get notified when a category exceeds its typical range</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Expected vs Actual</h4>
            <p className="text-sm text-slate-400">Compare what you typically spend versus actual expenditure</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Trend Detection</h4>
            <p className="text-sm text-slate-400">Identify gradual increases that might go unnoticed</p>
          </div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mt-4">
          <p className="text-sm text-yellow-200">
            ⚠️ <strong>Example:</strong> "Software expenses are 47% higher than expected. Actual: $12,500, Expected: $8,500"
          </p>
        </div>
      </section>

      <section id="vendors" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Top Vendors</h2>
        <p className="text-slate-400 mb-4">
          Track where your money is going with vendor-level insights:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li><strong className="text-white">Top 5 Vendors:</strong> Your largest expense relationships</li>
          <li><strong className="text-white">Spending Trends:</strong> Month-over-month changes per vendor</li>
          <li><strong className="text-white">Category Breakdown:</strong> How each vendor fits into your expense categories</li>
        </ul>
      </section>

      <section id="optimization" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Optimization Insights</h2>
        <p className="text-slate-400 mb-4">
          AI-generated recommendations to reduce costs:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Identify redundant subscriptions or services</li>
          <li>Spot opportunities for vendor consolidation</li>
          <li>Highlight categories with potential for negotiation</li>
          <li>Benchmark against industry standards</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default ExpenseIntelligence;
