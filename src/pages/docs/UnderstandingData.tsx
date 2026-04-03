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
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Sources</h2>
        <p className="text-slate-400 mb-4">
          Vesta can ingest data from multiple sources:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li><strong className="text-slate-900">Integrations:</strong> QuickBooks, Xero, Wave, Zoho</li>
          <li><strong className="text-slate-900">File Uploads:</strong> CSV, Excel, PDF bank statements</li>
          <li><strong className="text-slate-900">Manual Entry:</strong> Direct data input</li>
          <li><strong className="text-slate-900">Bank Feeds:</strong> Direct bank connections (coming soon)</li>
        </ul>
      </section>

      <section id="processing" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Processing</h2>
        <p className="text-slate-400 mb-4">
          When your data arrives, Vesta:
        </p>
        <ol className="list-decimal list-inside text-slate-400 space-y-3">
          <li>Validates and cleans the data</li>
          <li>Categorizes transactions using AI</li>
          <li>Normalizes formats and currencies</li>
          <li>Identifies patterns and anomalies</li>
          <li>Calculates metrics and KPIs</li>
        </ol>
      </section>

      <section id="security" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Security</h2>
        <p className="text-slate-400 mb-4">
          Your data is protected with enterprise-grade security:
        </p>
        <div className="grid gap-4">
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Encryption</h4>
            <p className="text-sm text-slate-400">AES-256 encryption at rest, TLS 1.3 in transit</p>
          </div>
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Access Control</h4>
            <p className="text-sm text-slate-400">Role-based permissions and audit logging</p>
          </div>
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Compliance</h4>
            <p className="text-sm text-slate-400">SOC 2 Type II compliant infrastructure</p>
          </div>
        </div>
      </section>

      <section id="quality" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Quality</h2>
        <p className="text-slate-400 mb-4">
          Tips for maintaining good data quality:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
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
