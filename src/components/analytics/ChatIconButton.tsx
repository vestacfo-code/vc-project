import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useDashboardReference, DashboardReference } from '@/contexts/DashboardReferenceContext';

interface ChatIconButtonProps {
  reference: DashboardReference;
}

export const ChatIconButton = ({ reference }: ChatIconButtonProps) => {
  const navigate = useNavigate();
  const { setPendingReference } = useDashboardReference();

  const handleClick = () => {
    setPendingReference(reference);
    navigate('/app');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      aria-label="Ask questions about this metric"
    >
      <MessageSquare className="h-4 w-4" />
    </Button>
  );
};
