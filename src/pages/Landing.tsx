import { useNavigate, Link } from 'react-router-dom';
import { VestaLogo } from '@/components/VestaLogo';
import { TrendingUp, Brain, AlertTriangle, BarChart3, CheckCircle2 } from 'lucide-react';

const kpis = [
  { label: 'RevPAR', value: '$142' },
  { label: 'Occupancy', value: '78%' },
  { label: 'ADR', value: '$182' },
  { label: 'GOPPAR', value: '$61' },
];

const features = [
  {
    icon: <BarChart3 className="w-7 h-7 text-amber-400" strokeWidth={1.5} />,
    title: 'Live KPI Dashboard',
    description:
      'RevPAR, ADR, Occupancy, and GOPPAR updated daily — all in one clean view built for hoteliers, not accountants.',
  },
  {
    icon: <Brain className="w-7 h-7 text-amber-400" strokeWidth={1.5} />,
    title: 'AI Daily Briefings',
    description:
      'Every morning, get a plain-English summary of what happened in your hotel yesterday and exactly why it matters.',
  },
  {
    icon: <AlertTriangle className="w-7 h-7 text-amber-400" strokeWidth={1.5} />,
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

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* ── NAV ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <VestaLogo size="md" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 overflow-hidden">
        {/* subtle radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,158,11,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-amber-400 border border-amber-400/30 rounded-full px-4 py-1.5 bg-amber-400/5">
            <TrendingUp className="w-3 h-3" />
            AI-Powered Hotel Finance
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-white leading-tight tracking-tight">
            Your hotel's<br />
            <span className="text-amber-400">AI CFO.</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl leading-relaxed">
            Real-time financial intelligence built for independent hoteliers and boutique chains.
            Stop guessing. Start knowing — every single morning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button
              onClick={() => navigate('/auth')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-8 py-3.5 rounded-lg text-base transition-colors shadow-lg shadow-amber-500/20"
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="border border-white/20 hover:border-white/40 text-white px-8 py-3.5 rounded-lg text-base transition-colors"
            >
              See the Dashboard
            </button>
          </div>

          {/* KPI stat bar */}
          <div className="mt-10 w-full max-w-2xl grid grid-cols-4 divide-x divide-white/10 border border-white/10 rounded-2xl bg-white/[0.03] backdrop-blur overflow-hidden">
            {kpis.map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center py-5 px-3">
                <span className="font-serif text-2xl sm:text-3xl text-amber-400 font-normal">{value}</span>
                <span className="text-[11px] font-mono tracking-widest uppercase text-slate-500 mt-1">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 -mt-2">Live KPI preview · updated daily</p>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <section className="border-y border-white/5 py-10 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-mono tracking-widest uppercase text-slate-600 mb-6">
            Trusted by independent hotels and boutique chains
          </p>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {hotelLogos.map((name) => (
              <span
                key={name}
                className="font-serif text-lg text-slate-500 tracking-wide opacity-60 hover:opacity-100 transition-opacity"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl text-white font-normal mb-4">
              Everything your CFO would track,<br />
              <span className="text-amber-400">automated.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Vesta turns raw PMS data into actionable intelligence — no spreadsheets, no consultants, no delay.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-white/8 bg-white/[0.03] p-7 flex flex-col gap-4 hover:border-amber-400/30 hover:bg-white/[0.05] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center">
                  {icon}
                </div>
                <h3 className="font-serif text-xl text-white font-normal">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl text-white font-normal mb-4">
              Up and running in minutes.
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              No IT team required. No lengthy onboarding. Just connect, sync, and go.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {steps.map(({ number, title, description }, i) => (
              <div
                key={number}
                className="flex gap-6 items-start rounded-2xl border border-white/8 bg-white/[0.03] p-7"
              >
                <div className="shrink-0 font-mono text-3xl font-bold text-amber-400/30 leading-none pt-1">
                  {number}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2} />
                    <h3 className="font-serif text-xl text-white font-normal">{title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed pl-6">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6">
        <div
          className="max-w-4xl mx-auto rounded-3xl p-12 sm:p-16 text-center"
          style={{
            background: 'linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 100%)',
          }}
        >
          <h2 className="font-serif text-4xl sm:text-5xl text-white font-normal mb-5 leading-tight">
            Ready to see your hotel's<br />full financial picture?
          </h2>
          <p className="text-amber-100/80 text-lg mb-8 max-w-xl mx-auto">
            Join forward-thinking hoteliers who've replaced guesswork with Vesta's daily AI briefings.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-slate-950 hover:bg-slate-900 text-amber-400 font-semibold px-10 py-4 rounded-xl text-base transition-colors shadow-xl"
          >
            Start for free
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <VestaLogo size="sm" />
          <p className="text-slate-600 text-xs font-mono tracking-wide">
            © 2026 Vesta · AI Financial Intelligence
          </p>
          <div className="flex gap-5 text-xs text-slate-500">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
