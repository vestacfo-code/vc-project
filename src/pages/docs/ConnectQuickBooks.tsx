import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Prerequisites", href: "#prerequisites" },
  { title: "Step 1: Authorize", href: "#authorize" },
  { title: "Step 2: Select Company", href: "#select-company" },
  { title: "Step 3: Sync Data", href: "#sync" },
  { title: "Troubleshooting", href: "#troubleshooting" },
];

const ConnectQuickBooks = () => {
  return (
    <DocsLayout 
      title="Connect QuickBooks" 
      description="Sync your QuickBooks Online data with Vesta in just a few clicks."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/connect/xero", title: "Connect Xero" }}
    >
      <section id="prerequisites" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Prerequisites</h2>
        <p className="text-slate-400 mb-4">Before connecting QuickBooks, ensure you have:</p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>An active QuickBooks Online account</li>
          <li>Admin access to your QuickBooks company file</li>
          <li>A Vesta account (free or paid)</li>
        </ul>
      </section>

      <section id="authorize" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Step 1: Authorize Vesta</h2>
        <p className="text-slate-400 mb-4">
          Navigate to your Vesta dashboard and click the <strong className="text-white">"Connect QuickBooks"</strong> button. 
          You'll be redirected to Intuit's secure authorization page.
        </p>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-400">
            💡 <strong className="text-white">Tip:</strong> Make sure you're logged into the correct QuickBooks account before authorizing.
          </p>
        </div>
      </section>

      <section id="select-company" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Step 2: Select Company</h2>
        <p className="text-slate-400 mb-4">
          If you have multiple QuickBooks companies, select the one you want to connect. 
          You can connect additional companies later from your settings.
        </p>
      </section>

      <section id="sync" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Step 3: Sync Data</h2>
        <p className="text-slate-400 mb-4">
          Once authorized, Vesta will automatically sync your financial data. The initial sync may take a few minutes 
          depending on the size of your data. You'll see a progress indicator on your dashboard.
        </p>
        <p className="text-slate-400">
          Data synced includes: income, expenses, invoices, bills, accounts, and more.
        </p>
      </section>

      <section id="troubleshooting" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Connection Failed</h4>
            <p className="text-sm text-slate-400">
              Try logging out of QuickBooks and logging back in, then attempt the connection again.
            </p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">Missing Data</h4>
            <p className="text-sm text-slate-400">
              Ensure you have admin permissions in QuickBooks. Some data may require elevated access.
            </p>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
};

export default ConnectQuickBooks;
