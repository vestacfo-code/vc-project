export interface DataConnection {
  name: string;
  type: 'file' | 'integration';
  status: 'connected' | 'disconnected' | 'pending';
  lastSync?: string;
  icon: string;
}

export interface FinancialInsight {
  summary: string;
  keyMetrics: {
    revenue: number | null;
    expenses: number | null;
    profit: number | null;
    cashFlow: number | null;
  };
  insights: {
    title: string;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
    impact: 'high' | 'medium' | 'low';
  }[];
  recommendations: string[];
  healthScore: number | null;
  reasoning?: {
    revenueCalculation?: string;
    expenseCalculation?: string;
    dataRowsProcessed?: string;
    columnsUsed?: string;
    documentAnalysis?: string;
  } | null;
  riskFactors: string[];
}

export interface FileUploadProps {
  isUploading: boolean;
  isAnalyzing: boolean;
  uploadSuccess: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerAnalysis: () => void;
}

export interface DataConnectionsProps {
  connections: DataConnection[];
  onIntegrationConnect: (connectionName: string) => void;
}

export interface AIAnalysisProps {
  isUploading: boolean;
  isAnalyzing: boolean;
  insights: FinancialInsight | null;
  personalizedContext: string;
  formatCurrency: (amount: number) => string;
}

export interface PersonalInsightsProps {
  insights: FinancialInsight | null;
}