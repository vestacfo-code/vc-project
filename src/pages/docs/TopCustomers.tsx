import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Overview", href: "#overview" },
  { title: "Revenue Chart", href: "#revenue-chart" },
  { title: "Customer Details", href: "#details" },
  { title: "Using the Data", href: "#usage" },
];

const TopCustomers = () => {
  return (
    <DocsLayout 
      title="Top Customers" 
      description="Visualize your highest-value customer relationships with interactive charts."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/features/expense-distribution", title: "Expense Distribution" }}
    >
      <section id="overview" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Overview</h2>
        <p className="text-vesta-navy-muted mb-4">
          The Top Customers chart provides a visual breakdown of your most valuable customer relationships:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Bar chart showing top 10 customers by total revenue</li>
          <li>Quick comparison of customer contribution to your business</li>
          <li>Interactive tooltips with detailed revenue information</li>
          <li>Direct integration with AI chat for deeper analysis</li>
        </ul>
      </section>

      <section id="revenue-chart" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Revenue Chart</h2>
        <p className="text-vesta-navy-muted mb-4">
          The horizontal bar chart displays:
        </p>
        <div className="grid gap-4">
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Customer Names</h4>
            <p className="text-sm text-vesta-navy-muted">Y-axis shows customer or company names</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Total Revenue</h4>
            <p className="text-sm text-vesta-navy-muted">X-axis represents total revenue in dollars</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Visual Comparison</h4>
            <p className="text-sm text-vesta-navy-muted">Bar length makes it easy to compare customer value</p>
          </div>
        </div>
      </section>

      <section id="details" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Customer Details</h2>
        <p className="text-vesta-navy-muted mb-4">
          Hover over any bar to see detailed information:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li><strong className="text-vesta-navy">Total Revenue:</strong> Exact dollar amount</li>
          <li><strong className="text-vesta-navy">Percentage:</strong> Share of total revenue</li>
          <li><strong className="text-vesta-navy">Trend:</strong> Growth or decline vs previous period</li>
        </ul>
      </section>

      <section id="usage" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Using the Data</h2>
        <p className="text-vesta-navy-muted mb-4">
          How to leverage top customer insights:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Prioritize account management for top revenue sources</li>
          <li>Identify upsell opportunities with growing customers</li>
          <li>Spot at-risk relationships before revenue drops</li>
          <li>Click the chat icon to ask AI questions about specific customers</li>
        </ul>
        <div className="border border-vesta-navy/10 bg-white rounded-xl p-4 mt-4">
          <p className="text-sm text-vesta-navy-muted">
            💡 <strong className="text-vesta-navy">Ask AI:</strong> "Why did revenue from [Customer Name] decrease last month?" for instant analysis.
          </p>
        </div>
      </section>
    </DocsLayout>
  );
};

export default TopCustomers;
