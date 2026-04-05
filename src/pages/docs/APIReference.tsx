import DocsLayout from "@/components/docs/DocsLayout";
import { Construction } from "lucide-react";

const APIReference = () => {
  return (
    <DocsLayout 
      title="API Reference" 
      description="Integrate Vesta into your own applications."
    >
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="border border-vesta-navy/10 bg-white rounded-full p-6 mb-6">
          <Construction className="h-12 w-12 text-vesta-navy-muted" />
        </div>
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Coming Soon</h2>
        <p className="text-vesta-navy-muted max-w-md">
          We're working on a comprehensive REST API that will allow you to integrate Vesta's 
          financial intelligence into your own applications and workflows.
        </p>
      </div>
    </DocsLayout>
  );
};

export default APIReference;
