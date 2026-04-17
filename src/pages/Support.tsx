import { Link } from 'react-router-dom'
import { Mail, MessageCircle, FileText, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  StitchRefinedPageLayout,
  stitchFeatureIconCircle,
  stitchLead,
  stitchPageTitleLg,
  stitchTonalCard,
} from '@/components/layout/StitchRefinedPageLayout'

const Support = () => {
  return (
    <StitchRefinedPageLayout contentMax="4xl">
      <div className="mb-12 text-center md:mb-16">
        <h1 className={`${stitchPageTitleLg} mb-4 md:mb-6`}>Support Center</h1>
        <p className={`${stitchLead} mx-auto max-w-2xl text-lg md:text-xl`}>
          We&apos;re here to help you get the most out of Vesta.
        </p>
        <p className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-vesta-navy/70">
          <Link
            to="/status"
            className="font-medium text-vesta-navy underline-offset-2 hover:text-vesta-gold hover:underline"
          >
            System status
          </Link>
          <span aria-hidden className="text-vesta-navy/30">
            ·
          </span>
          <Link
            to="/trust"
            className="font-medium text-vesta-navy underline-offset-2 hover:text-vesta-gold hover:underline"
          >
            Trust &amp; vendors (DPA)
          </Link>
        </p>
      </div>

      <div className="mb-16 grid gap-6 md:grid-cols-3">
        <div className={`${stitchTonalCard} p-6 transition-shadow hover:shadow-[0_12px_48px_-16px_rgba(27,58,92,0.14)] md:p-8`}>
          <div className="mb-4 flex items-center">
            <div className={cn(stitchFeatureIconCircle, 'mr-4 h-12 w-12 rounded-xl')}>
              <Mail className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="font-stitch text-xl font-semibold text-vesta-navy">Email Support</h2>
          </div>
          <p className="mb-6 text-vesta-navy/80">
            Get help with technical issues or general questions about Vesta. We typically respond within 24 hours.
          </p>
          <a
            href="mailto:support@vesta.ai"
            className="inline-flex items-center font-medium text-vesta-navy-muted transition-colors hover:text-vesta-gold"
          >
            support@vesta.ai
          </a>
        </div>

        <div className={`${stitchTonalCard} p-6 transition-shadow hover:shadow-[0_12px_48px_-16px_rgba(27,58,92,0.14)] md:p-8`}>
          <div className="mb-4 flex items-center">
            <div className={cn(stitchFeatureIconCircle, 'mr-4 h-12 w-12 rounded-xl')}>
              <MessageCircle className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="font-stitch text-xl font-semibold text-vesta-navy">Live Chat</h2>
          </div>
          <p className="mb-6 text-vesta-navy/80">
            Chat with our AI assistant for instant answers, or get connected to our support team.
          </p>
          <Link
            to="/chat"
            className="inline-flex items-center font-medium text-vesta-navy-muted transition-colors hover:text-vesta-gold"
          >
            Start Chat →
          </Link>
        </div>

        <div className={`${stitchTonalCard} p-6 transition-shadow hover:shadow-[0_12px_48px_-16px_rgba(27,58,92,0.14)] md:p-8`}>
          <div className="mb-4 flex items-center">
            <div className={cn(stitchFeatureIconCircle, 'mr-4 h-12 w-12 rounded-xl')}>
              <FileText className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="font-stitch text-xl font-semibold text-vesta-navy">Documentation</h2>
          </div>
          <p className="mb-6 text-vesta-navy/80">
            Browse our comprehensive docs for guides, tutorials, and answers to common questions.
          </p>
          <Link
            to="/docs"
            className="inline-flex items-center font-medium text-vesta-navy-muted transition-colors hover:text-vesta-gold"
          >
            Visit Documentation →
          </Link>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="mb-8 text-center font-stitch text-2xl font-semibold text-vesta-navy md:text-3xl">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className={`${stitchTonalCard} p-6`}>
            <h3 className="mb-2 flex items-center font-stitch font-semibold text-vesta-navy">
              <HelpCircle className="mr-2 h-5 w-5 text-vesta-gold" aria-hidden />
              Is Vesta a financial advisor?
            </h3>
            <p className="text-vesta-navy/80">
              No. Vesta is not a registered financial advisor, broker, or investment firm. Our AI provides data analysis
              and insights for informational purposes only. Always consult with qualified financial professionals before
              making important business or investment decisions.
            </p>
          </div>

          <div className={`${stitchTonalCard} p-6`}>
            <h3 className="mb-2 flex items-center font-stitch font-semibold text-vesta-navy">
              <HelpCircle className="mr-2 h-5 w-5 text-vesta-gold" aria-hidden />
              How secure is my financial data?
            </h3>
            <p className="text-vesta-navy/80">
              Your data is encrypted at rest and in transit using industry-standard AES-256 encryption. We follow SOC 2
              security practices and never share your data with third parties.
            </p>
          </div>

          <div className={`${stitchTonalCard} p-6`}>
            <h3 className="mb-2 flex items-center font-stitch font-semibold text-vesta-navy">
              <HelpCircle className="mr-2 h-5 w-5 text-vesta-gold" aria-hidden />
              What file formats do you support?
            </h3>
            <p className="text-vesta-navy/80">
              We support CSV and Excel exports from any PMS. Direct integrations are available for Mews PMS and QuickBooks Online. More integrations are being added — contact us if you need a specific connector.
            </p>
          </div>

          <div className={`${stitchTonalCard} p-6`}>
            <h3 className="mb-2 flex items-center font-stitch font-semibold text-vesta-navy">
              <HelpCircle className="mr-2 h-5 w-5 text-vesta-gold" aria-hidden />
              Can I cancel my subscription anytime?
            </h3>
            <p className="text-vesta-navy/80">
              Yes, you can cancel your subscription at any time. Your access will continue until the end of your current
              billing period.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-white via-vesta-cream to-vesta-mist/50 p-8 text-center ring-1 ring-vesta-navy/[0.08] shadow-[0_12px_48px_-20px_rgba(27,58,92,0.12)] md:p-12">
        <Mail className="mx-auto mb-4 h-12 w-12 text-vesta-gold" aria-hidden />
        <h3 className="mb-2 font-stitch text-xl font-semibold text-vesta-navy">Still have questions?</h3>
        <p className="mb-6 text-vesta-navy/80">Our team is happy to help with anything not covered above.</p>
        <a
          href="mailto:support@vesta.ai"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-vesta-navy to-vesta-navy-muted px-6 py-3 font-stitch text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95"
        >
          Contact Support
        </a>
      </div>
    </StitchRefinedPageLayout>
  )
}

export default Support
