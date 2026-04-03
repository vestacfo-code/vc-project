import { useEffect } from 'react';
import IntegrationChat from '@/components/IntegrationChat';

/**
 * AI assistant inside the hotel shell (sidebar + bottom nav).
 * Uses IntegrationChat in `hotel` variant — distinct from legacy /app ChatHub.
 */
export default function HotelChatPage() {
  useEffect(() => {
    document.title = 'Assistant · Vesta CFO';
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 min-h-[calc(100dvh-4.5rem)] lg:min-h-[calc(100vh-1rem)]">
      <IntegrationChat variant="hotel" />
    </div>
  );
}
