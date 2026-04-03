import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Prerequisites", href: "#prerequisites" },
  { title: "Step 1: Authorize", href: "#authorize" },
  { title: "Step 2: Select Organization", href: "#select-org" },
  { title: "Step 3: Sync Data", href: "#sync" },
  { title: "Troubleshooting", href: "#troubleshooting" },
];

const ConnectXero = () => {
  return (
    <DocsLayout 
      title="Connect Xero" 
      description="Import your Xero accounting data into Vesta seamlessly."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/connect/wave", title: "Connect Wave" }}
    >
      <section id="prerequisites" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Prerequisites</h2>
        <p className="text-slate-400 mb-4">Before connecting Xero, ensure you have:</p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>An active Xero account</li>
          <li>Admin or standard user access to your Xero organization</li>
          <li>A Vesta account (free or paid)</li>
        </ul>
      </section>

      <section id="authorize" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Step 1: Authorize Vesta</h2>
        <p className="text-slate-400 mb-4">
          From your Vesta dashboard, click <strong className="text-slate-900">"Connect Xero"</strong>. 
          You'll be redirected to Xero's OAuth authorization page.
        </p>
        <div className="border border-slate-200 bg-white rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-400">
            💡 <strong className="text-slate-900">Tip:</strong> Review the permissions Vesta requests. We only access read-only financial data.
          </p>
        </div>
      </section>

      <section id="select-org" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Step 2: Select Organization</h2>
        <p className="text-slate-400 mb-4">
          If you manage multiple Xero organizations, choose the one you'd like to connect. 
          Additional organizations can be connected from your account settings.
        </p>
      </section>

      <section id="sync" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Step 3: Sync Data</h2>
        <p className="text-slate-400 mb-4">
          Vesta will begin syncing your Xero data automatically. The initial sync typically completes within 2-5 minutes.
        </p>
        <p className="text-slate-400">
          Data synced includes: bank transactions, invoices, bills, contacts, and chart of accounts.
        </p>
      </section>

      <section id="troubleshooting" className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Authorization Expired</h4>
            <p className="text-sm text-slate-400">
              Xero connections expire after 60 days. Reconnect from your dashboard to refresh.
            </p>
          </div>
          <div className="border border-slate-200 bg-white rounded-xl p-4">
            <h4 className="text-slate-900 font-medium mb-2">Rate Limits</h4>
            <p className="text-sm text-slate-400">
              If sync is slow, Xero may be rate-limiting requests. Data will sync gradually.
            </p>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
};

export default ConnectXero;
