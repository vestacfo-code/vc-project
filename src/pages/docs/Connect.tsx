import DocsLayout from "@/components/docs/DocsLayout";
import { Link } from "react-router-dom";
import quickbooksLogo from "@/assets/quickbooks-logo.png";
import xeroLogo from "@/assets/xero-logo.png";
import waveLogo from "@/assets/wave-logo.png";
import zohoLogo from "@/assets/zoho-logo.png";
import { FileSpreadsheet, Keyboard } from "lucide-react";

const tableOfContents = [
  { id: "accounting-software", title: "Accounting Software", href: "#accounting-software" },
  { id: "manual-options", title: "Manual Options", href: "#manual-options" },
];

const Connect = () => {
  const integrations = [
    {
      name: "QuickBooks",
      logo: quickbooksLogo,
      description: "Connect your QuickBooks Online account for automatic data sync",
      link: "/docs/connect/quickbooks",
    },
    {
      name: "Xero",
      logo: xeroLogo,
      description: "Integrate with Xero to import your financial data",
      link: "/docs/connect/xero",
    },
    {
      name: "Wave",
      logo: waveLogo,
      description: "Connect Wave accounting for seamless data import",
      link: "/docs/connect/wave",
    },
    {
      name: "Zoho Books",
      logo: zohoLogo,
      description: "Sync your Zoho Books data automatically",
      link: "/docs/connect/zoho",
    },
  ];

  const manualOptions = [
    {
      name: "Upload CSV",
      icon: FileSpreadsheet,
      description: "Import financial data from spreadsheets and CSV files",
      link: "/docs/connect/csv",
    },
    {
      name: "Manual Entry",
      icon: Keyboard,
      description: "Enter your financial data directly into Finlo",
      link: "/docs/connect/manual",
    },
  ];

  return (
    <DocsLayout
      title="Integrations"
      description="Connect your accounting software or import data manually to get started with Finlo."
      tableOfContents={tableOfContents}
      nextPage={{ title: "Connect QuickBooks", href: "/docs/connect/quickbooks" }}
    >
      <section id="accounting-software" className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Accounting Software</h2>
        <p className="text-muted-foreground mb-6">
          Connect your existing accounting software to automatically sync your financial data with Finlo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration) => (
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
        <h2 className="text-2xl font-semibold mb-6">Manual Options</h2>
        <p className="text-muted-foreground mb-6">
          Don't use accounting software? You can still get started by uploading spreadsheets or entering data manually.
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
