import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { MarketingPageShell } from '@/components/marketing/MarketingPageShell';
import { VESTA_SAAS_TIERS } from '@/brand/vesta-cfo-brand';

const SALES_CALENDAR = 'https://calendar.app.google/PWqhmizMxqUnRNpP9';

const Pricing = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [hasLegacySubscription, setHasLegacySubscription] = useState(false);

  const enterpriseReveal = useScrollReveal({ threshold: 0.15 });
  const faqReveal = useScrollReveal({ threshold: 0.1 });

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        if (!error && data?.tier && (data.tier === 'scale' || data.tier === 'ceo')) {
          setHasLegacySubscription(true);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [session]);

  const handleManageLegacyBilling = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to open billing portal';
      toast.error(msg);
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <MarketingPageShell>
      <div className="min-h-screen bg-gradient-to-b from-vesta-cream via-white to-vesta-mist/40 flex flex-col relative overflow-hidden text-slate-900">
        <div className="absolute top-20 left-[10%] w-[28rem] h-[28rem] bg-vesta-navy/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-32 right-[8%] w-80 h-80 bg-vesta-gold/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex-1">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 max-w-7xl">
            <div className="text-center mb-12 md:mb-16 px-4 max-w-3xl mx-auto">
              <Badge className="mb-5 bg-vesta-navy/10 text-vesta-navy border-vesta-navy/20 hover:bg-vesta-navy/15">
                Vesta CFO · Hotel platform
              </Badge>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-vesta-navy leading-tight mb-5 tracking-tight">
                Pricing built for <span className="text-vesta-gold">properties</span>, not spreadsheets.
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                Three SaaS tiers from our product roadmap: Starter for independents, Growth for small chains, Enterprise for
                large portfolios. Add-on revenue comes from the{' '}
                <span className="text-vesta-navy font-medium">partner marketplace</span> when we help you switch to vetted
                vendors.
              </p>
            </div>

            {session && (
              <div className="max-w-3xl mx-auto mb-10 rounded-2xl border border-vesta-navy/15 bg-white/70 backdrop-blur-md px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                <p className="text-sm text-slate-600">
                  Signed in — open your hotel dashboard or legacy assistant billing (if any).
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="border-vesta-navy/25 text-vesta-navy" asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  {hasLegacySubscription && (
                    <Button
                      size="sm"
                      className="bg-vesta-navy hover:bg-vesta-navy/90 text-white"
                      onClick={handleManageLegacyBilling}
                      disabled={loadingPortal}
                    >
                      {loadingPortal ? 'Opening…' : 'Billing portal'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16">
              {VESTA_SAAS_TIERS.map((tier) => (
                <Card
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl overflow-hidden border bg-white/75 backdrop-blur-xl shadow-[0_8px_32px_rgba(27,58,92,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(27,58,92,0.12)] ${
                    tier.highlight
                      ? 'border-vesta-gold/50 ring-2 ring-vesta-gold/30 lg:scale-[1.02]'
                      : 'border-vesta-navy/10'
                  }`}
                >
                  {tier.highlight && (
                    <Badge className="absolute top-4 right-4 bg-vesta-gold text-white border-0 font-semibold text-[10px] uppercase tracking-wider">
                      Most operators
                    </Badge>
                  )}
                  <CardHeader className="pb-2 pt-8 px-6">
                    <CardTitle className="text-xl font-semibold text-vesta-navy">{tier.name}</CardTitle>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1">{tier.audience}</p>
                    <div className="mt-5 mb-1">
                      <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-vesta-navy">{tier.price}</span>
                      {tier.priceDetail ? (
                        <span className="text-slate-600 text-sm font-normal ml-1">{tier.priceDetail}</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed min-h-[2.75rem]">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col px-6 pb-8 pt-2">
                    {tier.external ? (
                      <Button
                        className="w-full h-11 rounded-xl bg-vesta-navy hover:bg-vesta-navy/90 text-white font-semibold shadow-md mb-6"
                        asChild
                      >
                        <a href={tier.ctaHref} target="_blank" rel="noopener noreferrer">
                          {tier.cta}
                          <ExternalLink className="w-4 h-4 ml-2 inline" />
                        </a>
                      </Button>
                    ) : tier.ctaHref === '/auth' ? (
                      <Button
                        className="w-full h-11 rounded-xl bg-vesta-gold hover:bg-vesta-gold/90 text-vesta-navy font-semibold shadow-md mb-6"
                        onClick={() => navigate('/auth?redirect=/onboarding')}
                      >
                        {tier.cta}
                      </Button>
                    ) : (
                      <Button
                        className="w-full h-11 rounded-xl bg-vesta-navy hover:bg-vesta-navy/90 text-white font-semibold shadow-md mb-6"
                        asChild
                      >
                        <Link to={tier.ctaHref}>{tier.cta}</Link>
                      </Button>
                    )}
                    <ul className="space-y-3 flex-1 border-t border-slate-200/80 pt-6">
                      {tier.features.map((f) => (
                        <li key={f} className="flex gap-2.5 text-sm text-slate-600 leading-relaxed">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div
              ref={enterpriseReveal.ref}
              className={`max-w-3xl mx-auto mb-16 rounded-2xl border border-vesta-navy/10 bg-white/60 backdrop-blur-lg p-8 md:p-10 text-center shadow-sm ${
                enterpriseReveal.isVisible ? 'animate-fadeSlideUp opacity-100' : 'opacity-0'
              }`}
            >
              <h3 className="font-serif text-2xl text-vesta-navy mb-3">Marketplace & data revenue</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Beyond subscription: our roadmap includes affiliate savings when you switch to vetted partners (linen, F&amp;B,
                utilities, and more), and long-term anonymized benchmarking insights for the industry. Details in our investor
                and operator deck — ask on a sales call.
              </p>
              <Button className="bg-vesta-gold hover:bg-vesta-gold/90 text-vesta-navy font-semibold rounded-xl" asChild>
                <a href={SALES_CALENDAR} target="_blank" rel="noopener noreferrer">
                  Book a call
                  <ExternalLink className="w-4 h-4 ml-2 inline" />
                </a>
              </Button>
            </div>

            <div
              ref={faqReveal.ref}
              className={`max-w-3xl mx-auto mb-8 px-2 ${faqReveal.isVisible ? 'animate-fadeSlideUp opacity-100' : 'opacity-0'}`}
            >
              <h2 className="font-serif text-2xl sm:text-3xl text-vesta-navy text-center mb-8">Questions</h2>
              <Accordion type="single" collapsible className="w-full space-y-3">
                <AccordionItem value="1" className="bg-white/80 border border-vesta-navy/10 rounded-2xl px-4 sm:px-5">
                  <AccordionTrigger className="text-left text-vesta-navy hover:no-underline">
                    What&apos;s included in Starter vs Growth?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-sm leading-relaxed">
                    Starter covers one connected PMS, daily AI summary, anomaly alerts, and the core hotel dashboard. Growth adds
                    benchmarking, forecasting, multiple properties and PMS connections, and AI-driven partner recommendations
                    from the marketplace — per our published roadmap.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="2" className="bg-white/80 border border-vesta-navy/10 rounded-2xl px-4 sm:px-5">
                  <AccordionTrigger className="text-left text-vesta-navy hover:no-underline">
                    Do you replace my accountant?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-sm leading-relaxed">
                    No. Vesta CFO is an operator-facing layer: faster answers from your PMS and financial data, alerts, and
                    exports. Your CPA or corporate finance team still owns tax, audit, and statutory reporting.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="3" className="bg-white/80 border border-vesta-navy/10 rounded-2xl px-4 sm:px-5">
                  <AccordionTrigger className="text-left text-vesta-navy hover:no-underline">
                    Which systems do you integrate with?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-sm leading-relaxed">
                    Priority is PMS (Mews, Cloudbeds, Oracle Opera, and others over time), plus CSV and manual metrics. OTAs,
                    payroll, F&amp;B POS, accounting, and banking are staged on the roadmap — Enterprise customers can prioritize
                    specific adapters.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="4" className="bg-white/80 border border-vesta-navy/10 rounded-2xl px-4 sm:px-5">
                  <AccordionTrigger className="text-left text-vesta-navy hover:no-underline">
                    How does Enterprise pricing work?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-sm leading-relaxed">
                    For roughly fifteen or more properties, or complex data requirements, we quote custom packages — typically
                    from about $2,000/month — with SLAs, dedicated support, and custom integrations as needed.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="5" className="bg-white/80 border border-vesta-navy/10 rounded-2xl px-4 sm:px-5">
                  <AccordionTrigger className="text-left text-vesta-navy hover:no-underline">
                    Is my data secure?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-sm leading-relaxed">
                    We use encrypted transport and storage, tenant isolation, and industry-standard hosting. Enterprise agreements
                    can include additional security documentation.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
};

export default Pricing;
