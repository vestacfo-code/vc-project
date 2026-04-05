import { Link } from 'react-router-dom'
import { Shield, Lock, Server, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  StitchRefinedPageLayout,
  stitchFeatureIconCircle,
  stitchLead,
  stitchPageTitleLg,
  stitchTonalCard,
} from '@/components/layout/StitchRefinedPageLayout'

const Security = () => {
  return (
    <StitchRefinedPageLayout contentMax="4xl">
      <div className="mb-12 text-center md:mb-16">
        <h1 className={`${stitchPageTitleLg} mb-4 md:mb-6`}>Security & Trust</h1>
        <p className={`${stitchLead} mx-auto max-w-2xl text-lg md:text-xl`}>
          Your financial data deserves the highest level of protection. Here&apos;s how we keep it safe.
        </p>
      </div>

      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <div className={`${stitchTonalCard} p-6 text-center`}>
          <div className={cn(stitchFeatureIconCircle, 'mx-auto mb-4 h-14 w-14 rounded-2xl')}>
            <Shield className="h-7 w-7" aria-hidden />
          </div>
          <h3 className="mb-2 font-stitch text-lg font-semibold text-vesta-navy">Data Protection</h3>
          <p className="text-sm text-vesta-navy/80">
            Your financial data is encrypted at rest and in transit using AES-256
          </p>
        </div>

        <div className={`${stitchTonalCard} p-6 text-center`}>
          <div className={cn(stitchFeatureIconCircle, 'mx-auto mb-4 h-14 w-14 rounded-2xl')}>
            <Lock className="h-7 w-7" aria-hidden />
          </div>
          <h3 className="mb-2 font-stitch text-lg font-semibold text-vesta-navy">Secure Access</h3>
          <p className="text-sm text-vesta-navy/80">Multi-factor authentication and secure login protocols</p>
        </div>

        <div className={`${stitchTonalCard} p-6 text-center`}>
          <div className={cn(stitchFeatureIconCircle, 'mx-auto mb-4 h-14 w-14 rounded-2xl')}>
            <Server className="h-7 w-7" aria-hidden />
          </div>
          <h3 className="mb-2 font-stitch text-lg font-semibold text-vesta-navy">Infrastructure</h3>
          <p className="text-sm text-vesta-navy/80">Enterprise-grade cloud infrastructure with 99.9% uptime</p>
        </div>
      </div>

      <div className={`${stitchTonalCard} mb-8 p-6 md:p-8`}>
        <h2 className="mb-6 font-stitch text-2xl font-semibold text-vesta-navy">Security Measures</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            'End-to-end encryption for all data transmission',
            'AES-256 encryption for data at rest',
            'Regular security audits and penetration testing',
            'SOC 2 Type II compliance (in progress)',
            'GDPR and CCPA compliance',
            'Regular automated backups',
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              <span className="text-vesta-navy/80">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${stitchTonalCard} mb-8 p-6 md:p-8`}>
        <h2 className="mb-4 font-stitch text-2xl font-semibold text-vesta-navy">Trust, vendors & uptime</h2>
        <p className="mb-4 text-sm leading-relaxed text-vesta-navy/80">
          For a list of infrastructure vendors (subprocessors), how to request a DPA, and links to privacy terms, see our
          Trust page. For a high-level view of whether core services are up, see System status.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/trust"
            className="inline-flex items-center rounded-xl bg-white/90 px-4 py-2.5 text-sm font-medium text-vesta-navy ring-1 ring-vesta-navy/10 transition-colors hover:bg-vesta-gold/10 hover:ring-vesta-gold/35"
          >
            Trust &amp; subprocessors
          </Link>
          <Link
            to="/status"
            className="inline-flex items-center rounded-xl bg-white/90 px-4 py-2.5 text-sm font-medium text-vesta-navy ring-1 ring-vesta-navy/10 transition-colors hover:bg-vesta-gold/10 hover:ring-vesta-gold/35"
          >
            System status
          </Link>
          <Link
            to="/privacy"
            className="inline-flex items-center rounded-xl bg-white/90 px-4 py-2.5 text-sm font-medium text-vesta-navy ring-1 ring-vesta-navy/10 transition-colors hover:bg-vesta-gold/10 hover:ring-vesta-gold/35"
          >
            Privacy Policy
          </Link>
        </div>
      </div>

      <div className={`${stitchTonalCard} mb-8 p-6 md:p-8`}>
        <h2 className="mb-4 font-stitch text-2xl font-semibold text-vesta-navy">Report Security Issues</h2>
        <p className="mb-6 text-vesta-navy/80">
          If you discover a security vulnerability, please report it to us immediately. We take all reports seriously and
          will respond promptly.
        </p>
        <a
          href="mailto:support@vesta.ai"
          className="inline-flex items-center rounded-xl bg-gradient-to-r from-vesta-navy to-vesta-navy-muted px-6 py-3 font-stitch text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95"
        >
          Report Security Issue
        </a>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-vesta-navy via-vesta-navy to-vesta-navy-muted p-6 text-center text-white shadow-[0_12px_48px_-12px_rgba(27,58,92,0.45)] ring-1 ring-vesta-gold/25 md:p-8">
        <h3 className="mb-2 font-stitch text-xl font-semibold">Security-first approach</h3>
        <p className="text-sm text-white/85 md:text-base">
          Security is built into every aspect of Vesta. We continuously monitor, update, and improve our security measures
          to protect your sensitive financial data.
        </p>
      </div>
    </StitchRefinedPageLayout>
  )
}

export default Security
