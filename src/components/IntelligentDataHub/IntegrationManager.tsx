import { useToast } from '@/hooks/use-toast';
import { FinancialInsight } from './types';

interface IntegrationManagerProps {
  insights: FinancialInsight | null;
}

export const useIntegrationManager = ({ insights }: IntegrationManagerProps) => {
  const { toast } = useToast();

  const triggerPersonalizedAnalysis = async (financialSummary?: any) => {
    if (!insights) {
      toast({
        title: "No data to analyze",
        description: "Please upload your financial data first to get AI analysis.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Analysis already available",
      description: "Your data has been analyzed using AI. Upload new data for fresh analysis.",
    });
  };

  const handleIntegrationConnect = (connectionName: string) => {
    // This is now handled by the specific integration buttons (WaveButton, ZohoButton, etc.)
    // in DataConnectionsSection, so we don't need to show a generic "coming soon" message
    console.log('Integration connect triggered for:', connectionName);
  };

  return { triggerPersonalizedAnalysis, handleIntegrationConnect };
};