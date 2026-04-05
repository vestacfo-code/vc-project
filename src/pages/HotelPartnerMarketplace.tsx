import { useCallback, useEffect } from 'react';
import { Handshake } from 'lucide-react';
import { PartnerCatalog } from '@/components/partners/PartnerCatalog';
import { usePartnerMarketplace } from '@/hooks/usePartnerMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { useHotelDashboard } from '@/hooks/useHotelDashboard';
import { supabase } from '@/integrations/supabase/client';

export default function HotelPartnerMarketplace() {
  const { user } = useAuth();
  const { hotelId } = useHotelDashboard();
  const { data, isLoading } = usePartnerMarketplace();

  useEffect(() => {
    document.title = 'Partner marketplace · Vesta CFO';
  }, []);

  const onOutboundClick = useCallback(
    async (partnerId: string, _url: string) => {
      if (!user?.id || !hotelId || data?.isFallback) return;
      const { error } = await supabase.from('partner_leads').insert({
        partner_id: partnerId,
        hotel_id: hotelId,
        user_id: user.id,
        source: 'marketplace',
      });
      if (error) console.warn('[marketplace] lead insert skipped', error.message);
    },
    [user?.id, hotelId, data?.isFallback]
  );

  return (
    <div className="min-h-full text-vesta-navy">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-start gap-3">
          <div className="rounded-xl border border-vesta-gold/30 bg-vesta-gold/15 p-2.5">
            <Handshake className="h-6 w-6 text-vesta-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-vesta-navy">Partner marketplace</h1>
            <p className="mt-1 max-w-xl text-sm text-vesta-navy/80">
              Browse vetted vendors. When you open a partner link from here, we record a marketplace lead for attribution — your
              team still completes purchases on the partner&apos;s site.
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-vesta-navy/10 bg-white p-4 shadow-sm sm:p-6">
          <PartnerCatalog
            partners={data?.rows ?? []}
            isFallback={data?.isFallback ?? false}
            loading={isLoading}
            onOutboundClick={onOutboundClick}
            tone="app"
          />
        </div>
      </div>
    </div>
  );
}
