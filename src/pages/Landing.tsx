import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ScrollyVideo from 'scrolly-video/dist/ScrollyVideo.esm.jsx';
import { SiteFooter } from '@/components/layout/SiteFooter';
import Header from '@/components/shared/Header';
import { BarChart3, Brain, Plug, Sparkles, ArrowRight, Zap, TrendingUp, Shield } from 'lucide-react';

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

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Live hotel KPIs',
    desc: 'RevPAR, ADR, GOPPAR, and channel mix in one view — no more stitching spreadsheets.',
    to: '/features',
    stat: '10+',
    statLabel: 'KPIs tracked',
  },
  {
    icon: Brain,
    title: 'AI briefings & chat',
    desc: 'Short morning summaries plus an assistant that speaks hotel finance, not generic accounting.',
    to: '/features',
    stat: 'Daily',
    statLabel: 'AI briefings',
  },
  {
    icon: Plug,
    title: 'PMS & data in',
    desc: 'Connect where supported, or bring CSVs — you stay in control of the source.',
    to: '/docs/connect',
    stat: '5+',
    statLabel: 'Integrations',
  },
  {
    icon: Zap,
    title: 'Anomaly alerts',
    desc: 'Catch revenue leakage, cost spikes, and OTA commission creep before they compound.',
    to: '/features',
    stat: 'Real-time',
    statLabel: 'Detection',
  },
  {
    icon: TrendingUp,
    title: 'Forecasting',
    desc: 'Predict RevPAR, cash flow, and GOP with AI-driven forward projections.',
    to: '/features',
    stat: '90-day',
    statLabel: 'Outlook',
  },
  {
    icon: Shield,
    title: 'Enterprise security',
    desc: 'Bank-grade encryption, SOC 2 aligned, and your data never sold or shared.',
    to: '/docs',
    stat: '256-bit',
    statLabel: 'Encryption',
  },
] as const;

const SCROLL_HEIGHT = '450vh';

// ── Component ─────────────────────────────────────────────────────────────────

type ScrollyVideoHandle = {
  setVideoPercentage: (p: number) => void;
};

export default function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollyRef = useRef<ScrollyVideoHandle | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastChapterIdxRef = useRef<number | null>(0);
  const showScrollCueRef = useRef(true);

  const [chapterIndex, setChapterIndex] = useState<number | null>(0);
  const [showScrollCue, setShowScrollCue] = useState(true);

  const scrollSyncRef = useRef(() => {});

  scrollSyncRef.current = () => {
    const el = containerRef.current;
    if (!el) return;
    const denom = el.offsetHeight - window.innerHeight;
    const p = denom > 0 ? Math.min(Math.max(window.scrollY / denom, 0), 1) : 0;

    scrollyRef.current?.setVideoPercentage(p);

    const bar = progressBarRef.current;
    if (bar) bar.style.width = `${p * 100}%`;

    const idx = CHAPTERS.findIndex((c) => p >= c.range[0] && p <= c.range[1]);
    const resolved = idx < 0 ? null : idx;
    if (resolved !== lastChapterIdxRef.current) {
      lastChapterIdxRef.current = resolved;
      setChapterIndex(resolved);
    }

    if (p > 0.04 && showScrollCueRef.current) {
      showScrollCueRef.current = false;
      setShowScrollCue(false);
    } else if (p <= 0.04 && !showScrollCueRef.current) {
      showScrollCueRef.current = true;
      setShowScrollCue(true);
    }
  };

  useEffect(() => {
    let rafId: number | undefined;
    let scheduled = false;
    const flush = () => {
      scheduled = false;
      scrollSyncRef.current();
    };
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      rafId = requestAnimationFrame(flush);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    scrollSyncRef.current();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    document.title = 'Vesta CFO — AI financial intelligence for hotels';
  }, []);

  const activeChapter = chapterIndex !== null ? CHAPTERS[chapterIndex] ?? null : null;

  const alignClass =
    activeChapter?.align === 'left'
      ? 'items-start text-left'
      : activeChapter?.align === 'right'
        ? 'items-end text-right'
        : 'items-center text-center';

  const isLastChapter = activeChapter?.headline === 'Ready when you are.';

  return (
    <main className="min-h-screen bg-vesta-navy text-white">
      <Header variant="dark" />

      {/* ── Scroll-scrubbed video section ── */}
      <div ref={containerRef} style={{ height: SCROLL_HEIGHT }} className="relative bg-vesta-navy">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-vesta-navy">
          <ScrollyVideo
            ref={scrollyRef}
            src="/hotel.mp4"
            transitionSpeed={8}
            frameThreshold={0.033}
            useWebCodecs={true}
            cover
            sticky={false}
            trackScroll={false}
            onReady={() => scrollSyncRef.current()}
          />

          {/* Dark gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-vesta-navy/40 via-transparent to-vesta-navy/60 pointer-events-none" />

          <div
            className={`absolute inset-0 flex flex-col justify-center px-10 md:px-24 gap-4 transition-all duration-500 ${alignClass}`}
          >
            {activeChapter && (
              <div
                className={`flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-white/10 bg-black/50 px-7 py-8 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl md:px-10 md:py-10 ${
                  activeChapter.align === 'center' ? 'mx-auto text-center' : ''
                }`}
              >
                {activeChapter.eyebrow && (
                  <p className="text-xs uppercase tracking-[0.3em] text-vesta-gold font-semibold">{activeChapter.eyebrow}</p>
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
                    className={`mt-1 max-w-sm text-sm leading-relaxed text-white/80 md:text-base ${
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
                    className={`mt-4 w-fit rounded-full bg-vesta-gold px-10 py-4 text-sm font-semibold uppercase tracking-widest text-vesta-navy shadow-lg shadow-black/30 transition-all duration-300 hover:bg-vesta-gold/90 hover:shadow-xl hover:-translate-y-0.5 ${
                      activeChapter.align === 'center' ? 'mx-auto' : ''
                    }`}
                  >
                    Get started
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
            <div
              ref={progressBarRef}
              className="h-full bg-vesta-gold"
              style={{ width: '0%', transition: 'width 0.1s linear' }}
            />
          </div>

          {/* Scroll cue */}
          <div
            className={`pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/50 transition-opacity duration-700 ${showScrollCue ? 'opacity-100' : 'opacity-0'}`}
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="h-6 w-px animate-pulse bg-white/30" />
          </div>
        </div>
      </div>

      {/* ── Below-fold content: dark theme ── */}
      <div className="relative z-10 overflow-x-clip bg-vesta-navy">

        {/* ── Stats bar ── */}
        <div className="border-y border-white/8 bg-white/[0.03]">
          <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { value: '$200k+', label: 'CFO cost replaced' },
                { value: '10 min', label: 'Setup to first insight' },
                { value: '15+', label: 'Hotel KPIs tracked' },
                { value: '5+', label: 'PMS integrations' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl font-light text-vesta-gold md:text-4xl">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-white/50">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Features grid ── */}
        <section id="features-preview" className="relative scroll-mt-28 overflow-hidden">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-vesta-gold/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />

          <div className="relative mx-auto w-full max-w-6xl px-6 py-20 md:px-10 md:py-28 lg:px-12">
            <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-vesta-gold/80 font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-vesta-gold" aria-hidden />
                  Platform
                </p>
                <h2 className="font-serif text-3xl font-light leading-tight text-white md:text-4xl lg:text-5xl max-w-xl">
                  Built for hotel operators —<br />not another generic finance tool.
                </h2>
              </div>
              <Link
                to="/features"
                className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-vesta-gold"
              >
                Full feature tour
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3 md:gap-5">
              {FEATURES.map(({ icon: Icon, title, desc, to, stat, statLabel }) => (
                <Link
                  key={title}
                  to={to}
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-vesta-gold/30 hover:bg-white/[0.07] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] md:p-7"
                >
                  {/* Hover glow */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-vesta-gold/5 to-transparent" />

                  <div className="relative flex items-start justify-between mb-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-vesta-gold/20 bg-vesta-gold/10">
                      <Icon className="h-5 w-5 text-vesta-gold" strokeWidth={1.5} />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-white">{stat}</p>
                      <p className="text-xs text-white/40 uppercase tracking-wider">{statLabel}</p>
                    </div>
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-white/60">{desc}</p>
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-vesta-gold/70 group-hover:text-vesta-gold transition-colors">
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-white/8">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 text-center md:px-10 md:py-28 lg:px-12">
            <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] px-8 py-14 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.6)] md:px-14 md:py-20">
              {/* Gold glow */}
              <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-vesta-gold/20 blur-3xl" />

              <p className="relative mb-4 text-xs uppercase tracking-[0.3em] text-vesta-gold/80 font-semibold">Get started</p>
              <h2 className="relative mb-4 font-serif text-3xl font-light leading-tight text-white md:text-4xl">
                See your numbers in one calm place.
              </h2>
              <p className="relative mx-auto mb-10 max-w-md text-sm leading-relaxed text-white/60">
                Create an account to explore the dashboard, or talk to us if you are rolling out across several properties.
              </p>
              <div className="relative flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="w-full rounded-full bg-vesta-gold px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-vesta-navy shadow-lg shadow-black/30 transition-all duration-300 hover:bg-vesta-gold/90 hover:shadow-xl hover:-translate-y-0.5 sm:w-auto"
                >
                  Get started free
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/contact')}
                  className="w-full rounded-full border border-white/15 px-10 py-3.5 text-sm font-semibold uppercase tracking-widest text-white/80 transition-all duration-300 hover:border-white/30 hover:bg-white/5 hover:text-white sm:w-auto"
                >
                  Contact us
                </button>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter variant="dark" />
      </div>
    </main>
  );
}
