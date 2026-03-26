import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Overview", href: "#overview" },
  { title: "At-Risk Amounts", href: "#at-risk" },
  { title: "Customer Payment Risk", href: "#payment-risk" },
  { title: "Collection Insights", href: "#collection" },
];

const ARIntelligence = () => {
  return (
    <DocsLayout 
      title="AR Intelligence" 
      description="Monitor accounts receivable health and identify collection risks with AI-powered insights."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/features/expense-intelligence", title: "Expense Intelligence" }}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
        <p className="text-slate-400 mb-4">
          AR Intelligence provides real-time monitoring of your accounts receivable to help you:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Identify customers at risk of late payment</li>
          <li>Track average days late across your portfolio</li>
          <li>Prioritize collection efforts effectively</li>
          <li>Forecast potential cash flow impacts</li>
        </ul>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mt-4">
          <p className="text-sm text-slate-400">
            💡 <strong className="text-white">Pro tip:</strong> Connect your accounting software for automatic invoice tracking and real-time AR updates.
          </p>
        </div>
      </section>

      <section id="at-risk" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">At-Risk Amounts</h2>
        <p className="text-slate-400 mb-4">
          The AR Intelligence dashboard highlights amounts that may be difficult to collect:
        </p>
        <div className="grid gap-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Total At Risk</h4>
            <p className="text-sm text-slate-400">Sum of invoices past due or with high-risk customers</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Average Days Late</h4>
            <p className="text-sm text-slate-400">Mean number of days invoices are overdue</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Total Outstanding</h4>
            <p className="text-sm text-slate-400">All unpaid invoices across your customer base</p>
          </div>
        </div>
      </section>

      <section id="payment-risk" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Customer Payment Risk</h2>
        <p className="text-slate-400 mb-4">
          Each customer is assigned a risk profile based on their payment history:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li><strong className="text-emerald-400">Low Risk:</strong> Consistent on-time payments</li>
          <li><strong className="text-yellow-400">Medium Risk:</strong> Occasional late payments</li>
          <li><strong className="text-red-400">High Risk:</strong> Frequent late payments or disputes</li>
        </ul>
        <p className="text-slate-400 mt-4">
          Risk scores are calculated using historical payment patterns, invoice amounts, and payment velocity.
        </p>
      </section>

      <section id="collection" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Collection Insights</h2>
        <p className="text-slate-400 mb-4">
          AI-generated recommendations to improve collections:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Suggested follow-up timing for each customer</li>
          <li>Prioritized list of invoices to focus on</li>
          <li>Early warning alerts for deteriorating accounts</li>
          <li>Estimated collection probability for each invoice</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default ARIntelligence;
