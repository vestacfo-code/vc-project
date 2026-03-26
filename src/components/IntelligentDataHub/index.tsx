import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

import { DataConnection, FinancialInsight } from './types';
import ConsolidatedDocumentHub from '../ConsolidatedDocumentHub';
import PythonExcelProcessor from '../PythonExcelProcessor';
import HeroSection from './HeroSection';
import { useFileUploadHandler } from './FileUploadHandler';
import { useIntegrationManager } from './IntegrationManager';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';

const IntelligentDataHub = () => {
  const [connections, setConnections] = useState<DataConnection[]>([
    {
      name: 'Financial Data CSV',
      type: 'file',
      status: 'disconnected',
      icon: '📊'
    },
    {
      name: 'QuickBooks',
      type: 'integration',
      status: 'disconnected',
      icon: '💼'
    },
    {
      name: 'Xero',
      type: 'integration',
      status: 'disconnected',
      icon: '📈'
    },
    {
      name: 'Stripe',
      type: 'integration',
      status: 'pending',
      icon: '💳'
    }
  ]);

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<FinancialInsight | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [personalizedContext, setPersonalizedContext] = useState<string>('');

  const { requireTermsAcceptance } = useTermsAcceptance();

  const { handleFileUpload } = useFileUploadHandler({
    connections,
    setConnections,
    setIsUploading,
    setInsights,
    setPersonalizedContext,
    setUploadSuccess,
    requireTermsAcceptance
  });

  const { triggerPersonalizedAnalysis, handleIntegrationConnect } = useIntegrationManager({
    insights
  });

  return (
    <div className="space-y-8">
      <HeroSection />

      {/* Main Content Card */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
        <CardContent className="p-6">
          <ConsolidatedDocumentHub />
        </CardContent>
      </Card>

      {/* Python Excel Processor - Bottom Right */}
      <div className="flex justify-end">
        <div className="w-96">
          <PythonExcelProcessor />
        </div>
      </div>
    </div>
  );
};

export default IntelligentDataHub;