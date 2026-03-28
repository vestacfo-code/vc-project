import DocsLayout from "@/components/docs/DocsLayout";
import { Construction } from "lucide-react";

const Webhooks = () => {
  return (
    <DocsLayout 
      title="Webhook Events" 
      description="Receive real-time notifications for financial events."
    >
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-full p-6 mb-6">
          <Construction className="h-12 w-12 text-[#7ba3e8]" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-4">Coming Soon</h2>
        <p className="text-slate-400 max-w-md">
          Webhooks will allow you to receive real-time notifications when important events happen 
          in your Vesta account, such as new transactions or cash flow alerts.
        </p>
      </div>
    </DocsLayout>
  );
};

export default Webhooks;
