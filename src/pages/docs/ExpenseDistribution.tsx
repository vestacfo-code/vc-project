import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Overview", href: "#overview" },
  { title: "Pie Chart Breakdown", href: "#pie-chart" },
  { title: "Vendor Analysis", href: "#vendors" },
  { title: "Actionable Insights", href: "#insights" },
];

const ExpenseDistribution = () => {
  return (
    <DocsLayout 
      title="Expense Distribution" 
      description="Visualize how your expenses are distributed across vendors and categories."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/features/reports", title: "Automated Reports" }}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Overview</h2>
        <p className="text-vesta-navy-muted mb-4">
          The Expense Distribution chart gives you a clear picture of where your money goes:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Pie chart showing top 5 vendors by expense amount</li>
          <li>Percentage breakdown of each vendor's share</li>
          <li>Color-coded segments for easy identification</li>
          <li>Interactive tooltips with exact amounts</li>
        </ul>
      </section>

      <section id="pie-chart" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Pie Chart Breakdown</h2>
        <p className="text-vesta-navy-muted mb-4">
          Each segment of the pie chart represents:
        </p>
        <div className="grid gap-4">
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Vendor Name</h4>
            <p className="text-sm text-vesta-navy-muted">Company or service provider you pay</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Expense Amount</h4>
            <p className="text-sm text-vesta-navy-muted">Total dollars spent with this vendor</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Percentage Share</h4>
            <p className="text-sm text-vesta-navy-muted">Proportion of total expenses</p>
          </div>
        </div>
      </section>

      <section id="vendors" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Vendor Analysis</h2>
        <p className="text-vesta-navy-muted mb-4">
          Understanding your vendor relationships:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li><strong className="text-vesta-navy">Top Vendors:</strong> Your 5 largest expense relationships</li>
          <li><strong className="text-vesta-navy">Concentration:</strong> How dependent you are on specific vendors</li>
          <li><strong className="text-vesta-navy">Category Mapping:</strong> Which expense categories each vendor falls into</li>
        </ul>
      </section>

      <section id="insights" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Actionable Insights</h2>
        <p className="text-vesta-navy-muted mb-4">
          Use expense distribution data to:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Negotiate better rates with high-volume vendors</li>
          <li>Identify opportunities for vendor consolidation</li>
          <li>Spot unexpected expense concentrations</li>
          <li>Track changes in spending patterns over time</li>
        </ul>
        <div className="border border-vesta-navy/10 bg-white rounded-xl p-4 mt-4">
          <p className="text-sm text-vesta-navy-muted">
            💡 <strong className="text-vesta-navy">Tip:</strong> If one vendor represents more than 40% of a category, consider exploring alternatives to reduce risk.
          </p>
        </div>
      </section>
    </DocsLayout>
  );
};

export default ExpenseDistribution;
