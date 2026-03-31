import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MarketingPageShell } from '@/components/marketing/MarketingPageShell';
import { TellUsMoreSection } from '@/components/marketing/TellUsMoreSection';
import { PartnerCatalog } from '@/components/partners/PartnerCatalog';
import { usePartnerMarketplace } from '@/hooks/usePartnerMarketplace';
import { morphSpringSoft } from '@/lib/motion';

export default function Partners() {
  const { data, isLoading } = usePartnerMarketplace();

  useEffect(() => {
    document.title = 'Partner marketplace · Vesta CFO';
  }, []);

  return (
    <MarketingPageShell>
      <div className="relative overflow-hidden bg-white">
        <section className="relative max-w-6xl mx-auto px-6 pt-10 sm:pt-14 pb-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={morphSpringSoft}
            className="text-xs font-mono tracking-widest uppercase text-violet-800 bg-violet-100 border border-violet-200 rounded-full px-3 py-1 inline-block mb-4"
          >
            Trusted vendors
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ ...morphSpringSoft, delay: 0.05 }}
            className="font-serif text-4xl sm:text-5xl font-normal text-slate-900 leading-tight max-w-3xl"
          >
            Partner marketplace for hotel operations
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...morphSpringSoft, delay: 0.1 }}
            className="mt-6 text-lg text-slate-600 max-w-2xl leading-relaxed"
          >
            We onboard vetted partners so you can discover supplies, technology, and services without leaving Vesta. Our first
            featured partner is{' '}
            <a
              href="https://thelotusgroup.us/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-700 font-semibold hover:underline"
            >
              The Lotus Group
            </a>{' '}
            — sustainable food packaging and custom-branded disposables for F&B, banquets, and retail. Signed-in hotel teams
            get the same catalog inside the app with click attribution for partnership programs.
          </motion.p>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-16">
          <PartnerCatalog
            partners={data?.rows ?? []}
            isFallback={data?.isFallback ?? false}
            loading={isLoading}
          />
        </section>

        <TellUsMoreSection className="bg-slate-50 border-t border-slate-100" />
      </div>
    </MarketingPageShell>
  );
}
