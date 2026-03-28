import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MarketingPageShell } from '@/components/marketing/MarketingPageShell';
import { TellUsMoreSection } from '@/components/marketing/TellUsMoreSection';
import { marketingImages } from '@/lib/marketing-images';
import { TrendingUp, Brain, AlertTriangle, BarChart3, CheckCircle2, Shield, Clock, Building2 } from 'lucide-react';
import { morphSpringSoft } from '@/lib/motion';

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      delay: i * 0.06,
      ...morphSpringSoft,
    },
  }),
};

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const kpis = [
  { label: 'RevPAR', value: '$142', accent: 'border-t-amber-500' },
  { label: 'Occupancy', value: '78%', accent: 'border-t-violet-500' },
  { label: 'ADR', value: '$182', accent: 'border-t-cyan-500' },
  { label: 'GOPPAR', value: '$61', accent: 'border-t-emerald-500' },
];

const features = [
  {
    icon: <BarChart3 className="w-7 h-7 text-violet-600" strokeWidth={1.5} />,
    ring: 'bg-violet-100',
    title: 'Live KPI Dashboard',
    description:
      'RevPAR, ADR, Occupancy, and GOPPAR updated daily — all in one clean view built for hoteliers, not accountants.',
  },
  {
    icon: <Brain className="w-7 h-7 text-amber-600" strokeWidth={1.5} />,
    ring: 'bg-amber-100',
    title: 'AI Daily Briefings',
    description:
      'Every morning, get a plain-English summary of what happened in your hotel yesterday and exactly why it matters.',
  },
  {
    icon: <AlertTriangle className="w-7 h-7 text-rose-600" strokeWidth={1.5} />,
    ring: 'bg-rose-100',
    title: 'Anomaly Alerts',
    description:
      'Instant alerts the moment something looks off — unexpected RevPAR dips, occupancy gaps, or cost overruns.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Connect your PMS or upload a CSV',
    description: 'Plug in your property management system or drop in a CSV export — we handle the rest.',
  },
  {
    number: '02',
    title: 'Data syncs automatically',
    description: 'Your financial and occupancy data refreshes every day with zero manual effort on your end.',
  },
  {
    number: '03',
    title: 'Get AI insights daily',
    description:
      'Wake up to a personalized briefing: what moved, what it means, and what to watch next.',
  },
];

const hotelLogos = [
  'The Grand Hartwell',
  'Meridian Suites',
  'Blue Crest Hotels',
  'Ashford Collection',
];

const atAGlance = [
  {
    icon: Shield,
    title: 'Built for sensitive numbers',
    text: 'Role-based access and security practices designed around financial data. See our Security page for detail.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Clock,
    title: 'Fresh every day',
    text: 'KPIs and briefings refresh on a daily rhythm so leadership always opens the same trusted snapshot.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    icon: Building2,
    title: 'One property or a small portfolio',
    text: 'Start with a single hotel; scale to multiple properties when you are ready — without re-platforming.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <MarketingPageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-slate-50" />

        <div className="relative max-w-6xl mx-auto px-6 pt-8 sm:pt-12 pb-16 lg:pb-24 lg:grid lg:grid-cols-2 lg:gap-14 lg:items-center min-h-[calc(100vh-4rem)] lg:min-h-0">
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start gap-6">
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-violet-800 bg-violet-100 border border-violet-200 rounded-full px-4 py-1.5"
            >
              <TrendingUp className="w-3 h-3 text-amber-600" />
              AI-powered hotel finance
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-slate-900 leading-tight tracking-tight"
            >
              Your hotel&apos;s
              <br />
              <span className="text-amber-600">AI CFO.</span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-slate-600 text-lg sm:text-xl max-w-xl leading-relaxed"
            >
              Real-time financial intelligence for independent hoteliers and boutique chains. RevPAR, GOPPAR, daily
              briefings, and anomaly alerts — without living in spreadsheets.
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={morphSpringSoft}
                onClick={() => navigate('/auth')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base shadow-md"
              >
                Get started free
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={morphSpringSoft}
                onClick={() => navigate('/dashboard')}
                className="border-2 border-slate-200 hover:border-violet-300 text-slate-800 px-8 py-3.5 rounded-xl text-base font-medium bg-white/80 hover:bg-violet-50/80 transition-colors"
              >
                See the dashboard
              </motion.button>
            </motion.div>

            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-8 w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {kpis.map(({ label, value, accent }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...morphSpringSoft, delay: 0.45 + i * 0.06 }}
                  className={`rounded-xl border border-slate-200 bg-white shadow-sm ${accent} border-t-4 pt-3 pb-3 px-2 text-center`}
                >
                  <span className="font-serif text-xl sm:text-2xl text-slate-900 font-normal block">{value}</span>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 mt-1 block">{label}</span>
                </motion.div>
              ))}
            </motion.div>
            <p className="text-xs text-slate-500 -mt-2">Sample KPI preview — your live numbers after connect.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ ...morphSpringSoft, delay: 0.15 }}
            className="mt-12 lg:mt-0 relative"
          >
            <div className="relative rounded-[1.75rem] overflow-hidden shadow-2xl shadow-slate-300/60 ring-4 ring-white">
              <img
                src={marketingImages.heroHotel.src}
                alt={marketingImages.heroHotel.alt}
                className="w-full h-[280px] sm:h-[380px] lg:h-[460px] object-cover"
                width={800}
                height={600}
                loading="eager"
              />
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/88 p-6 text-left">
                <p className="text-white font-serif text-lg">Operations + finance, aligned</p>
                <p className="text-white/80 text-sm mt-1">Illustrative image — replace with your property anytime.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* At a glance */}
      <section className="py-14 px-6 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-violet-700 mb-8">At a glance</p>
          <div className="grid md:grid-cols-3 gap-6">
            {atAGlance.map(({ icon: Icon, title, text, color, bg }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...morphSpringSoft, delay: i * 0.08 }}
                className={`rounded-2xl ${bg} border border-white p-6 shadow-sm`}
              >
                <Icon className={`w-8 h-8 ${color} mb-3`} strokeWidth={1.5} />
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-8">
            <Link to="/security" className="text-violet-700 hover:underline font-medium">
              Security overview
            </Link>
            {' · '}
            <Link to="/pricing" className="text-violet-700 hover:underline font-medium">
              Plans &amp; pricing
            </Link>
          </p>
        </div>
      </section>

      {/* Image + copy strip */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={morphSpringSoft}
            className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-100"
          >
            <img
              src={marketingImages.analytics.src}
              alt={marketingImages.analytics.alt}
              className="w-full h-64 sm:h-80 object-cover"
              width={700}
              height={500}
              loading="lazy"
            />
          </motion.div>
          <div className="order-1 lg:order-2">
            <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 font-normal mb-4">
              Decisions from data, not from guesswork
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Vesta pulls together the metrics owners and asset managers ask about first — occupancy, rate, channel mix,
              and profitability signals — then layers AI summaries so everyone starts the day on the same page.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Whether you run one boutique property or a short list of assets, you get a consistent rhythm: connect data,
              review the dashboard, read the briefing, act on exceptions.
            </p>
            <Link
              to="/features"
              className="inline-flex font-semibold text-violet-700 hover:text-violet-900"
            >
              Explore the full feature set →
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="py-12 px-6 bg-slate-50 border-y border-slate-100"
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-mono tracking-widest uppercase text-slate-500 mb-6">
            Trusted by independent hotels and boutique chains
          </p>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {hotelLogos.map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, ...morphSpringSoft }}
                whileHover={{ y: -2 }}
                className="font-serif text-lg text-slate-600 tracking-wide cursor-default px-3 py-1 rounded-lg hover:bg-white hover:shadow-sm"
              >
                {name}
              </motion.span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-6">Representative names for illustration — replace with your logos.</p>
        </div>
      </motion.section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-4xl sm:text-5xl text-slate-900 font-normal mb-4">
              Everything your CFO would track,
              <br />
              <span className="text-violet-700">automated.</span>
            </h2>
            <p className="text-slate-600 text-lg max-w-xl mx-auto">
              Vesta turns raw PMS data into actionable intelligence — no spreadsheets, no consultants, no delay.
            </p>
            <Link
              to="/features"
              className="inline-block mt-6 text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              View all features →
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon, title, description, ring }, i) => (
              <motion.div
                key={title}
                layout
                initial={{ opacity: 0, y: 32, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ ...morphSpringSoft, delay: i * 0.1 }}
                whileHover={{ y: -6, boxShadow: '0 20px 40px -15px rgba(124, 58, 237, 0.2)' }}
                className="group rounded-2xl border border-slate-200 bg-white p-7 flex flex-col gap-4 shadow-sm hover:border-violet-200 transition-colors"
              >
                <motion.div
                  className={`w-12 h-12 rounded-xl ${ring} flex items-center justify-center`}
                  whileHover={{ scale: 1.08, rotate: -3 }}
                  transition={morphSpringSoft}
                >
                  {icon}
                </motion.div>
                <h3 className="font-serif text-xl text-slate-900 font-normal">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lobby image band */}
      <section className="py-0 px-0">
        <div className="max-w-6xl mx-auto px-6 pb-20">
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col md:flex-row min-h-[280px]">
            <div className="md:w-1/2 relative min-h-[220px]">
              <img
                src={marketingImages.lobby.src}
                alt={marketingImages.lobby.alt}
                className="absolute inset-0 w-full h-full object-cover"
                width={800}
                height={500}
                loading="lazy"
              />
            </div>
            <div className="md:w-1/2 bg-violet-800 p-10 flex flex-col justify-center text-white">
              <h3 className="font-serif text-2xl sm:text-3xl mb-3">Built for the front desk and the boardroom</h3>
              <p className="text-violet-100 leading-relaxed text-sm sm:text-base">
                Give GMs a morning snapshot. Give owners and lenders exportable clarity. Same data, different lenses — without
                maintaining five versions of the truth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-4xl sm:text-5xl text-slate-900 font-normal mb-4">Up and running in minutes.</h2>
            <p className="text-slate-600 text-lg max-w-xl mx-auto">
              No IT team required. No lengthy onboarding. Just connect, sync, and go.
            </p>
          </motion.div>

          <div className="flex flex-col gap-6">
            {steps.map(({ number, title, description }, i) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, x: -24, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-24px' }}
                transition={{ ...morphSpringSoft, delay: i * 0.12 }}
                whileHover={{ x: 4 }}
                className="flex gap-6 items-start rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-sm hover:border-violet-200 transition-colors"
              >
                <div className="shrink-0 font-mono text-3xl font-bold text-amber-500 leading-none pt-1">{number}</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={2} />
                    <h3 className="font-serif text-xl text-slate-900 font-normal">{title}</h3>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed pl-7">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TellUsMoreSection className="bg-slate-50/80 border-t border-slate-100" />

      {/* CTA */}
      <section className="py-20 px-6 bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={morphSpringSoft}
          className="max-w-4xl mx-auto rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden text-white shadow-2xl bg-violet-900"
        >
          <h2 className="font-serif text-3xl sm:text-5xl font-normal mb-5 leading-tight relative z-10">
            Ready to see your hotel&apos;s full financial picture?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto relative z-10">
            Join operators who start every day with Vesta — KPIs, AI briefings, and alerts in one bright, simple workspace.
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={morphSpringSoft}
            onClick={() => navigate('/auth')}
            className="relative z-10 bg-white hover:bg-slate-50 text-violet-700 font-semibold px-10 py-4 rounded-xl text-base shadow-xl"
          >
            Start for free
          </motion.button>
        </motion.div>
      </section>
    </MarketingPageShell>
  );
};

export default Landing;
