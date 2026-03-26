import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Report Types", href: "#types" },
  { title: "Scheduling", href: "#scheduling" },
  { title: "Email Delivery", href: "#email" },
  { title: "Customization", href: "#custom" },
];

const Reports = () => {
  return (
    <DocsLayout 
      title="Automated Reports" 
      description="Generate and schedule financial reports automatically."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/features/expenses", title: "Expense Analysis" }}
    >
      <section id="types" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Report Types</h2>
        <div className="grid gap-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Weekly Summary</h4>
            <p className="text-sm text-slate-400">Overview of the past week's financial activity</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Monthly P&L</h4>
            <p className="text-sm text-slate-400">Profit and loss statement for the month</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Cash Flow Report</h4>
            <p className="text-sm text-slate-400">Detailed cash inflows and outflows</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Expense Report</h4>
            <p className="text-sm text-slate-400">Breakdown of expenses by category</p>
          </div>
        </div>
      </section>

      <section id="scheduling" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Scheduling Options</h2>
        <p className="text-slate-400 mb-4">
          Set up automatic report generation:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li><strong className="text-white">Daily:</strong> Sent every morning</li>
          <li><strong className="text-white">Weekly:</strong> Sent on your chosen day</li>
          <li><strong className="text-white">Monthly:</strong> Sent on the 1st of each month</li>
          <li><strong className="text-white">Quarterly:</strong> Sent at the end of each quarter</li>
        </ul>
      </section>

      <section id="email" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Email Delivery</h2>
        <p className="text-slate-400 mb-4">
          Configure who receives your reports:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Add multiple email recipients</li>
          <li>Choose PDF or HTML format</li>
          <li>Include or exclude specific sections</li>
          <li>Add custom notes or messages</li>
        </ul>
      </section>

      <section id="custom" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Customization</h2>
        <p className="text-slate-400 mb-4">
          Personalize your reports:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Add your company logo</li>
          <li>Choose color themes</li>
          <li>Select which metrics to include</li>
          <li>Add custom commentary sections</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default Reports;
