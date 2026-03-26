import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AVAILABLE_FEATURES, FeatureKey } from '@/hooks/useConsumerFeatures';
import { Users, Package, FileText, DollarSign, BarChart3, TrendingUp, EyeOff } from 'lucide-react';

const FEATURE_ICONS: Record<FeatureKey, React.ReactNode> = {
  crm: <Users className="h-4 w-4" />,
  inventory: <Package className="h-4 w-4" />,
  invoicing: <FileText className="h-4 w-4" />,
  payroll: <DollarSign className="h-4 w-4" />,
  reporting_advanced: <BarChart3 className="h-4 w-4" />,
  competitive_pricing: <TrendingUp className="h-4 w-4" />,
  hide_dashboard: <EyeOff className="h-4 w-4" />,
};

interface FeatureManagerProps {
  enabledFeatures: FeatureKey[];
  onToggle: (featureKey: FeatureKey, enabled: boolean) => void;
  disabled?: boolean;
}

export function FeatureManager({ enabledFeatures, onToggle, disabled }: FeatureManagerProps) {
  return (
    <div className="space-y-3">
      {AVAILABLE_FEATURES.map((feature) => {
        const isEnabled = enabledFeatures.includes(feature.key);
        return (
          <div
            key={feature.key}
            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
              isEnabled ? 'border-primary/30 bg-primary/5' : 'border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {FEATURE_ICONS[feature.key]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className="font-medium">{feature.name}</Label>
                  {isEnabled && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(enabled) => onToggle(feature.key, enabled)}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );
}
