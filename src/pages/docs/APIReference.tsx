import DocsLayout from "@/components/docs/DocsLayout";
import { Construction } from "lucide-react";

const APIReference = () => {
  return (
    <DocsLayout 
      title="API Reference" 
      description="Integrate Finlo into your own applications."
    >
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-full p-6 mb-6">
          <Construction className="h-12 w-12 text-[#7ba3e8]" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-4">Coming Soon</h2>
        <p className="text-slate-400 max-w-md">
          We're working on a comprehensive REST API that will allow you to integrate Finlo's 
          financial intelligence into your own applications and workflows.
        </p>
      </div>
    </DocsLayout>
  );
};

export default APIReference;
