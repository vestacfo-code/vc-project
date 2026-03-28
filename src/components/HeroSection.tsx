import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, AlertTriangle, DollarSign, BarChart3, Zap, Shield } from 'lucide-react';

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden">

      {/* ── HERO ── */}
      <div className="relative bg-[#1B3A5C] min-h-screen flex items-center overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #C8963E 0%, transparent 50%), radial-gradient(circle at 80% 80%, #2E6DA4 0%, transparent 40%)' }}
        />

        <div className="relative container px-6 lg:px-8 mx-auto max-w-screen-xl w-full pt-24 pb-16 lg:pb-24">
          <div className="max-w-4xl mx-auto text-center">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#C8963E] animate-pulse" />
              <span className="font-mono text-xs tracking-widest uppercase text-white/70">
                AI Financial Intelligence for Independent Hotels
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white leading-tight tracking-tight mb-6">
              Your Hotel's Numbers,{' '}
              <span style={{ color: '#C8963E' }}>Explained.</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl lg:text-2xl text-white/70 leading-relaxed max-w-2xl mx-auto mb-10 font-light">
              Connect your PMS and get a daily AI briefing — plain English, specific numbers, no accountant required.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="px-8 py-4 text-base font-medium rounded-lg"
                    style={{ background: '#C8963E', color: '#fff', border: 'none' }}>
                    Go to Dashboard →
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="lg" className="px-8 py-4 text-base font-medium rounded-lg"
                    style={{ background: '#C8963E', color: '#fff', border: 'none' }}>
                    Start Free Pilot →
                  </Button>
                </Link>
              )}
              <Link to="/auth">
                <Button variant="outline" size="lg"
                  className="px-8 py-4 text-base font-medium rounded-lg border-white/30 text-white hover:bg-white/10">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Mock AI daily briefing card */}
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden text-left">
              <div className="bg-[#F7F4EE] border-b border-[#E8E4DC] px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] tracking-widest uppercase text-[#6B6B6B] mb-0.5">Daily AI Briefing</p>
                  <p className="font-display font-semibold text-[#1B3A5C] text-lg">The Heritage Inn — Tuesday, March 26</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-3 py-1 font-mono">On Track</span>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-[#2A2A2A] text-sm leading-relaxed">
                  <span className="font-semibold">Strong Tuesday.</span> RevPAR hit <span className="text-[#1B3A5C] font-semibold">$94.80</span> — up 6% vs same day last week. ADR held at <span className="text-[#1B3A5C] font-semibold">$148</span> despite a 3-room group cancellation.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'RevPAR', value: '$94.80', delta: '↑ 6%', good: true },
                    { label: 'Occupancy', value: '64%', delta: '↑ 4 pts', good: true },
                    { label: 'Labor Cost %', value: '36.2%', delta: '↑ 2 pts', good: false },
                  ].map((m) => (
                    <div key={m.label} className="bg-[#F7F4EE] rounded-lg p-3">
                      <p className="font-mono text-[9px] tracking-widest uppercase text-[#6B6B6B] mb-1">{m.label}</p>
                      <p className="font-display font-bold text-xl text-[#1B3A5C]">{m.value}</p>
                      <p className={`text-xs font-medium ${m.good ? 'text-green-600' : 'text-red-500'}`}>{m.delta}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-semibold">Watch labor costs.</span> Housekeeping overtime on Mon–Tue added $640. Consider scheduling adjustments for low-occupancy midweeks.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="bg-[#F7F4EE] py-20 lg:py-28" id="features">
        <div className="container px-6 lg:px-8 mx-auto max-w-screen-xl">
          <div className="text-center mb-16">
            <p className="font-mono text-xs tracking-widest uppercase text-[#C8963E] mb-3">How it works</p>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-[#1B3A5C]">CFO-level insight in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <Zap className="w-6 h-6" style={{ color: '#C8963E' }} />,
                title: 'Connect your PMS',
                body: 'Link Mews, Cloudbeds, or Opera in under 5 minutes. Vesta pulls your revenue, occupancy, and expense data automatically.',
              },
              {
                step: '02',
                icon: <BarChart3 className="w-6 h-6" style={{ color: '#C8963E' }} />,
                title: 'Get your daily briefing',
                body: 'Every morning: a plain-English summary of yesterday\'s performance, what moved, why it moved, and what to do about it.',
              },
              {
                step: '03',
                icon: <DollarSign className="w-6 h-6" style={{ color: '#C8963E' }} />,
                title: 'Find hidden savings',
                body: 'Vesta flags overspending, catches anomalies early, and matches you with vetted vendors who beat your current rates.',
              },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl p-8 border border-[#E8E4DC]">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-xs text-[#C8963E] tracking-wider">{s.step}</span>
                  <div className="p-2 rounded-lg bg-[#F7F4EE]">{s.icon}</div>
                </div>
                <h3 className="font-display font-semibold text-xl text-[#1B3A5C] mb-3">{s.title}</h3>
                <p className="text-[#6B6B6B] text-sm leading-relaxed font-light">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KEY METRICS ── */}
      <div className="bg-[#1B3A5C] py-20">
        <div className="container px-6 lg:px-8 mx-auto max-w-screen-xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: '$2,400', label: 'Average monthly savings', sub: 'per hotel on platform' },
              { value: '< 5min', label: 'To connect your PMS', sub: 'no IT required' },
              { value: '8×', label: 'ROI vs subscription cost', sub: 'in first 90 days' },
              { value: '24/7', label: 'Anomaly monitoring', sub: 'alerts before they compound' },
            ].map((m) => (
              <div key={m.label} className="py-6">
                <p className="font-display font-bold text-4xl lg:text-5xl text-white mb-2">{m.value}</p>
                <p className="text-[#C8963E] font-medium text-sm mb-1">{m.label}</p>
                <p className="text-white/50 font-mono text-xs tracking-wider">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="bg-[#F7F4EE] py-20 lg:py-28">
        <div className="container px-6 lg:px-8 mx-auto max-w-screen-xl">
          <div className="text-center mb-16">
            <p className="font-mono text-xs tracking-widest uppercase text-[#C8963E] mb-3">What Vesta does</p>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-[#1B3A5C]">Everything your accountant doesn't tell you</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <TrendingUp className="w-5 h-5" />, title: 'Daily AI Briefing', body: 'Plain-English summary of RevPAR, GOPPAR, ADR, labor costs, and what drove each number — every morning in your inbox.' },
              { icon: <AlertTriangle className="w-5 h-5" />, title: 'Anomaly Detection', body: 'Get alerted the moment something looks off — revenue drop, cost spike, OTA commission increase — before it compounds.' },
              { icon: <DollarSign className="w-5 h-5" />, title: 'Cost Cutter', body: 'We compare your vendor costs to our partner network and flag savings. "Switch linen supplier → save $3,200/yr."' },
              { icon: <BarChart3 className="w-5 h-5" />, title: 'Revenue Analysis', body: 'Channel-by-channel breakdown. See which OTA is your most profitable and where you\'re leaving money on the table.' },
              { icon: <Zap className="w-5 h-5" />, title: 'Ask Vesta Anything', body: '"Why did my F&B margins drop in March?" Get an answer backed by your own data, not generic advice.' },
              { icon: <Shield className="w-5 h-5" />, title: 'PMS Integrations', body: 'Connects to Mews, Cloudbeds, Opera, QuickBooks, and more. Your data stays yours — always.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-[#E8E4DC]">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: '#1B3A5C', color: '#C8963E' }}>
                  {f.icon}
                </div>
                <h3 className="font-display font-semibold text-lg text-[#1B3A5C] mb-2">{f.title}</h3>
                <p className="text-[#6B6B6B] text-sm leading-relaxed font-light">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA BANNER ── */}
      <div className="bg-[#C8963E] py-16">
        <div className="container px-6 mx-auto max-w-screen-xl text-center">
          <h2 className="font-display font-bold text-3xl lg:text-4xl text-white mb-4">
            Ready to know your hotel's numbers?
          </h2>
          <p className="text-white/80 text-lg mb-8 font-light">
            Free pilot. No credit card. Connect your PMS in 5 minutes.
          </p>
          <Link to="/auth">
            <Button size="lg" className="px-10 py-4 text-base font-medium rounded-lg"
              style={{ background: '#1B3A5C', color: '#fff', border: 'none' }}>
              Start Free Pilot →
            </Button>
          </Link>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
