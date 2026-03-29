import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ScrollyVideo from 'scrolly-video/dist/ScrollyVideo.esm.jsx';
import { VestaLogo } from '@/components/VestaLogo';

// ── Chapters ──────────────────────────────────────────────────────────────────

const CHAPTERS = [
  {
    range: [0, 0.13] as [number, number],
    eyebrow: null,
    headline: "Your hotel's AI CFO.",
    align: 'center' as const,
    sub: 'Real-time financial intelligence built for hoteliers.',
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
    headline: 'Meet Vesta.',
    align: 'left' as const,
    sub: 'The AI CFO that gives every hotel owner enterprise-level financial insight — without hiring a CFO at $200k+/yr.',
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
    sub: 'Real-time comparison vs local comps. Vesta flags revenue leakage before it compounds.',
  },
  {
    range: [0.89, 1.0] as [number, number],
    eyebrow: null,
    headline: 'Start for free.',
    align: 'center' as const,
    sub: null,
  },
];

const SCROLL_HEIGHT = '900vh';

// ── Metrics ───────────────────────────────────────────────────────────────────

const METRICS = [
  { stat: '$299', label: 'Starter / mo', sub: 'Independent hotels' },
  { stat: '47%', label: 'IRR Target', sub: '5-year projection' },
  { stat: '$180k', label: 'Year 1 ARR', sub: '50 hotel minimum' },
  { stat: '16,500', label: 'US Target Hotels', sub: 'Independent & boutique' },
];

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Connect Everything',
    desc: 'Integrates with Opera, Mews, Cloudbeds. Pulls OTA data, payroll, and F&B POS into one dashboard.',
  },
  {
    title: 'Hotel-Specific AI',
    desc: 'RevPAR, ADR, GOPPAR, TRevPAR — automatically calculated and explained in plain English every morning.',
  },
  {
    title: 'Anomaly Detection',
    desc: 'Flags when F&B margins drop, OTA commissions spike, or revenue leakage appears — before it compounds.',
  },
  {
    title: 'Benchmarking',
    desc: "Real-time comparison vs local comps. Know exactly where you're leaving money on the table.",
  },
  {
    title: 'Budget vs Actual',
    desc: 'Set monthly targets for RevPAR, occupancy, and GOP. Track variance in real time.',
  },
  {
    title: 'Team Access',
    desc: 'Role-based access for GMs, revenue managers, and owners. Everyone sees what they need.',
  },
];

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
        if (Math.abs(p - lastProgressRef.current) > 0.0005) {
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

  const activeChapter = CHAPTERS.find(c => progress >= c.range[0] && progress <= c.range[1]) ?? null;

  const alignClass =
    activeChapter?.align === 'left'
      ? 'items-start text-left'
      : activeChapter?.align === 'right'
        ? 'items-end text-right'
        : 'items-center text-center';

  const isLastChapter = activeChapter?.headline === 'Start for free.';

  return (
    <main className="bg-black">
      {/* ── Sticky nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 pointer-events-none">
        <div className="pointer-events-auto">
          <VestaLogo size="sm" />
        </div>
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="text-white/50 hover:text-white text-xs tracking-widest uppercase transition-colors"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs tracking-widest uppercase rounded-full transition-colors font-medium"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Scroll-scrubbed video section ── */}
      <div ref={containerRef} style={{ height: SCROLL_HEIGHT }} className="relative">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-black" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
          <ScrollyVideo
            src="/hotel.mp4"
            transitionSpeed={6}
            frameThreshold={0.01}
            cover
            sticky={false}
            trackScroll={false}
            videoPercentage={progress}
          />

          {/* Watermark cover */}
          <div className="absolute bg-black" style={{ bottom: 0, right: 0, width: '14%', height: '9%' }} />

          {/* Vignettes */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80 pointer-events-none" />
          {activeChapter?.align === 'left' && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent pointer-events-none transition-opacity duration-700" />
          )}
          {activeChapter?.align === 'right' && (
            <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/20 to-transparent pointer-events-none transition-opacity duration-700" />
          )}
          {activeChapter?.align === 'center' && (
            <div className="absolute inset-0 bg-black/30 pointer-events-none transition-opacity duration-700" />
          )}

          {/* Chapter text */}
          <div
            className={`absolute inset-0 flex flex-col justify-center px-10 md:px-24 gap-4 transition-all duration-500 ${alignClass}`}
          >
            {activeChapter && (
              <>
                {activeChapter.eyebrow && (
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40 drop-shadow">{activeChapter.eyebrow}</p>
                )}
                <h2
                  className={`font-light text-white drop-shadow-lg leading-tight max-w-xl transition-all duration-500 ${
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
                  <p className="text-sm text-white/70 leading-relaxed max-w-sm mt-1 drop-shadow">{activeChapter.sub}</p>
                )}
                {isLastChapter && (
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="mt-4 w-fit px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-full text-sm tracking-widest uppercase font-medium transition-all duration-300"
                  >
                    Get Started Free
                  </button>
                )}
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10 pointer-events-none">
            <div className="h-full bg-amber-500/60 transition-all duration-100" style={{ width: `${progress * 100}%` }} />
          </div>

          {/* Scroll hint */}
          <div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 transition-opacity duration-700 pointer-events-none ${progress > 0.04 ? 'opacity-0' : 'opacity-100'}`}
          >
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <div className="w-px h-6 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Metrics ── */}
      <section className="bg-black text-white px-8 md:px-24 py-32">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-16">The Numbers</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
          {METRICS.map(item => (
            <div key={item.stat} className="bg-black px-8 py-12">
              <p className="text-4xl md:text-5xl font-light mb-3">{item.stat}</p>
              <p className="text-white/80 text-sm mb-1">{item.label}</p>
              <p className="text-white/30 text-xs uppercase tracking-widest">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-black text-white px-8 md:px-24 py-24 border-t border-white/10">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-16">What We Build</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl">
          {FEATURES.map(f => (
            <div key={f.title} className="border-t border-white/10 pt-8">
              <p className="text-white text-lg font-light mb-2">{f.title}</p>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-black text-white px-8 md:px-24 py-32 border-t border-white/10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-6">The Opportunity</p>
        <h2 className="text-4xl md:text-6xl font-light mb-6 max-w-2xl mx-auto leading-tight">
          No dominant player owns hotel-specific financial AI.
        </h2>
        <p className="text-white/40 text-sm max-w-md mx-auto mb-12 leading-relaxed">
          16,500 independent hotels in the US alone. First-mover advantage is still available.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-full text-sm tracking-widest uppercase font-medium transition-all duration-300"
          >
            Get Started Free
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-10 py-4 border border-white/30 rounded-full text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
          >
            See the Dashboard
          </button>
        </div>

        <div className="mt-24 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/20 text-xs">
          <VestaLogo size="sm" />
          <span>© 2026 Vesta. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white/50 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white/50 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
