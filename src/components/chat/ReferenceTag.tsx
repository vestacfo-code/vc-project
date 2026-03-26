import { X } from 'lucide-react';
import { DashboardReference } from '@/contexts/DashboardReferenceContext';
import { BarChart3, DollarSign, TrendingUp, Users, Wallet, AlertTriangle } from 'lucide-react';

interface ReferenceTagProps {
  reference: DashboardReference;
  onRemove?: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'dollar-sign': <DollarSign className="h-3 w-3" />,
  'bar-chart': <BarChart3 className="h-3 w-3" />,
  'trending-up': <TrendingUp className="h-3 w-3" />,
  'users': <Users className="h-3 w-3" />,
  'wallet': <Wallet className="h-3 w-3" />,
  'alert-triangle': <AlertTriangle className="h-3 w-3" />,
};

export const ReferenceTag = ({ reference, onRemove }: ReferenceTagProps) => {
  return (
    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-sm border border-blue-200">
      <span className="text-blue-600">
        {iconMap[reference.icon || 'bar-chart'] || <BarChart3 className="h-3 w-3" />}
      </span>
      <span className="font-medium">{reference.name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
