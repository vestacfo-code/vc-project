import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Category Breakdown", href: "#categories" },
  { title: "Trend Analysis", href: "#trends" },
  { title: "Budget Comparison", href: "#budget" },
  { title: "Export Options", href: "#export" },
];

const Expenses = () => {
  return (
    <DocsLayout 
      title="Expense Analysis" 
      description="Understand where your money is going with detailed expense breakdowns."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/learn/data", title: "Understanding Your Data" }}
    >
      <section id="categories" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Category Breakdown</h2>
        <p className="text-slate-400 mb-4">
          View expenses organized by category:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Payroll & Benefits</li>
          <li>Rent & Utilities</li>
          <li>Marketing & Advertising</li>
          <li>Software & Subscriptions</li>
          <li>Travel & Entertainment</li>
          <li>Office Supplies</li>
          <li>Professional Services</li>
        </ul>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mt-4">
          <p className="text-sm text-slate-400">
            💡 <strong className="text-white">AI Categorization:</strong> Vesta automatically categorizes transactions. You can edit categories manually if needed.
          </p>
        </div>
      </section>

      <section id="trends" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Trend Analysis</h2>
        <p className="text-slate-400 mb-4">
          Identify spending patterns over time:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Month-over-month changes</li>
          <li>Seasonal variations</li>
          <li>Category growth rates</li>
          <li>Anomaly detection for unusual spending</li>
        </ul>
      </section>

      <section id="budget" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Budget Comparison</h2>
        <p className="text-slate-400 mb-4">
          Compare actual spending to your budget:
        </p>
        <div className="grid gap-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Set Budgets</h4>
            <p className="text-sm text-slate-400">Create budgets for each expense category</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Track Progress</h4>
            <p className="text-sm text-slate-400">See how much of each budget is spent</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Get Alerts</h4>
            <p className="text-sm text-slate-400">Receive notifications when approaching limits</p>
          </div>
        </div>
      </section>

      <section id="export" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Export Options</h2>
        <p className="text-slate-400 mb-4">
          Export expense data for tax prep or analysis:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Download as CSV for spreadsheets</li>
          <li>Export PDF reports with charts</li>
          <li>Filter by date range or category</li>
          <li>Include receipts and attachments</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default Expenses;
