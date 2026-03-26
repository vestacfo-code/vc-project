import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Deal } from '@/types/crm';
import { DollarSign, Calendar, TrendingUp, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (dealId: string) => void;
}

export const DealCard = ({ deal, onEdit, onDelete }: DealCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const formatCurrency = (value: number, currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$'
    };
    return `${symbols[currency] || currency} ${value.toLocaleString()}`;
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-green-500';
    if (probability >= 50) return 'text-yellow-500';
    if (probability >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4 cursor-move hover:shadow-md transition-shadow"
      {...attributes}
      {...listeners}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm line-clamp-2">{deal.title}</h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(deal); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 text-lg font-bold">
          <DollarSign className="h-4 w-4" />
          {formatCurrency(Number(deal.value), deal.currency)}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className={`h-3 w-3 ${getProbabilityColor(deal.probability)}`} />
            <span className={getProbabilityColor(deal.probability)}>{deal.probability}%</span>
          </div>
          {deal.expected_close_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(deal.expected_close_date), 'MMM d')}
            </div>
          )}
        </div>

        {deal.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{deal.notes}</p>
        )}
      </div>
    </Card>
  );
};
