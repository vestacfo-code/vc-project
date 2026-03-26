import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Calendar, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataConnection {
  name: string;
  type: 'file' | 'integration';
  status: 'connected' | 'disconnected' | 'pending';
  lastSync?: string;
  icon: string;
}

const DataUploadHub = () => {
  const [connections, setConnections] = useState<DataConnection[]>([
    {
      name: 'Uploaded CSV',
      type: 'file',
      status: 'connected',
      lastSync: '2024-01-15',
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
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // Simulate upload process
    setTimeout(() => {
      setConnections(prev => prev.map(conn => 
        conn.name === 'Uploaded CSV' 
          ? { ...conn, status: 'connected' as const, lastSync: new Date().toISOString().split('T')[0] }
          : conn
      ));
      
      setIsUploading(false);
      toast({
        title: "Data uploaded successfully!",
        description: "Your financial data has been processed and is ready for analysis.",
      });
    }, 2000);
  };

  const handleIntegrationConnect = (connectionName: string) => {
    toast({
      title: "Integration setup",
      description: `${connectionName} integration will be available soon. For now, please upload CSV files.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'pending':
        return 'warning';
      case 'disconnected':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'pending':
        return 'Pending';
      case 'disconnected':
        return 'Not Connected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Upload className="w-6 h-6 text-primary" />
            <CardTitle>Financial Data Hub</CardTitle>
          </div>
          <CardDescription>
            Upload your financial data or connect your accounting software
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Upload Financial Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your CSV or Excel files here, or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  multiple
                />
                <label htmlFor="file-upload">
                  <Button asChild disabled={isUploading}>
                    <span className="cursor-pointer">
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Files
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Data Connections */}
          <div>
            <h3 className="font-semibold mb-4">Data Sources</h3>
            <div className="grid gap-4">
              {connections.map((connection, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{connection.icon}</span>
                    <div>
                      <h4 className="font-medium">{connection.name}</h4>
                      {connection.lastSync && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Last sync: {connection.lastSync}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={getStatusColor(connection.status) as any}>
                      {getStatusText(connection.status)}
                    </Badge>
                    {connection.type === 'integration' && connection.status === 'disconnected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIntegrationConnect(connection.name)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    )}
                    {connection.status === 'connected' && (
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Data Format Requirements</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• CSV or Excel files with columns: Date, Revenue, Expenses, Category</li>
              <li>• Date format: YYYY-MM-DD or MM/DD/YYYY</li>
              <li>• Numbers should be in standard format (no currency symbols in CSV)</li>
              <li>• Each row represents a transaction or period summary</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataUploadHub;