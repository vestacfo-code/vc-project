import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ScrollyVideo from 'scrolly-video/dist/ScrollyVideo.esm.jsx';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { BarChart3, Brain, Plug, Sparkles, ArrowRight, Quote } from 'lucide-react';

// ── Chapters ──────────────────────────────────────────────────────────────────

const CHAPTERS = [
  {
    range: [0, 0.13] as [number, number],
    eyebrow: null,
    headline: 'Vesta CFO',
    align: 'center' as const,
    sub: 'The AI CFO that gives every hotel owner enterprise-level financial insight — without hiring one at $200k+/yr.',
  },
  {
    range: [0.17, 0.32] as [number, number],
    eyebrow: 'The Problem',
    headline: 'Hotels are flying blind.',
    align: 'left' as const,
    sub: 'Owners manage finances across 5–10 disconnected systems — PMS, OTAs, payroll, F&B — with no unified picture. They find out they\'re losing money weeks too late.',
  },
  {
    range: [0.35, 0.5] as [number, number],
    eyebrow: 'The Solution',
    headline: 'One connected picture.',
    align: 'left' as const,
    sub: 'PMS, OTAs, payroll, and F&B in a single dashboard — so you are not reconciling ten exports to learn how the month went.',
  },
  {
    range: [0.53, 0.68] as [number, number],
    eyebrow: 'Intelligence',
    headline: '"Your labor cost jumped 12% this week."',
    align: 'right' as const,
    sub: 'RevPAR, ADR, GOPPAR — automatically calculated and explained in plain English every morning.',
  },
  {
    range: [0.71, 0.86] as [number, number],
    eyebrow: 'Anomaly Detection',
    headline: "You're leaving $18/room on the table.",
    align: 'right' as const,
    sub: 'Real-time comparison vs local comps. Vesta CFO flags revenue leakage before it compounds.',
  },
  {
    range: [0.89, 1.0] as [number, number],
    eyebrow: null,
    headline: 'Ready when you are.',
    align: 'center' as const,
    sub: 'One dashboard, morning briefings, and answers in plain English — built for how you run the property.',
  },
];

const PREVIEW_FEATURES = [
  {
    icon: BarChart3,
    title: 'Live hotel KPIs',
    desc: 'RevPAR, ADR, GOPPAR, and channel mix in one view — no more stitching spreadsheets.',
    to: '/features',
  },
  {
    icon: Brain,
    title: 'AI briefings & chat',
    desc: 'Short morning summaries plus an assistant that speaks hotel, not generic accounting.',
    to: '/features',
  },
  {
    icon: Plug,
    title: 'PMS & data in',
    desc: 'Connect where supported, or bring CSVs — you stay in control of the source.',
    to: '/docs/connect',
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      'We finally stopped exporting three PMS reports into one monster sheet. The morning brief calls out what actually moved — my GM and I read it before stand-up.',
    name: 'Elena M.',
    role: 'Owner / operator',
    detail: 'Boutique hotel, Pacific Northwest',
  },
  {
    quote:
      'The anomaly note on OTA commission creep paid for the trial in one week. It was written in English, not finance-robot.',
    name: 'James T.',
    role: 'General manager',
    detail: '88 keys, urban independent',
  },
  {
    quote:
      'I wanted something built for hotels, not another SMB dashboard with hotel words pasted on. This feels like the product actually understands RevPAR and GOPPAR.',
    name: 'Priya K.',
    role: 'Revenue lead',
    detail: 'Small multi-property group',
  },
] as const;

const SCROLL_HEIGHT = '900vh';

// ── Component ─────────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  const lastProgressRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== undefined) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = undefined;
        const el = containerRef.current;
        if (!el) return;
        const p = Math.min(Math.max(window.scrollY / (el.offsetHeight - window.innerHeight), 0), 1);
        if (Math.abs(p - lastProgressRef.current) > 0.0001) {
          lastProgressRef.current = p;
          setProgress(p);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    document.title = 'Vesta CFO — AI financial intelligence for hotels';
  }, []);

  const activeChapter = CHAPTERS.find(c => progress >= c.range[0] && progress <= c.range[1]) ?? null;

  const alignClass =
    activeChapter?.align === 'left'
      ? 'items-start text-left'
      : activeChapter?.align === 'right'
        ? 'items-end text-right'
        : 'items-center text-center';

  const isLastChapter = activeChapter?.headline === 'Ready when you are.';

  return (
    <main className="min-h-screen bg-vesta-cream text-slate-900">
      <MarketingNav variant="light" />

      {/* ── Scroll-scrubbed video section ── */}
      <div ref={containerRef} style={{ height: SCROLL_HEIGHT }} className="relative bg-vesta-cream">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-vesta-cream" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
          <ScrollyVideo
            src="/hotel.mp4"
            transitionSpeed={30}
            frameThreshold={0.01}
            cover
            sticky={false}
            trackScroll={false}
            videoPercentage={progress}
          />

          <div
            className={`absolute inset-0 flex flex-col justify-center px-10 md:px-24 gap-4 transition-all duration-500 ${alignClass}`}
          >
            {activeChapter && (
              <div
                className={`flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-white/15 bg-[#1B3A5C]/85 px-7 py-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-md md:px-10 md:py-10 ${
                  activeChapter.align === 'center' ? 'mx-auto text-center' : ''
                }`}
              >
                {activeChapter.eyebrow && (
                  <p className="text-xs uppercase tracking-[0.3em] text-vesta-gold">{activeChapter.eyebrow}</p>
                )}
                <h2
                  className={`max-w-xl font-light leading-tight text-white transition-all duration-500 ${
                    activeChapter.align === 'center' ? 'mx-auto' : ''
                  } ${
                    activeChapter.align === 'center'
                      ? 'text-5xl md:text-8xl'
                      : activeChapter.headline.length > 30
                        ? 'text-3xl md:text-4xl'
                        : 'text-5xl md:text-7xl'
                  }`}
                >
                  {activeChapter.headline}
                </h2>
                {activeChapter.sub && (
                  <p
                    className={`mt-1 max-w-sm text-sm leading-relaxed text-white/90 md:text-base ${
                      activeChapter.align === 'center' ? 'mx-auto' : ''
                    }`}
                  >
                    {activeChapter.sub}
                  </p>
                )}
                {isLastChapter && (
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className={`mt-4 w-fit rounded-full bg-vesta-gold px-10 py-4 text-sm font-semibold uppercase tracking-widest text-vesta-navy shadow-md shadow-black/20 transition-all duration-300 hover:bg-vesta-gold/90 hover:shadow-lg ${
                      activeChapter.align === 'center' ? 'mx-auto' : ''
                    }`}
                  >
                    Get started
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-slate-200/80">
            <div className="h-full bg-vesta-gold/80 transition-all duration-100" style={{ width: `${progress * 100}%` }} />
          </div>

          <div
            className={`pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-slate-500 transition-opacity duration-700 ${progress > 0.04 ? 'opacity-0' : 'opacity-100'}`}
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="h-6 w-px animate-pulse bg-slate-400/60" />
          </div>
        </div>
      </div>

      <div className="relative z-10 overflow-x-clip bg-vesta-cream">
        {/* ── Feature preview ── */}
        <section
          id="features-preview"
          className="relative scroll-mt-28 overflow-hidden border-t border-vesta-navy/10 bg-vesta-cream"
        >
          <div className="pointer-events-none absolute top-1/2 left-0 h-72 w-72 -translate-y-1/2 rounded-full bg-vesta-mist/80 blur-3xl" />
          <div className="relative mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-24 lg:px-12">
            <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-vesta-navy-muted">
                  <Sparkles className="h-3.5 w-3.5 text-vesta-gold" aria-hidden />
                  Platform
                </p>
                <h2 className="font-serif text-3xl font-light leading-tight text-vesta-navy md:text-4xl lg:text-5xl max-w-xl">
                  Built for hotel operators — not another generic finance tool.
                </h2>
              </div>
              <Link
                to="/features"
                className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-vesta-navy-muted transition-colors hover:text-vesta-navy"
              >
                Full feature tour
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3 md:gap-6">
              {PREVIEW_FEATURES.map(({ icon: Icon, title, desc, to }) => (
                <Link
                  key={title}
                  to={to}
                  className="group rounded-2xl border border-vesta-navy/10 bg-vesta-mist/25 p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-vesta-gold/35 hover:bg-vesta-mist/40 hover:shadow-md md:p-8"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-vesta-gold/25 bg-vesta-cream transition-colors group-hover:bg-vesta-mist/60">
                    <Icon className="h-5 w-5 text-vesta-gold" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-vesta-navy">{title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-600">{desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-vesta-gold">
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="border-t border-vesta-navy/10 bg-vesta-cream">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-24 lg:px-12">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-vesta-navy-muted">From operators</p>
            <h2 className="mb-12 font-serif text-3xl font-light text-vesta-navy md:text-4xl max-w-2xl">
              What early teams are saying
            </h2>
            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              {TESTIMONIALS.map((t) => (
                <blockquote
                  key={t.name}
                  className="flex h-full flex-col rounded-2xl border border-vesta-navy/10 bg-vesta-mist/35 p-6 shadow-sm md:p-8"
                >
                  <Quote className="mb-4 h-8 w-8 text-vesta-gold/70" aria-hidden strokeWidth={1.25} />
                  <p className="flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="mt-6 border-t border-vesta-navy/10 pt-5">
                    <p className="text-sm font-semibold text-vesta-navy">{t.name}</p>
                    <p className="text-xs text-slate-600">{t.role}</p>
                    <p className="text-xs text-vesta-navy-muted">{t.detail}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
            <p className="mt-10 text-center text-xs text-slate-500">
              Quotes reflect pilot feedback and composite operator feedback; names anonymized.
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-vesta-navy/10 bg-vesta-cream">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 text-center md:px-10 md:py-28 lg:px-12">
            <div className="mx-auto max-w-2xl rounded-3xl border border-vesta-navy/10 bg-vesta-mist/30 px-8 py-12 shadow-[0_20px_48px_-22px_rgba(27,58,92,0.1)] md:px-14 md:py-16">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-vesta-navy-muted">Get started</p>
              <h2 className="mb-4 font-serif text-3xl font-light leading-tight text-vesta-navy md:text-4xl">
                See your numbers in one calm place.
              </h2>
              <p className="mx-auto mb-10 max-w-md text-sm leading-relaxed text-slate-600">
                Create an account to explore the dashboard, or talk to us if you are rolling out across several properties.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="w-full rounded-full bg-vesta-gold px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-vesta-navy shadow-md transition-all duration-300 hover:bg-vesta-gold/90 hover:shadow-lg sm:w-auto"
                >
                  Get started free
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/contact')}
                  className="w-full rounded-full border border-vesta-navy/20 px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-vesta-navy transition-all duration-300 hover:border-vesta-navy/40 hover:bg-vesta-mist/40 sm:w-auto"
                >
                  Contact us
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full rounded-full border border-transparent px-10 py-3.5 text-sm font-medium uppercase tracking-widest text-slate-500 transition-all hover:text-vesta-navy sm:w-auto"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter variant="light" />
      </div>
    </main>
  );
}
