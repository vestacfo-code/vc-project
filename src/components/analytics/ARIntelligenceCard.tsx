import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ARIntelligence } from '@/hooks/useQuickBooksAnalytics';
import { ChatIconButton } from './ChatIconButton';

interface ARIntelligenceCardProps {
  data: ARIntelligence;
}

export const ARIntelligenceCard = ({ data }: ARIntelligenceCardProps) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  // Calculate average days late from profiles
  const avgDaysLate = data.customerProfiles.length > 0
    ? Math.round(data.customerProfiles.reduce((sum, p) => sum + p.avgDaysLate, 0) / data.customerProfiles.length)
    : 0;

  // Calculate total outstanding from profiles
  const totalOutstanding = data.customerProfiles.reduce((sum, p) => sum + p.totalRevenue, 0);

  const reference = {
    id: 'ar-intelligence',
    name: 'AR Intelligence',
    type: 'Financial Metric',
    icon: 'users',
    data: `AR analysis: ${formatCurrency(totalOutstanding)} outstanding, ${avgDaysLate} days avg late.`
  };

  return (
    <Card className="bg-white border border-vesta-navy/10 group hover:shadow-md transition-all">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium text-vesta-navy/90">AR Intelligence</CardTitle>
        <ChatIconButton reference={reference} />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Metrics */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-vesta-navy/65 mb-1">At Risk</p>
            <p className="text-2xl font-medium text-red-700">{formatCurrency(data.atRiskAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-vesta-navy/65 mb-1">Avg Days Late</p>
            <p className="text-2xl font-medium text-vesta-navy">{avgDaysLate}</p>
          </div>
        </div>

        {/* Customer Risk Profiles - Simplified */}
        {data.customerProfiles.length > 0 && (
          <div className="pt-4 border-t border-vesta-navy/8 space-y-2">
            <p className="text-xs text-vesta-navy/65 mb-3">Payment Risk</p>
            {data.customerProfiles.slice(0, 4).map((profile, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-vesta-mist/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-vesta-navy truncate">{profile.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      profile.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                      profile.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {profile.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-vesta-navy/65">
                    <span>{formatCurrency(profile.totalRevenue)}</span>
                    <span>•</span>
                    <span>{profile.avgDaysLate}d avg late</span>
                    <span>•</span>
                    <span>Score: {profile.score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Insight Only */}
        {data.insights && data.insights.length > 0 && (
          <div className="pt-4 border-t border-vesta-navy/8">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-vesta-navy/90 leading-relaxed">{data.insights[0].action}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
