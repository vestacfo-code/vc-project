import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Heart, Globe2, ArrowRight, Lightbulb, Handshake } from 'lucide-react';
import { MarketingPageShell } from '@/components/marketing/MarketingPageShell';
import { TellUsMoreSection } from '@/components/marketing/TellUsMoreSection';
import { marketingImages } from '@/lib/marketing-images';
import { morphSpringSoft } from '@/lib/motion';

const pillars = [
  {
    icon: Target,
    title: 'Mission',
    body:
      'Give every independent hotel and boutique chain the same quality of financial intelligence large flags take for granted — without enterprise cost or complexity.',
    ring: 'bg-vesta-mist/90',
  },
  {
    icon: Heart,
    title: 'How we work',
    body:
      'We ship product quickly, listen to operators, and bias toward clarity: fewer dashboards-for-the-sake-of-dashboards, more answers you can act on the same day.',
    ring: 'bg-rose-100',
  },
  {
    icon: Globe2,
    title: 'Who we serve',
    body:
      'Owners, asset managers, GMs, and finance leads at independent properties and small multi-property groups across North America and beyond.',
    ring: 'bg-cyan-100',
  },
];

const extras = [
  {
    icon: Lightbulb,
    title: 'What we’re still learning from you',
    body:
      'Which PMS exports are painful, how you want lender packages formatted, and which alerts actually change your morning — tell us on the contact page or via email.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Handshake,
    title: 'Partnerships',
    body:
      'We’re open to thoughtful integrations and referral relationships with consultants, brands, and tech vendors who serve independent hotels.',
    color: 'text-vesta-navy',
    bg: 'bg-vesta-mist/50',
  },
];

export default function Company() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Company · Vesta CFO';
  }, []);

  return (
    <MarketingPageShell>
      <div className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 w-[120%] max-w-4xl h-64 bg-slate-100 blur-3xl rounded-full opacity-70"
        />

        <section className="relative max-w-6xl mx-auto px-6 pt-10 sm:pt-16 pb-12 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left order-2 lg:order-1">
            <motion.h1
              initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={morphSpringSoft}
              className="font-serif text-4xl sm:text-5xl text-slate-900 font-normal leading-tight"
            >
              Built for hoteliers who{' '}
              <span className="text-vesta-gold">outgrew spreadsheets.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphSpringSoft, delay: 0.08 }}
              className="mt-6 text-lg text-slate-600 leading-relaxed"
            >
              Vesta is an AI-native financial intelligence platform focused on hotels — combining live KPIs, daily
              briefings, and anomaly detection so you always know what changed and what to do next.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphSpringSoft, delay: 0.14 }}
              className="mt-4 text-slate-600 leading-relaxed"
            >
              We don’t publish a public headcount or revenue — if you’re evaluating us for procurement or press, email{' '}
              <a href="mailto:support@vesta.ai" className="text-vesta-navy font-medium hover:underline">
                support@vesta.ai
              </a>{' '}
              and we’ll route you to the right person.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...morphSpringSoft, delay: 0.06 }}
            className="order-1 lg:order-2"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-vesta-navy/10">
              <img
                src={marketingImages.team.src}
                alt={marketingImages.team.alt}
                className="w-full h-64 sm:h-80 object-cover"
                width={900}
                height={600}
                loading="lazy"
              />
            </div>
          </motion.div>
        </section>

        <section className="relative border-t border-slate-100 py-16 sm:py-20 bg-white/90">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ ...morphSpringSoft, delay: i * 0.1 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-11 h-11 rounded-xl ${p.ring} flex items-center justify-center mb-5`}>
                    <Icon className="w-5 h-5 text-slate-800" strokeWidth={1.5} />
                  </div>
                  <h2 className="font-serif text-xl text-slate-900 mb-3">{p.title}</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">{p.body}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-6">
            {extras.map(({ icon: Icon, title, body, color, bg }, i) => (
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
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <TellUsMoreSection className="bg-white" />

        <section className="relative py-16 px-6 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-2xl sm:text-3xl text-slate-900 mb-4">Learn more</h2>
            <p className="text-slate-600 mb-10">
              Meet our leadership, explore open roles, or get in touch with the team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 hover:border-vesta-gold/50 hover:bg-vesta-mist/40 px-6 py-3 text-sm font-medium text-slate-800 transition-colors"
              >
                Leadership <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/careers"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 hover:border-amber-300 hover:bg-amber-50 px-6 py-3 text-sm font-medium text-slate-800 transition-colors"
              >
                Careers <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-vesta-navy hover:bg-vesta-navy/90 text-white px-6 py-3 text-sm font-semibold shadow-md transition-colors"
              >
                Contact us
              </button>
            </div>
          </div>
        </section>
      </div>
    </MarketingPageShell>
  );
}
