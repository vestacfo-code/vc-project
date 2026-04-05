import { useState } from 'react';
import { Link } from 'react-router-dom';
import { VESTA_PRODUCT_NAME } from '@/brand/vesta-cfo-brand';
import { getBrowserSentryDsn, Sentry } from '@/lib/sentry';
import { supabase } from '@/integrations/supabase/client';

function ThrowOnRender() {
  throw new Error('Sentry debug: intentional render error');
}

/**
 * Dev-only smoke tests for Sentry (messages, handled errors, boundary).
 * Styling follows BRAND_KIT.md (vesta-navy, cream, mist, gold, display/sans/mono).
 */
export default function SentryDebug() {
  const [throwing, setThrowing] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const hasDsn = Boolean(getBrowserSentryDsn());

  if (!import.meta.env.DEV) {
    return null;
  }

  const codeCls =
    'rounded px-1 py-0.5 font-mono text-xs text-vesta-navy bg-vesta-mist/60';

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 bg-vesta-cream px-6 py-12 font-sans text-vesta-navy">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-vesta-navy-muted">
          {VESTA_PRODUCT_NAME} · developer tools
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-vesta-navy md:text-4xl">
          Sentry debug
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-vesta-navy/80">
          {hasDsn
            ? 'Send test events and confirm they appear in your Sentry project (Issues and Performance).'
            : 'Sentry is disabled (set VITE_SENTRY_DSN=false). Restart dev after changing .env.'}
        </p>
      </div>

      <div className="rounded-xl border border-vesta-navy/10 bg-vesta-mist/35 p-5 text-sm text-vesta-navy/90 shadow-sm">
        <p className="font-sans font-semibold text-vesta-navy">Full-stack checklist</p>
        <ul className="mt-3 list-inside list-disc space-y-2 marker:text-vesta-gold">
          <li>
            Browser: use the buttons below; sign in to confirm{' '}
            <code className={codeCls}>setUser</code> on issues.
          </li>
          <li>
            Supabase Edge: filter Sentry by tag{' '}
            <code className={codeCls}>edge_function</code> after deploying functions with{' '}
            <code className={codeCls}>npm run deploy:edge-functions</code>.
          </li>
          <li>
            Secrets: <code className={codeCls}>SENTRY_DSN</code> on Supabase;{' '}
            <code className={codeCls}>VITE_SENTRY_DSN</code> on Vercel/local.
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="rounded-lg bg-vesta-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-vesta-navy/90"
          onClick={() =>
            Sentry.captureMessage('Sentry debug: manual test message', 'info')
          }
        >
          Send test message
        </button>
        <button
          type="button"
          className="rounded-lg border-2 border-vesta-navy-muted/40 bg-white px-4 py-2.5 text-sm font-medium text-vesta-navy transition hover:border-vesta-navy-muted hover:bg-vesta-mist/40"
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
          className="rounded-lg border-2 border-vesta-gold bg-vesta-gold/15 px-4 py-2.5 text-sm font-semibold text-vesta-navy transition hover:bg-vesta-gold/25"
          onClick={() => setThrowing(true)}
        >
          Trigger error boundary (uncaught)
        </button>
      </div>

      <div className="rounded-xl border border-vesta-navy/10 bg-white p-5 text-sm text-vesta-navy/90 shadow-sm">
        <p className="font-sans font-semibold text-vesta-navy">Resend (transactional email)</p>
        <p className="mt-2 leading-relaxed text-vesta-navy/75">
          Production email (password reset, invites, etc.) is sent by Edge Functions using Resend — not an
          end-user integration. Sign in, then send a test to your account email to verify{' '}
          <code className={codeCls}>RESEND_API_KEY</code> on Supabase.
        </p>
        {resendMsg ? (
          <p className="mt-2 text-xs text-vesta-navy-muted">{resendMsg}</p>
        ) : null}
        <button
          type="button"
          disabled={resendBusy}
          className="mt-3 rounded-lg border-2 border-vesta-navy-muted/40 bg-vesta-mist/40 px-4 py-2.5 text-sm font-medium text-vesta-navy transition enabled:hover:border-vesta-navy-muted enabled:hover:bg-vesta-mist/70 disabled:opacity-50"
          onClick={async () => {
            setResendMsg(null);
            setResendBusy(true);
            try {
              const { data, error } = await supabase.functions.invoke('send-test-email');
              if (error) throw error;
              const body = data as { success?: boolean; error?: string; email?: string } | null;
              if (body?.error) throw new Error(body.error);
              if (body?.success) {
                setResendMsg(body.email ? `Sent to ${body.email}` : 'Sent.');
              } else {
                throw new Error('Unexpected response');
              }
            } catch (e) {
              setResendMsg(e instanceof Error ? e.message : 'Request failed');
            } finally {
              setResendBusy(false);
            }
          }}
        >
          {resendBusy ? 'Sending…' : 'Send Resend test email'}
        </button>
      </div>

      {throwing ? <ThrowOnRender /> : null}

      <Link
        to="/"
        className="text-sm font-medium text-vesta-navy-muted underline-offset-4 transition hover:text-vesta-navy hover:underline"
      >
        ← Back home
      </Link>
    </div>
  );
}
