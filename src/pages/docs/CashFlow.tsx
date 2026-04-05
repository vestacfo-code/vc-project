import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "How Predictions Work", href: "#predictions" },
  { title: "Understanding the Forecast", href: "#understand" },
  { title: "Adjusting Assumptions", href: "#assumptions" },
  { title: "Accuracy Factors", href: "#accuracy" },
];

const CashFlow = () => {
  return (
    <DocsLayout 
      title="Cash Flow Forecasting" 
      description="Predict future cash positions with AI-powered forecasting."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/features/ar-intelligence", title: "AR Intelligence" }}
    >
      <section id="predictions" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">How Predictions Work</h2>
        <p className="text-vesta-navy-muted mb-4">
          Vesta uses machine learning to forecast your cash flow:
        </p>
        <ol className="list-decimal list-inside text-vesta-navy-muted space-y-3">
          <li>Analyzes your historical transaction patterns</li>
          <li>Identifies recurring income and expenses</li>
          <li>Accounts for seasonal variations</li>
          <li>Projects future cash positions</li>
        </ol>
        <div className="border border-vesta-navy/10 bg-white rounded-xl p-4 mt-4">
          <p className="text-sm text-vesta-navy-muted">
            💡 <strong className="text-vesta-navy">More data = better predictions.</strong> Connect your accounts and upload historical data for improved accuracy.
          </p>
        </div>
      </section>

      <section id="understand" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Understanding the Forecast</h2>
        <p className="text-vesta-navy-muted mb-4">
          Your cash flow forecast shows:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li><strong className="text-vesta-navy">Projected Balance:</strong> Expected cash at future dates</li>
          <li><strong className="text-vesta-navy">Confidence Range:</strong> High and low scenarios</li>
          <li><strong className="text-vesta-navy">Cash Runway:</strong> How long current cash will last</li>
          <li><strong className="text-vesta-navy">Warnings:</strong> Potential shortfall alerts</li>
        </ul>
      </section>

      <section id="assumptions" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Adjusting Assumptions</h2>
        <p className="text-vesta-navy-muted mb-4">
          Customize the forecast by adjusting:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Expected revenue growth rate</li>
          <li>Planned major expenses</li>
          <li>Upcoming invoices or payments</li>
          <li>Seasonal adjustments</li>
        </ul>
      </section>

      <section id="accuracy" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Accuracy Factors</h2>
        <p className="text-vesta-navy-muted mb-4">
          Forecast accuracy depends on:
        </p>
        <div className="grid gap-4">
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Data Volume</h4>
            <p className="text-sm text-vesta-navy-muted">More historical data improves predictions</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Business Consistency</h4>
            <p className="text-sm text-vesta-navy-muted">Regular patterns are easier to predict</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Data Quality</h4>
            <p className="text-sm text-vesta-navy-muted">Accurate categorization improves results</p>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
};

export default CashFlow;
