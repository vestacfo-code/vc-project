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
    <div className="min-h-full text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-500/15 border border-amber-500/25 p-2.5">
            <Handshake className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Partner marketplace</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Browse vetted vendors. When you open a partner link from here, we record a marketplace lead for attribution — your
              team still completes purchases on the partner&apos;s site.
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/40 p-4 sm:p-6">
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
