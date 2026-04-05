import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getBrowserSentryDsn, Sentry } from '@/lib/sentry';

function ThrowOnRender() {
  throw new Error('Sentry debug: intentional render error');
}

/**
 * Dev-only smoke tests for Sentry (messages, handled errors, boundary).
 * Open /__debug/sentry with VITE_SENTRY_DSN set and confirm events in Sentry.
 */
export default function SentryDebug() {
  const [throwing, setThrowing] = useState(false);
  const hasDsn = Boolean(getBrowserSentryDsn());

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 bg-vesta-cream px-6 py-12 text-slate-800">
      <div>
        <h1 className="text-xl font-semibold text-vesta-navy">Sentry debug</h1>
        <p className="mt-2 text-sm text-slate-600">
          {hasDsn
            ? 'Send test events and confirm they appear in your Sentry project (Issues and Performance).'
            : 'Sentry is disabled (set VITE_SENTRY_DSN=false). Restart dev after changing .env.'}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="font-medium text-vesta-navy">Full-stack checklist</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Browser: use the buttons below; sign in to confirm{' '}
            <code className="text-xs text-slate-800">setUser</code> on issues.
          </li>
          <li>
            Supabase Edge: filter Sentry by tag{' '}
            <code className="text-xs text-slate-800">edge_function</code> after
            deploying functions with{' '}
            <code className="text-xs text-slate-800">npm run deploy:edge-functions</code>
            .
          </li>
          <li>
            Secrets: <code className="text-xs text-slate-800">SENTRY_DSN</code> on
            Supabase; <code className="text-xs text-slate-800">VITE_SENTRY_DSN</code>{' '}
            on Vercel/local.
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="rounded-lg bg-vesta-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          onClick={() =>
            Sentry.captureMessage('Sentry debug: manual test message', 'info')
          }
        >
          Send test message
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          onClick={() => {
            try {
              throw new Error('Sentry debug: captured exception');
            } catch (e) {
              Sentry.captureException(e);
            }
          }}
        >
          Capture handled exception
        </button>
        <button
          type="button"
          className="rounded-lg border border-amber-600 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
          onClick={() => setThrowing(true)}
        >
          Trigger error boundary (uncaught)
        </button>
      </div>

      {throwing ? <ThrowOnRender /> : null}

      <Link to="/" className="text-sm text-[#7ba3e8] hover:underline">
        ← Back home
      </Link>
    </div>
  );
}
