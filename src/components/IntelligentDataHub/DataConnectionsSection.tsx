import { Calendar, RefreshCw, ExternalLink, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataConnectionsProps } from './types';
import { WaveButton } from '@/components/WaveButton';
import { ZohoButton } from '@/components/ZohoButton';
import QuickBooksButton from '@/components/QuickBooksButton';

const DataConnectionsSection = ({ connections, onIntegrationConnect }: DataConnectionsProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'disconnected':
        return 'outline';
      default:
        return 'outline';
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
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Data Sources
        </h3>
      </div>
      <div className="grid gap-4">
        {connections.map((connection, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm hover:from-card/90 hover:to-card/70 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <div className="text-3xl p-2 rounded-xl bg-secondary/50 border border-border/50">
                  {connection.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{connection.name}</h4>
                  {connection.lastSync && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>Last sync: {connection.lastSync}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge 
                  variant={getStatusColor(connection.status) as any}
                  className="px-3 py-1 rounded-full font-medium"
                >
                  {getStatusText(connection.status)}
                </Badge>
                {connection.type === 'integration' && connection.status === 'disconnected' && (
                  <>
                    {connection.name.toLowerCase().includes('quickbooks') && (
                      <QuickBooksButton 
                        onConnected={() => onIntegrationConnect(connection.name)}
                      />
                    )}
                    {connection.name.toLowerCase().includes('wave') && (
                      <WaveButton 
                        onConnected={() => onIntegrationConnect(connection.name)}
                      />
                    )}
                    {connection.name.toLowerCase().includes('zoho') && (
                      <ZohoButton 
                        onConnected={() => onIntegrationConnect(connection.name)}
                      />
                    )}
                    {!connection.name.toLowerCase().includes('quickbooks') && 
                     !connection.name.toLowerCase().includes('wave') && 
                     !connection.name.toLowerCase().includes('zoho') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onIntegrationConnect(connection.name)}
                        className="rounded-lg border-primary/40 hover:border-primary/60 bg-primary/10 hover:bg-primary/20 transition-all duration-200"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    )}
                  </>
                )}
                {connection.status === 'connected' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="rounded-lg hover:bg-secondary/50 transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataConnectionsSection;