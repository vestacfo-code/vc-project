import DocsLayout from "@/components/docs/DocsLayout";
import { Construction } from "lucide-react";

const Webhooks = () => {
  return (
    <DocsLayout 
      title="Webhook Events" 
      description="Receive real-time notifications for financial events."
    >
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="border border-vesta-navy/10 bg-white rounded-full p-6 mb-6">
          <Construction className="h-12 w-12 text-vesta-navy-muted" />
        </div>
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Coming Soon</h2>
        <p className="text-vesta-navy-muted max-w-md">
          Webhooks will allow you to receive real-time notifications when important events happen 
          in your Vesta account, such as new transactions or cash flow alerts.
        </p>
      </div>
    </DocsLayout>
  );
};

export default Webhooks;
