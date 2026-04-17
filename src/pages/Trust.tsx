import { Link } from 'react-router-dom'
import { FileText, Shield } from 'lucide-react'
import {
  StitchRefinedPageLayout,
  stitchIconTile,
  stitchLead,
  stitchPageTitle,
  stitchTonalCard,
  stitchTonalCardMuted,
} from '@/components/layout/StitchRefinedPageLayout'

/** Subprocessors that process customer data on behalf of Vesta (hotel workspace product). */
const SUBPROCESSORS: { name: string; purpose: string; location: string }[] = [
  {
    name: 'Supabase',
    purpose: 'Database, authentication, file storage, and serverless functions',
    location: 'United States (project region)',
  },
  {
    name: 'Vercel',
    purpose: 'Hosting and delivery of the web application',
    location: 'Global edge (primary processing per deployment region)',
  },
  {
    name: 'Stripe',
    purpose: 'Payment processing and customer billing portal',
    location: 'United States / per Stripe documentation',
  },
  {
    name: 'Resend',
    purpose: 'Transactional email (e.g. password reset, account notices)',
    location: 'United States',
  },
  {
    name: 'Sentry',
    purpose: 'Error monitoring and performance diagnostics (configured to limit personal data)',
    location: 'United States / EU options per Sentry',
  },
  {
    name: 'OpenAI',
    purpose: 'AI assistant and document features where enabled',
    location: 'United States / per OpenAI policy',
  },
]

export default function Trust() {
  return (
    <StitchRefinedPageLayout contentMax="3xl">
      <div className="mb-10 text-center">
        <div className={`mx-auto mb-4 ${stitchIconTile}`}>
          <Shield className="h-7 w-7" aria-hidden />
        </div>
        <h1 className={stitchPageTitle}>Trust & data partners</h1>
        <p className={`mx-auto mt-3 max-w-xl ${stitchLead}`}>
          Who helps us run Vesta, how to request a data processing agreement, and where to read our privacy and security
          practices.
        </p>
      </div>

      <div className="space-y-8">
        <section className={`${stitchTonalCard} p-6`}>
          <h2 className="mb-4 flex items-center gap-2 font-stitch text-xl font-semibold text-vesta-navy">
            <FileText className="h-5 w-5 text-vesta-gold" aria-hidden />
            Subprocessors
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-vesta-navy/80">
            We use the vendors below to deliver the service. Your property may also connect third-party products you choose
            (for example Mews or QuickBooks); those are your direct relationships with those vendors.
          </p>
          <div className="overflow-x-auto rounded-xl ring-1 ring-vesta-navy/[0.08]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-vesta-navy/10 bg-vesta-mist/50">
                  <th className="px-4 py-3 font-semibold text-vesta-navy">Vendor</th>
                  <th className="px-4 py-3 font-semibold text-vesta-navy">Role</th>
                  <th className="px-4 py-3 font-semibold text-vesta-navy">Region note</th>
                </tr>
              </thead>
              <tbody>
                {SUBPROCESSORS.map((row) => (
                  <tr key={row.name} className="border-b border-vesta-navy/10 last:border-0">
                    <td className="px-4 py-3 font-medium text-vesta-navy">{row.name}</td>
                    <td className="px-4 py-3 text-vesta-navy/80">{row.purpose}</td>
                    <td className="px-4 py-3 text-vesta-navy/70">{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${stitchTonalCard} p-6`}>
          <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">Data processing agreements (DPA)</h2>
          <p className="text-sm leading-relaxed text-vesta-navy/80">
            For GDPR or other regulatory needs, email{' '}
            <a
              href="mailto:vestacfo@gmail.com?subject=DPA%20request"
              className="font-medium text-vesta-navy underline-offset-2 hover:text-vesta-gold hover:underline"
            >
              vestacfo@gmail.com
            </a>{' '}
            with your company name, property count, and jurisdiction. We will respond with next steps or a standard DPA
            where applicable.
          </p>
        </section>

        <section className={`${stitchTonalCard} p-6`}>
          <h2 className="mb-3 font-stitch text-xl font-semibold text-vesta-navy">Retention (summary)</h2>
          <p className="text-sm leading-relaxed text-vesta-navy/80">
            We retain account and hotel workspace data while your subscription is active and for a limited period afterward
            to meet legal and operational needs. Specific categories and deletion rights are described in our{' '}
            <Link to="/privacy" className="font-medium text-vesta-navy underline-offset-2 hover:text-vesta-gold hover:underline">
              Privacy Policy
            </Link>
            . You may request export or deletion by contacting support.
          </p>
        </section>

        <section className={`${stitchTonalCardMuted} p-6`}>
          <h2 className="mb-3 font-stitch text-lg font-semibold text-vesta-navy">Related</h2>
          <ul className="space-y-2 text-sm text-vesta-navy/80">
            <li>
              <Link to="/privacy" className="font-medium text-vesta-navy hover:text-vesta-gold hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/security" className="font-medium text-vesta-navy hover:text-vesta-gold hover:underline">
                Security & trust
              </Link>
            </li>
            <li>
              <Link to="/status" className="font-medium text-vesta-navy hover:text-vesta-gold hover:underline">
                System status
              </Link>
            </li>
            <li>
              <Link to="/terms" className="font-medium text-vesta-navy hover:text-vesta-gold hover:underline">
                Terms of Service
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </StitchRefinedPageLayout>
  )
}
