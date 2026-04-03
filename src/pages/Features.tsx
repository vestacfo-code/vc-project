import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  AlertTriangle,
  FileText,
  Plug,
  Shield,
  Users,
  Zap,
  LineChart,
  Bell,
  Sparkles,
  Handshake,
  PieChart,
  ClipboardList,
} from 'lucide-react';
import { MarketingPageShell } from '@/components/marketing/MarketingPageShell';
import { TellUsMoreSection } from '@/components/marketing/TellUsMoreSection';
import { marketingImages } from '@/lib/marketing-images';
import { morphSpringSoft } from '@/lib/motion';

const accentRings = ['bg-vesta-mist/90', 'bg-vesta-gold/20', 'bg-emerald-100', 'bg-slate-100', 'bg-rose-100', 'bg-cyan-100'] as const;

const capabilityGroups = [
  {
    title: 'AI financial summary & insights',
    blurb: 'Domain A on our roadmap: plain-English intelligence from your property data — the “brain” of Vesta CFO.',
    items: [
      {
        icon: BarChart3,
        title: 'Live KPI dashboard',
        description:
          'RevPAR, ADR, occupancy, GOPPAR, and channel mix in one place — refreshed daily from your PMS or uploads.',
      },
      {
        icon: LineChart,
        title: 'Trends & comparisons',
        description:
          'Spot patterns across weeks and seasons. Compare against your own history, compset-style benchmarks, and budget.',
      },
      {
        icon: FileText,
        title: 'Reports that read like English',
        description:
          'Export-ready summaries for lenders, partners, and internal stand-ups — without rebuilding spreadsheets.',
      },
    ],
  },
  {
    title: 'Ask AI & variance explanations',
    blurb: 'Natural-language Q&A over your metrics, plus automatic “why” when KPIs move — not generic SMB advice.',
    items: [
      {
        icon: Brain,
        title: 'Daily AI briefings',
        description:
          'Every morning: what moved, why it probably happened, and what deserves attention before the day runs away from you.',
      },
      {
        icon: Sparkles,
        title: 'Ask your numbers anything',
        description:
          'Natural-language questions over your property data — occupancy dips, F&B attach, channel shift, and more.',
      },
      {
        icon: Zap,
        title: 'Faster decisions',
        description:
          'Cut time spent reconciling exports and chasing variances. Spend it on pricing, staffing, and guest experience.',
      },
    ],
  },
  {
    title: 'Real-time monitoring & alerts',
    blurb: 'Domain C: revenue, labor, F&B, and OTA commission signals — early warning before month-end.',
    items: [
      {
        icon: AlertTriangle,
        title: 'Anomaly alerts',
        description:
          'Unexpected RevPAR drops, occupancy gaps, cost spikes, and other outliers surface automatically.',
      },
      {
        icon: Bell,
        title: 'Focused notifications',
        description:
          'Fewer noisy emails — alerts tie back to the metrics you already track in Vesta.',
      },
      {
        icon: Shield,
        title: 'Role-aware access',
        description:
          'Team members see what they need for their role; owners keep the full financial picture.',
      },
    ],
  },
  {
    title: 'Integrations & team workspace',
    blurb: 'Domain E + collaboration: PMS-first connectors, CSV/manual paths, and role-aware access for your staff.',
    items: [
      {
        icon: Plug,
        title: 'PMS & file imports',
        description:
          'Connect integrations where available, or upload CSV exports — we normalize the messy parts.',
      },
      {
        icon: Users,
        title: 'Team workspace',
        description:
          'Invite finance, revenue, and operations so everyone works from the same daily view.',
      },
      {
        icon: FileText,
        title: 'Docs & deep dives',
        description:
          'Jump from high-level KPIs into documentation, setup guides, and advanced workflows when you need them.',
      },
    ],
  },
  {
    title: 'Cost Cutter, marketplace & planning',
    blurb: 'Domain B + D: spend visibility, partner recommendations, budget vs actual, reports, and curated vendors (e.g. Lotus Group).',
    items: [
      {
        icon: PieChart,
        title: 'Budget vs actual',
        description:
          'Set monthly targets for RevPAR, occupancy, and GOP. Track variance in real time against what you planned.',
      },
      {
        icon: ClipboardList,
        title: 'Reports workspace',
        description:
          'A dedicated reports area for export-ready summaries — ideal for stand-ups, lenders, and owner updates.',
      },
      {
        icon: Handshake,
        title: 'Partner marketplace',
        description:
          'Curated vendors with product lines and outbound links. Launch partner: The Lotus Group for sustainable F&B packaging — live on the marketing site and inside the hotel app with lead attribution.',
      },
    ],
  },
];

const platformChecklist = [
  'Daily AI briefing & weekly report-style summaries (roadmap by release)',
  'Ask AI over your property data + variance “why” explanations',
  'Core metrics: RevPAR, ADR, occupancy, GOPPAR, TRevPAR, labor ratio, F&B margin, channel mix',
  'Revenue, labor, F&B, and OTA commission monitoring & alerts',
  'Spend analysis & cost anomaly detection (Cost Cutter domain)',
  'Partner marketplace recommendations with tracked outbound links',
  'PMS integrations (Mews, Cloudbeds, Opera, …) plus CSV / manual paths',
  'Benchmarking, forecasting, and scenario modeling (Growth+ on roadmap)',
  'Multi-property portfolio view for operators with several assets',
  'Budget vs actual, reports workspace, team roles & property-scoped access',
];

const highlights = [
  'Vesta CFO is built for independent hotels and small chains — not generic SMB accounting templates.',
  'Hotel-native metrics out of the box: RevPAR, ADR, GOPPAR, channel mix, and more.',
  'Designed for daily use: fast loads, mobile-friendly summaries, and alerts that respect your time.',
  'Optional multi-property rollups as you grow — same product, broader portfolio view.',
];

export default function Features() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Features · Vesta CFO';
  }, []);

  return (
    <MarketingPageShell>
      <div className="relative overflow-hidden bg-white">
        <div aria-hidden className="pointer-events-none absolute top-0 right-0 w-[min(100%,480px)] h-96 bg-slate-100 rounded-full blur-3xl opacity-80" />

        <section className="relative max-w-6xl mx-auto px-6 pt-10 sm:pt-14 pb-12">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div className="text-center lg:text-left">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={morphSpringSoft}
                className="text-xs font-mono tracking-widest uppercase text-vesta-navy bg-vesta-mist/80 border border-vesta-navy/15 rounded-full px-3 py-1 inline-block mb-4"
              >
                Product overview
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ ...morphSpringSoft, delay: 0.05 }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-900 leading-tight"
              >
                Run hotel finance with{' '}
                <span className="text-vesta-gold">confidence.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...morphSpringSoft, delay: 0.12 }}
                className="mt-6 text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Dashboards, AI briefings, anomaly detection, and team workflows — in one platform shaped around how hotels
                actually operate. Below is a detailed map of what you get; if something is missing for your stack, tell us — we
                prioritize roadmaps from real operator feedback.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...morphSpringSoft, delay: 0.2 }}
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={morphSpringSoft}
                  onClick={() => navigate('/auth')}
                  className="bg-vesta-gold hover:bg-vesta-gold/90 text-vesta-navy font-semibold px-8 py-3.5 rounded-xl text-base shadow-md"
                >
                  Start free
                </motion.button>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center border-2 border-vesta-navy/15 hover:border-vesta-gold/50 text-vesta-navy font-medium px-8 py-3.5 rounded-xl text-base bg-white transition-colors"
                >
                  View pricing
                </Link>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...morphSpringSoft, delay: 0.1 }}
              className="mt-10 lg:mt-0"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-vesta-navy/10">
                <img
                  src={marketingImages.workspace.src}
                  alt={marketingImages.workspace.alt}
                  className="w-full h-64 sm:h-80 object-cover"
                  width={900}
                  height={600}
                  loading="lazy"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative border-y border-slate-100 bg-white/80 py-14 sm:py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-serif text-2xl sm:text-3xl text-slate-900 text-center mb-10">Why teams choose Vesta</h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {highlights.map((text, i) => (
                <motion.li
                  key={text}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ ...morphSpringSoft, delay: i * 0.06 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 leading-relaxed shadow-sm"
                >
                  <span className="text-vesta-navy font-mono text-xs tracking-wider uppercase block mb-2">0{i + 1}</span>
                  {text}
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        <section className="relative py-14 sm:py-16 border-t border-slate-100 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-serif text-2xl sm:text-3xl text-slate-900 text-center mb-4">Everything in one workspace</h2>
            <p className="text-center text-slate-600 text-sm max-w-2xl mx-auto mb-10">
              If it ships in the hotel app or on the marketing site today, it is represented below — including the partner
              marketplace and admin tooling for your team.
            </p>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm text-slate-700">
              {platformChecklist.map((line) => (
                <li key={line} className="flex gap-2 items-start">
                  <span className="text-amber-600 font-bold mt-0.5" aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {capabilityGroups.map((group, gi) => (
          <section
            key={group.title}
            className={
              gi % 2 === 0
                ? 'relative py-16 sm:py-20 bg-white'
                : 'relative py-16 sm:py-20 border-t border-slate-100 bg-slate-50'
            }
          >
            <div className="max-w-6xl mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={morphSpringSoft}
                className="max-w-2xl mb-12 sm:mb-14"
              >
                <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 font-normal mb-3">{group.title}</h2>
                <p className="text-slate-600 text-lg leading-relaxed">{group.blurb}</p>
              </motion.div>
              <div className="grid md:grid-cols-3 gap-6">
                {group.items.map((item, ii) => {
                  const ring = accentRings[(gi * 3 + ii) % accentRings.length];
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      viewport={{ once: true, margin: '-30px' }}
                      transition={{ ...morphSpringSoft, delay: ii * 0.06 }}
                      whileHover={{ y: -4, boxShadow: '0 16px 40px -12px rgba(27, 58, 92, 0.12)' }}
                      className="rounded-2xl border border-slate-200 bg-white p-7 flex flex-col gap-4 shadow-sm hover:border-vesta-gold/35"
                    >
                      <div className={`w-12 h-12 rounded-xl ${ring} flex items-center justify-center`}>
                        <item.icon className="w-6 h-6 text-slate-800" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-serif text-xl text-slate-900 font-normal">{item.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed flex-1">{item.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

        <section className="relative py-12 px-6 bg-slate-50 border-t border-slate-100">
          <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-lg border border-slate-200 flex flex-col md:flex-row">
            <img
              src={marketingImages.analytics.src}
              alt={marketingImages.analytics.alt}
              className="md:w-1/2 h-56 md:h-auto object-cover"
              width={800}
              height={400}
              loading="lazy"
            />
            <div className="md:w-1/2 p-8 flex flex-col justify-center bg-white">
              <h3 className="font-serif text-2xl text-slate-900 mb-3">Still unsure where to start?</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Send us a short note about your property type, room count, and PMS. We&apos;ll point you to the fastest path in
                docs — or schedule a walkthrough if you prefer a live tour.
              </p>
              <Link to="/contact" className="text-vesta-navy font-semibold hover:underline">
                Go to contact →
              </Link>
            </div>
          </div>
        </section>

        <TellUsMoreSection className="bg-white border-t border-slate-100" />

        <section className="relative py-16 px-6 bg-vesta-navy">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={morphSpringSoft}
            className="max-w-4xl mx-auto rounded-3xl p-10 sm:p-14 text-center bg-vesta-navy-muted/30 border border-white/15 text-white"
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-normal mb-4">See it on your own data</h2>
            <p className="text-white/90 max-w-xl mx-auto mb-8">
              Connect a PMS where supported, or start from CSV — the roadmap targets live KPIs in your first session.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                transition={morphSpringSoft}
                onClick={() => navigate('/auth')}
                className="bg-vesta-gold hover:bg-vesta-gold/90 text-vesta-navy font-semibold px-8 py-3.5 rounded-xl shadow-lg"
              >
                Create account
              </motion.button>
              <Link
                to="/docs/getting-started/tour"
                className="inline-flex items-center justify-center border-2 border-white/80 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                Read quick tour
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </MarketingPageShell>
  );
}
