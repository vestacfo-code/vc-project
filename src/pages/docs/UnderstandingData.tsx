import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Data Sources", href: "#sources" },
  { title: "Data Processing", href: "#processing" },
  { title: "Data Security", href: "#security" },
  { title: "Data Quality", href: "#quality" },
];

const UnderstandingData = () => {
  return (
    <DocsLayout 
      title="Understanding Your Data" 
      description="Learn how Vesta collects, processes, and protects your financial data."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/learn/practices", title: "Best Practices" }}
    >
      <section id="sources" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Data Sources</h2>
        <p className="text-vesta-navy-muted mb-4">
          Vesta can ingest data from multiple sources:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li><strong className="text-vesta-navy">PMS Sync:</strong> Mews — daily reservations, occupancy, room revenue</li>
          <li><strong className="text-vesta-navy">Accounting Sync:</strong> QuickBooks Online — expenses and P&L</li>
          <li><strong className="text-vesta-navy">CSV Import:</strong> Daily metrics, expenses, or channel revenue from any PMS export</li>
          <li><strong className="text-vesta-navy">Manual Entry:</strong> Direct KPI input for any date range</li>
        </ul>
      </section>

      <section id="processing" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Data Processing</h2>
        <p className="text-vesta-navy-muted mb-4">
          When your data arrives, Vesta:
        </p>
        <ol className="list-decimal list-inside text-vesta-navy-muted space-y-3">
          <li>Validates and cleans the data</li>
          <li>Categorizes transactions using AI</li>
          <li>Normalizes formats and currencies</li>
          <li>Identifies patterns and anomalies</li>
          <li>Calculates metrics and KPIs</li>
        </ol>
      </section>

      <section id="security" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Data Security</h2>
        <p className="text-vesta-navy-muted mb-4">
          Your data is protected with enterprise-grade security:
        </p>
        <div className="grid gap-4">
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Encryption</h4>
            <p className="text-sm text-vesta-navy-muted">AES-256 encryption at rest, TLS 1.3 in transit</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Access Control</h4>
            <p className="text-sm text-vesta-navy-muted">Role-based permissions and audit logging</p>
          </div>
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-4">
            <h4 className="text-vesta-navy font-medium mb-2">Compliance</h4>
            <p className="text-sm text-vesta-navy-muted">SOC 2 Type II compliant infrastructure</p>
          </div>
        </div>
      </section>

      <section id="quality" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Data Quality</h2>
        <p className="text-vesta-navy-muted mb-4">
          Tips for maintaining good data quality:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Keep your accounting software up to date</li>
          <li>Review and correct miscategorized transactions</li>
          <li>Reconcile accounts regularly</li>
          <li>Use consistent naming conventions</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default UnderstandingData;
