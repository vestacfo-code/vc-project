import { Link } from 'react-router-dom'
import { Activity, CheckCircle2, Mail } from 'lucide-react'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

type ComponentStatus = 'operational' | 'degraded' | 'outage'

const COMPONENTS: {
  name: string
  role: string
  status: ComponentStatus
}[] = [
  { name: 'Vesta application', role: 'Web app & API routes (hosted on Vercel)', status: 'operational' },
  { name: 'Database & authentication', role: 'Supabase (Postgres, Auth, Edge Functions)', status: 'operational' },
  { name: 'Payments', role: 'Stripe (subscriptions & billing portal)', status: 'operational' },
  { name: 'Transactional email', role: 'Resend (password reset, notifications)', status: 'operational' },
]

function StatusDot({ status }: { status: ComponentStatus }) {
  if (status === 'operational') {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        Operational
      </span>
    )
  }
  if (status === 'degraded') {
    return <span className="text-sm font-medium text-amber-800">Degraded performance</span>
  }
  return <span className="text-sm font-medium text-red-800">Outage</span>
}

export default function Status() {
  const allOk = COMPONENTS.every((c) => c.status === 'operational')

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="relative flex-1">
        <div className="absolute inset-0 bg-gradient-to-b from-vesta-cream via-vesta-mist/30 to-vesta-mist/50" />
        <div className="relative z-10">
          <Header />
          <div className="container mx-auto max-w-3xl px-4 py-16">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-vesta-gold/15 ring-1 ring-vesta-gold/30">
                <Activity className="h-7 w-7 text-vesta-gold" aria-hidden />
              </div>
              <h1 className="font-serif text-4xl font-normal tracking-tight text-vesta-navy sm:text-5xl">System status</h1>
              <p className="mx-auto mt-3 max-w-lg text-vesta-navy/80">
                High-level health of Vesta services. This page is updated by our team; it is not a live third-party status
                feed.
              </p>
            </div>

            <div
              className={`mb-10 rounded-2xl border p-5 shadow-sm ${
                allOk ? 'border-emerald-200 bg-emerald-50/80' : 'border-amber-200 bg-amber-50/80'
              }`}
            >
              <p className="text-sm font-semibold text-vesta-navy">
                {allOk ? 'All systems operational' : 'Some components may be affected — see below'}
              </p>
              <p className="mt-1 text-xs text-vesta-navy/75">
                Last reviewed: {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
              </p>
            </div>

            <div className="rounded-2xl border border-vesta-navy/10 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold text-vesta-navy">Components</h2>
              <ul className="divide-y divide-vesta-navy/10">
                {COMPONENTS.map((c) => (
                  <li key={c.name} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-vesta-navy">{c.name}</p>
                      <p className="text-xs text-vesta-navy/65">{c.role}</p>
                    </div>
                    <StatusDot status={c.status} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 rounded-2xl border border-vesta-navy/10 bg-vesta-mist/30 p-6">
              <h2 className="mb-2 text-sm font-semibold text-vesta-navy">Incidents & questions</h2>
              <p className="text-sm text-vesta-navy/80">
                If you cannot sign in, sync data, or receive email, contact{' '}
                <a href="mailto:support@vesta.ai" className="font-medium text-vesta-navy underline-offset-2 hover:text-vesta-gold hover:underline">
                  support@vesta.ai
                </a>
                . For security vulnerabilities, see our{' '}
                <Link to="/security" className="font-medium text-vesta-navy underline-offset-2 hover:text-vesta-gold hover:underline">
                  Security
                </Link>{' '}
                page.
              </p>
              <a
                href="mailto:support@vesta.ai?subject=Vesta%20status%20or%20outage"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-vesta-navy hover:text-vesta-gold"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Email support
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
