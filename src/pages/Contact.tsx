import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, FileText, MapPin, ArrowRight, Calendar } from 'lucide-react';
import { MarketingPageShell } from '@/components/marketing/MarketingPageShell';
import { TellUsMoreSection } from '@/components/marketing/TellUsMoreSection';
import { marketingImages } from '@/lib/marketing-images';
import { morphSpringSoft } from '@/lib/motion';

const channels = [
  {
    icon: Mail,
    title: 'Email',
    description: 'Best for product questions, billing, and partnership inquiries.',
    action: 'support@vesta.ai',
    href: 'mailto:support@vesta.ai',
    external: true,
    border: 'border-l-4 border-l-amber-500',
    iconBg: 'bg-amber-100 text-amber-700',
  },
  {
    icon: MessageCircle,
    title: 'Support center',
    description: 'Help articles, status, and how to get unstuck fast.',
    action: 'Visit support',
    href: '/support',
    external: false,
    border: 'border-l-4 border-l-vesta-navy',
    iconBg: 'bg-vesta-mist text-vesta-navy',
  },
  {
    icon: FileText,
    title: 'Documentation',
    description: 'Connect data, understand metrics, and use AI features end-to-end.',
    action: 'Open docs',
    href: '/docs',
    external: false,
    border: 'border-l-4 border-l-cyan-500',
    iconBg: 'bg-cyan-100 text-cyan-700',
  },
  {
    icon: MapPin,
    title: 'Office',
    description: 'Vesta operates as a distributed team with hubs in the United States.',
    action: 'Remote-first',
    href: null,
    external: false,
    border: 'border-l-4 border-l-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
] as const;

export default function Contact() {
  useEffect(() => {
    document.title = 'Contact · Vesta CFO';
  }, []);

  return (
    <MarketingPageShell>
      <div className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-vesta-mist/40 blur-3xl opacity-80"
        />

        <section className="relative">
          <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-0 lg:gap-10 items-stretch min-h-[320px]">
            <div className="relative hidden lg:block rounded-3xl overflow-hidden shadow-xl border border-vesta-navy/10 m-6 mb-0 lg:m-0 lg:rounded-r-none lg:my-8">
              <img
                src={marketingImages.contact.src}
                alt={marketingImages.contact.alt}
                className="absolute inset-0 w-full h-full object-cover"
                width={800}
                height={600}
                loading="eager"
              />
              <div className="absolute inset-0 bg-vesta-navy/60" />
            </div>
            <div className="py-12 sm:py-16 lg:py-20 flex flex-col justify-center text-center lg:text-left px-2">
              <motion.h1
                initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={morphSpringSoft}
                className="font-serif text-4xl sm:text-5xl text-vesta-navy font-normal leading-tight"
              >
                Let&apos;s{' '}
                <span className="text-vesta-gold">talk.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...morphSpringSoft, delay: 0.06 }}
                className="mt-5 text-lg text-vesta-navy/80 leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                Reach the Vesta team for support, press, partnerships, or general questions. We typically reply within one
                business day. If your request is urgent, say so in the subject line.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...morphSpringSoft, delay: 0.12 }}
                className="mt-8 lg:hidden rounded-2xl overflow-hidden border border-vesta-navy/10 shadow-md max-w-md mx-auto"
              >
                <img
                  src={marketingImages.contact.src}
                  alt={marketingImages.contact.alt}
                  className="w-full h-48 object-cover"
                  width={600}
                  height={400}
                  loading="lazy"
                />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative max-w-5xl mx-auto px-6 pb-8">
          <div className="grid sm:grid-cols-2 gap-6">
            {channels.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ ...morphSpringSoft, delay: i * 0.06 }}
                className={`rounded-2xl border border-vesta-navy/10 bg-white ${c.border} p-7 flex flex-col shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center mb-4`}>
                  <c.icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <h2 className="font-serif text-xl text-vesta-navy mb-2">{c.title}</h2>
                <p className="text-vesta-navy/80 text-sm leading-relaxed flex-1 mb-5">{c.description}</p>
                {c.href ? (
                  c.external ? (
                    <a
                      href={c.href}
                      className="inline-flex items-center gap-2 text-vesta-navy hover:text-vesta-gold text-sm font-semibold"
                    >
                      {c.action}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link
                      to={c.href}
                      className="inline-flex items-center gap-2 text-vesta-navy hover:text-vesta-gold text-sm font-semibold"
                    >
                      {c.action}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )
                ) : (
                  <span className="text-vesta-navy/65 text-sm font-mono">{c.action}</span>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 rounded-2xl border-2 border-dashed border-vesta-navy/20 bg-vesta-mist/40 p-8 text-center"
          >
            <Calendar className="w-10 h-10 text-vesta-navy mx-auto mb-3" />
            <p className="text-vesta-navy/90 text-sm max-w-lg mx-auto font-medium">
              Prefer a live walkthrough?{' '}
              <a
                href="https://calendar.app.google/PWqhmizMxqUnRNpP9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-vesta-navy hover:text-vesta-gold underline underline-offset-4"
              >
                Book time on our calendar
              </a>{' '}
              — same team, tailored to your property.
            </p>
          </motion.div>
        </section>

        <TellUsMoreSection className="bg-white border-t border-vesta-navy/8" />
      </div>
    </MarketingPageShell>
  );
}
