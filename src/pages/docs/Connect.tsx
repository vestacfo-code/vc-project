import DocsLayout from "@/components/docs/DocsLayout";
import { Link } from "react-router-dom";
import quickbooksLogo from "@/assets/quickbooks-logo.png";
import { FileSpreadsheet, Keyboard, Hotel } from "lucide-react";

const tableOfContents = [
  { id: "pms", title: "Property Management System", href: "#pms" },
  { id: "accounting", title: "Accounting", href: "#accounting" },
  { id: "manual-options", title: "Manual / CSV", href: "#manual-options" },
];

const Connect = () => {
  const pmsIntegrations = [
    {
      name: "Mews",
      logoText: "Mews",
      description: "Connect your Mews PMS to sync daily reservations, occupancy, ADR, and RevPAR automatically.",
      link: "/integrations",
    },
  ];

  const accountingIntegrations = [
    {
      name: "QuickBooks Online",
      logo: quickbooksLogo,
      description: "Sync your QuickBooks expenses and P&L data for a complete hotel financial picture.",
      link: "/docs/connect/quickbooks",
    },
  ];

  const manualOptions = [
    {
      name: "Upload CSV",
      icon: FileSpreadsheet,
      description: "Import daily metrics, expenses, or revenue-by-channel from any PMS export.",
      link: "/docs/connect/csv",
    },
    {
      name: "Manual Entry",
      icon: Keyboard,
      description: "Enter daily KPIs directly — useful when onboarding before your PMS is connected.",
      link: "/docs/connect/manual",
    },
  ];

  return (
    <DocsLayout
      title="Integrations"
      description="Connect your PMS and accounting software, or import data manually."
      tableOfContents={tableOfContents}
      nextPage={{ title: "Connect QuickBooks", href: "/docs/connect/quickbooks" }}
    >
      <section id="pms" className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">Property Management System</h2>
        <p className="text-muted-foreground mb-6">
          Your PMS is the primary data source for daily metrics — occupancy, ADR, RevPAR, and room revenue.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pmsIntegrations.map((integration) => (
            <Link
              key={integration.name}
              to={integration.link}
              className="flex items-center gap-4 p-4 border border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-vesta-navy flex items-center justify-center shrink-0">
                <Hotel className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {integration.name}
                </h3>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          More PMS integrations (Cloudbeds, Opera, Apaleo) are coming — contact us if yours isn't listed.
        </p>
      </section>

      <section id="accounting" className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">Accounting</h2>
        <p className="text-muted-foreground mb-6">
          Connect your accounting software to pull in expenses and P&L alongside your PMS data.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accountingIntegrations.map((integration) => (
            <Link
              key={integration.name}
              to={integration.link}
              className="flex items-center gap-4 p-4 border border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-white border border-border flex items-center justify-center p-2">
                <img
                  src={integration.logo}
                  alt={integration.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {integration.name}
                </h3>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="manual-options">
        <h2 className="text-2xl font-semibold mb-2">Manual / CSV</h2>
        <p className="text-muted-foreground mb-6">
          No PMS connection yet? Import from any export file or enter data directly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {manualOptions.map((option) => (
            <Link
              key={option.name}
              to={option.link}
              className="flex items-center gap-4 p-4 border border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <option.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {option.name}
                </h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </DocsLayout>
  );
};

export default Connect;
