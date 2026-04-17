import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight, Code2, BarChart3, Megaphone, Palette } from 'lucide-react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { StitchAmbientBackground } from '@/components/layout/StitchRefinedPageLayout';

const TEAM = [
  {
    name: 'Svar Chandak',
    role: 'Engineering Lead',
    focus: 'Architecture, backend, AI features, and full-stack development.',
    icon: Code2,
    initials: 'SC',
    email: 'svar@vesta.ai',
  },
  {
    name: 'Parth',
    role: 'Frontend Engineering',
    focus: 'UI/UX, onboarding flows, and frontend systems.',
    icon: Code2,
    initials: 'P',
    email: 'parth@vesta.ai',
  },
  {
    name: 'Arjun',
    role: 'Business & Outreach',
    focus: 'Industry research, hotel partnerships, and vendor relationships.',
    icon: BarChart3,
    initials: 'A',
    email: 'arjun@vesta.ai',
  },
  {
    name: 'Aarush',
    role: 'Brand & Ops',
    focus: 'Brand identity, marketing, and growth operations.',
    icon: Palette,
    initials: 'AA',
    email: 'aarush@vesta.ai',
  },
];

const About = () => {
  useEffect(() => {
    document.title = 'Team · Vesta CFO';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Meet the team behind Vesta CFO — building AI-powered financial intelligence for independent hotels.',
      );
    }
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-vesta-cream font-stitch-body">
      <StitchAmbientBackground />
      <Header />

      <div className="relative z-10 flex-1">
        {/* Hero */}
        <section className="pt-12 sm:pt-20 pb-8 md:pb-12">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center animate-fade-in">
            <p className="text-xs font-mono tracking-widest uppercase text-vesta-navy/60 mb-4">
              The team
            </p>
            <h1 className="font-stitch text-3xl font-semibold tracking-tight text-vesta-navy md:text-5xl leading-tight">
              Built by hoteliers' advocates.
            </h1>
            <p className="mt-5 text-lg text-vesta-navy/70 max-w-2xl mx-auto leading-relaxed">
              We're a small, focused team obsessed with one problem: independent hotel owners
              deserve the same financial clarity that large flags get from enterprise software —
              at a fraction of the cost.
            </p>
          </div>
        </section>

        {/* Team grid */}
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
              {TEAM.map((member, index) => {
                const Icon = member.icon;
                return (
                  <div
                    key={member.name}
                    className="flex gap-5 items-start bg-white/70 backdrop-blur-sm border border-vesta-navy/10 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <Avatar className="w-16 h-16 shrink-0 ring-4 ring-vesta-mist/60">
                      <AvatarFallback className="bg-vesta-navy text-white text-lg font-semibold">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-vesta-navy text-lg leading-tight">
                        {member.name}
                      </h3>
                      <p className="text-vesta-gold font-semibold text-sm mt-0.5 mb-2">
                        {member.role}
                      </p>
                      <p className="text-vesta-navy/70 text-sm leading-relaxed">
                        {member.focus}
                      </p>
                      <a
                        href={`mailto:${member.email}`}
                        className="text-xs text-vesta-navy/50 hover:text-vesta-navy mt-2 inline-block transition-colors"
                      >
                        {member.email}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mission callout */}
        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center animate-fade-in">
            <div className="bg-vesta-navy rounded-2xl px-8 py-12 md:px-14">
              <h2 className="font-stitch text-2xl md:text-3xl font-semibold text-white mb-4">
                We're early — and moving fast.
              </h2>
              <p className="text-white/75 text-base md:text-lg leading-relaxed mb-8">
                Vesta is actively onboarding its first hotel partners. If you run an independent
                property and want to be among the first to get real AI financial intelligence,
                reach out directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="mailto:svar@vesta.ai">
                  <Button
                    size="lg"
                    className="bg-vesta-gold text-vesta-navy font-semibold hover:bg-vesta-gold/90 border-none px-8"
                  >
                    Get early access
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </a>
                <Link to="/careers">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 px-8"
                  >
                    Join the team
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default About;
