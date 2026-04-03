import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "When to Use", href: "#when" },
  { title: "Data Types", href: "#types" },
  { title: "Adding Entries", href: "#adding" },
  { title: "Re-Analyzing Data", href: "#editing" },
];

const ManualEntry = () => {
  return (
    <DocsLayout 
      title="Manual Data Entry" 
      description="Manually input financial data when automated imports aren't available."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/features/ai-chat", title: "AI Financial Chat" }}
    >
      <section id="when" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">When to Use Manual Entry</h2>
        <p className="text-slate-400 mb-4">Manual data entry is useful when:</p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Your accounting software isn't supported yet</li>
          <li>You have cash transactions not in digital records</li>
          <li>You need to add projected or estimated figures</li>
          <li>You're testing Vesta before connecting accounts</li>
        </ul>
      </section>

      <section id="types" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Available Data Types</h2>
        <div className="grid gap-4">
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Revenue</h4>
            <p className="text-sm text-slate-400">Total sales, service income, and other earnings</p>
          </div>
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Expenses</h4>
            <p className="text-sm text-slate-400">Operating costs, supplies, utilities, etc.</p>
          </div>
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Profit</h4>
            <p className="text-sm text-slate-400">Net profit or loss for the period</p>
          </div>
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Cash Flow</h4>
            <p className="text-sm text-slate-400">Net cash inflows and outflows</p>
          </div>
        </div>
      </section>

      <section id="adding" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Adding Entries</h2>
        <ol className="list-decimal list-inside text-slate-400 space-y-3">
          <li>Go to your Vesta dashboard</li>
          <li>Find the <strong className="text-slate-900">"Upload Financial Data or Enter Manually"</strong> card</li>
          <li>Click the <strong className="text-slate-900">"Manual Entry"</strong> tab</li>
          <li>Fill in your financial data: Revenue, Expenses, Profit, Cash Flow</li>
          <li>Click <strong className="text-slate-900">"Analyze Financial Data"</strong> to submit</li>
        </ol>
      </section>

      <section id="editing" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Re-Analyzing Data</h2>
        <p className="text-slate-400 mb-4">
          To update your financial analysis with new data:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Return to the Manual Entry tab on your dashboard</li>
          <li>Enter your updated financial figures</li>
          <li>Click <strong className="text-slate-900">"Analyze Financial Data"</strong> to generate new insights</li>
        </ul>
        <div className="border border-slate-200 bg-white rounded-xl p-4 mt-4">
          <p className="text-sm text-slate-400">
            💡 <strong className="text-slate-900">Tip:</strong> For more detailed analysis, consider uploading financial documents (CSV, Excel, PDF) instead of manual entry.
          </p>
        </div>
      </section>
    </DocsLayout>
  );
};

export default ManualEntry;
