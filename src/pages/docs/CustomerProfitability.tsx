import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Overview", href: "#overview" },
  { title: "Revenue Concentration", href: "#concentration" },
  { title: "Top Customers", href: "#top-customers" },
  { title: "Risk Alerts", href: "#risk-alerts" },
];

const CustomerProfitability = () => {
  return (
    <DocsLayout 
      title="Customer Profitability" 
      description="Understand which customers drive your business and identify revenue concentration risks."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/features/top-customers", title: "Top Customers" }}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Overview</h2>
        <p className="text-vesta-navy-muted mb-4">
          Customer Profitability analysis helps you understand your revenue mix:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Identify your most valuable customers</li>
          <li>Detect dangerous revenue concentration</li>
          <li>Track customer engagement over time</li>
          <li>Prioritize relationship management efforts</li>
        </ul>
      </section>

      <section id="concentration" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Revenue Concentration</h2>
        <p className="text-vesta-navy-muted mb-4">
          High revenue concentration can be a business risk. Vesta tracks:
        </p>
        <div className="grid gap-4">
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Concentration Percentage</h4>
            <p className="text-sm text-vesta-navy-muted">Percentage of revenue from your top customers</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Diversification Score</h4>
            <p className="text-sm text-vesta-navy-muted">How well-distributed your revenue is across customers</p>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-4">
          <p className="text-sm text-red-200">
            ⚠️ <strong>High concentration warning:</strong> If more than 30% of revenue comes from a single customer, you'll see an alert to diversify your customer base.
          </p>
        </div>
      </section>

      <section id="top-customers" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Top Customers</h2>
        <p className="text-vesta-navy-muted mb-4">
          For each top customer, you can view:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li><strong className="text-vesta-navy">Total Revenue:</strong> Lifetime value from this customer</li>
          <li><strong className="text-vesta-navy">Invoice Count:</strong> Number of transactions</li>
          <li><strong className="text-vesta-navy">Days Since Last Purchase:</strong> Engagement recency</li>
          <li><strong className="text-vesta-navy">Payment History:</strong> On-time vs late payment trends</li>
        </ul>
      </section>

      <section id="risk-alerts" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Risk Alerts</h2>
        <p className="text-vesta-navy-muted mb-4">
          Proactive notifications about customer-related risks:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Top customer hasn't purchased in 30+ days</li>
          <li>Revenue concentration exceeds safe thresholds</li>
          <li>Customer payment behavior is deteriorating</li>
          <li>Significant drop in order frequency</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default CustomerProfitability;
