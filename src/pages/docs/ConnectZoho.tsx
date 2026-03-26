import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Prerequisites", href: "#prerequisites" },
  { title: "Step 1: Authorize", href: "#authorize" },
  { title: "Step 2: Select Organization", href: "#select-org" },
  { title: "Step 3: Sync Data", href: "#sync" },
  { title: "Troubleshooting", href: "#troubleshooting" },
];

const ConnectZoho = () => {
  return (
    <DocsLayout 
      title="Connect Zoho Books" 
      description="Integrate your Zoho Books data with Finlo for comprehensive financial analysis."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/connect/csv", title: "Upload CSV Data" }}
    >
      <section id="prerequisites" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Prerequisites</h2>
        <p className="text-slate-400 mb-4">Before connecting Zoho Books, ensure you have:</p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>An active Zoho Books account</li>
          <li>Admin access to your Zoho organization</li>
          <li>A Finlo account (free or paid)</li>
        </ul>
      </section>

      <section id="authorize" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Step 1: Authorize Finlo</h2>
        <p className="text-slate-400 mb-4">
          Click <strong className="text-white">"Connect Zoho"</strong> in your Finlo dashboard. 
          You'll be redirected to Zoho's secure OAuth page.
        </p>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-400">
            💡 <strong className="text-white">Tip:</strong> Zoho Books integrates with the entire Zoho ecosystem, giving you comprehensive business data.
          </p>
        </div>
      </section>

      <section id="select-org" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Step 2: Select Organization</h2>
        <p className="text-slate-400 mb-4">
          Select your Zoho Books organization from the list. Multi-organization support is available for enterprise users.
        </p>
      </section>

      <section id="sync" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Step 3: Sync Data</h2>
        <p className="text-slate-400 mb-4">
          Finlo will begin importing your Zoho Books data. Initial sync time depends on your data volume.
        </p>
        <p className="text-slate-400">
          Data synced includes: chart of accounts, transactions, invoices, expenses, contacts, and reports.
        </p>
      </section>

      <section id="troubleshooting" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Regional Data Centers</h4>
            <p className="text-sm text-slate-400">
              Ensure your Zoho account region matches. Some regions require separate authorization.
            </p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">API Limits</h4>
            <p className="text-sm text-slate-400">
              Free Zoho plans have API limits. Consider upgrading for uninterrupted sync.
            </p>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
};

export default ConnectZoho;
