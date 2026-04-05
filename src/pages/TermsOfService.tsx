import { Link } from 'react-router-dom'
import {
  StitchRefinedPageLayout,
  stitchLead,
  stitchPageTitleLg,
  stitchTonalCard,
} from '@/components/layout/StitchRefinedPageLayout'

const TermsOfService = () => {
  return (
    <StitchRefinedPageLayout contentMax="4xl">
      <div className="mb-12 text-center md:mb-16">
        <h1 className={`${stitchPageTitleLg} mb-4 md:mb-6`}>Terms of Service</h1>
        <p className={`${stitchLead} text-lg`}>Last updated: January 2025 | Version 1.0</p>
      </div>

      <div className={`${stitchTonalCard} p-6 md:p-10`}>
        <div className="prose prose-gray max-w-none space-y-8 font-stitch-body">
          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">1. AI Financial Analysis Disclaimer</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              Vesta provides AI-powered financial analysis and insights for <strong>informational purposes only</strong>.
              These analyses, predictions, and recommendations are not professional financial advice and should not be
              considered as such. Our AI systems are designed to help you understand your business financial data, but they
              cannot replace the expertise of qualified financial professionals.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">2. Accuracy Limitations</h2>
            <p className="mb-3 leading-relaxed text-vesta-navy/80">AI predictions and analyses may contain inaccuracies or errors. You acknowledge that:</p>
            <ul className="list-disc space-y-1 pl-6 text-vesta-navy/80">
              <li>AI-generated insights may be incomplete or incorrect</li>
              <li>Financial predictions are estimates and not guarantees</li>
              <li>Market conditions and business circumstances can change rapidly</li>
              <li>Historical data does not guarantee future performance</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">3. Professional Consultation Recommended</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              Vesta&apos;s analysis is designed to give you clear, data-driven insights. While our reports can guide your
              decision-making, we recommend consulting with a qualified financial advisor, accountant, or other professional
              for major financial decisions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">4. User Responsibility</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              You are <strong>solely responsible</strong> for all financial decisions made using information from Vesta. By
              using our service, you acknowledge that you understand the limitations of AI analysis and accept full
              responsibility for your business decisions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">5. Data Privacy and Security</h2>
            <p className="mb-3 leading-relaxed text-vesta-navy/80">
              Your financial data is processed securely using industry-standard encryption. You are responsible for:
            </p>
            <ul className="list-disc space-y-1 pl-6 text-vesta-navy/80">
              <li>The accuracy of data you provide to Vesta</li>
              <li>Maintaining the security of your account credentials</li>
              <li>Ensuring you have the right to analyze the financial data you provide</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">6. Limitation of Liability</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              Vesta shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting
              from the use of our AI analysis, including financial losses, business interruption, or data loss. Our total
              liability shall not exceed the amount you paid for Vesta services in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">7. Service Availability</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              We strive to provide continuous service but cannot guarantee uninterrupted access. AI analysis features may be
              updated, modified, or temporarily unavailable without notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">8. Acceptable Use</h2>
            <p className="mb-3 leading-relaxed text-vesta-navy/80">You agree not to:</p>
            <ul className="list-disc space-y-1 pl-6 text-vesta-navy/80">
              <li>Upload data you don&apos;t have the right to analyze</li>
              <li>Use Vesta for illegal activities or regulatory violations</li>
              <li>Attempt to reverse engineer or compromise our AI systems</li>
              <li>Share your account access with unauthorized parties</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">9. Termination</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              Either party may terminate this agreement at any time. Upon termination, your access to Vesta services will
              cease, and we will delete your data according to our retention policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">10. Changes to Terms</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              These terms may be updated periodically. We will notify you of material changes via email. Continued use of
              Vesta after notice constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">11. Contact Information</h2>
            <p className="leading-relaxed text-vesta-navy/80">
              If you have questions about these terms, please contact us at{' '}
              <a href="mailto:support@vesta.ai" className="font-medium text-vesta-navy hover:text-vesta-gold hover:underline">
                support@vesta.ai
              </a>
            </p>
          </section>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-vesta-navy/65">
          By using Vesta&apos;s services, you acknowledge that you have read, understood, and agree to be bound by these
          Terms of Service. See also our{' '}
          <Link to="/privacy" className="font-medium text-vesta-navy underline-offset-2 hover:text-vesta-gold hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </StitchRefinedPageLayout>
  )
}

export default TermsOfService
