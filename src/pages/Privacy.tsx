import { Link } from 'react-router-dom'
import {
  StitchRefinedPageLayout,
  stitchLead,
  stitchPageTitleLg,
  stitchTonalCard,
} from '@/components/layout/StitchRefinedPageLayout'

const Privacy = () => {
  return (
    <StitchRefinedPageLayout contentMax="4xl">
      <div className="mb-12 text-center md:mb-16">
        <h1 className={`${stitchPageTitleLg} mb-4 md:mb-6`}>Privacy Policy</h1>
        <p className={`${stitchLead} text-lg`}>Last updated: April 2026</p>
      </div>

      <div className={`${stitchTonalCard} p-6 md:p-10`}>
        <div className="prose prose-gray max-w-none font-stitch-body">
          <section className="mb-8">
            <h2 className="mb-4 font-stitch text-2xl font-semibold text-vesta-navy">Data Collection</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              We collect only the information necessary to provide our financial analysis services. This includes financial
              data you upload, account information (email, name), and usage data to improve our service. We never collect
              more data than we need.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 font-stitch text-2xl font-semibold text-vesta-navy">Data Security</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              Your financial data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit. We use
              industry-standard security measures to protect your information, including regular security audits and secure
              cloud infrastructure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 font-stitch text-2xl font-semibold text-vesta-navy">Data Usage</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              We use your data solely to provide financial analysis and insights. We do not sell or share your personal data
              with third parties for marketing purposes. Your financial data is never used to train our AI models.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 font-stitch text-2xl font-semibold text-vesta-navy">Your Rights</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              You have the right to access, correct, or delete your personal data at any time. You can export your data or
              request complete account deletion through your settings or by contacting our support team.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 font-stitch text-2xl font-semibold text-vesta-navy">Cookies</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              We use essential cookies to maintain your session and preferences. We may use analytics cookies to understand
              how our service is used, but these can be disabled in your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 font-stitch text-2xl font-semibold text-vesta-navy">Subprocessors</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              We engage service providers (for example hosting, database, payments, and email) to operate Vesta. A current
              list, DPA contact path, and related links are on our{' '}
              <Link
                to="/trust"
                className="font-medium text-vesta-navy underline-offset-2 hover:text-vesta-gold hover:underline"
              >
                Trust &amp; data partners
              </Link>{' '}
              page.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-stitch text-2xl font-semibold text-vesta-navy">Contact Us</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              If you have any questions about our privacy practices, please contact us at{' '}
              <a href="mailto:vestacfo@gmail.com" className="font-medium text-vesta-navy hover:text-vesta-gold hover:underline">
                vestacfo@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-amber-50/90 p-6 text-center ring-1 ring-amber-200/70 shadow-[0_8px_32px_-12px_rgba(217,119,6,0.12)]">
        <p className="text-sm text-amber-900">
          <strong>Note:</strong> This policy is updated as the product and regulatory landscape evolve. For vendor details
          and DPA requests, see{' '}
          <Link to="/trust" className="font-semibold underline-offset-2 hover:text-vesta-navy hover:underline">
            Trust &amp; data partners
          </Link>
          .
        </p>
      </div>
    </StitchRefinedPageLayout>
  )
}

export default Privacy
