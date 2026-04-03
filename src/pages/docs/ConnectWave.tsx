import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Prerequisites", href: "#prerequisites" },
  { title: "Step 1: Authorize", href: "#authorize" },
  { title: "Step 2: Select Business", href: "#select-business" },
  { title: "Step 3: Sync Data", href: "#sync" },
  { title: "Troubleshooting", href: "#troubleshooting" },
];

const ConnectWave = () => {
  return (
    <DocsLayout 
      title="Connect Wave" 
      description="Connect your Wave accounting software to Vesta for automated insights."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/connect/zoho", title: "Connect Zoho" }}
    >
      <section id="prerequisites" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Prerequisites</h2>
        <p className="text-slate-400 mb-4">Before connecting Wave, ensure you have:</p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>An active Wave account</li>
          <li>Owner access to your Wave business</li>
          <li>A Vesta account (free or paid)</li>
        </ul>
      </section>

      <section id="authorize" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Step 1: Authorize Vesta</h2>
        <p className="text-slate-400 mb-4">
          Click <strong className="text-slate-900">"Connect Wave"</strong> from your Vesta dashboard. 
          You'll be taken to Wave's authorization page to grant access.
        </p>
        <div className="border border-slate-200 bg-white rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-400">
            💡 <strong className="text-slate-900">Note:</strong> Wave is free accounting software, perfect for small businesses and freelancers.
          </p>
        </div>
      </section>

      <section id="select-business" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Step 2: Select Business</h2>
        <p className="text-slate-400 mb-4">
          Choose which Wave business you want to connect. You can add multiple businesses later.
        </p>
      </section>

      <section id="sync" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Step 3: Sync Data</h2>
        <p className="text-slate-400 mb-4">
          Your Wave data will start syncing immediately. Most syncs complete within a few minutes.
        </p>
        <p className="text-slate-400">
          Data synced includes: income transactions, expenses, invoices, receipts, and account balances.
        </p>
      </section>

      <section id="troubleshooting" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Connection Issues</h4>
            <p className="text-sm text-slate-400">
              Clear your browser cache and try connecting again. Ensure pop-ups are allowed.
            </p>
          </div>
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Limited Data</h4>
            <p className="text-sm text-slate-400">
              Wave's API has some limitations. Certain historical data may not be available.
            </p>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
};

export default ConnectWave;
