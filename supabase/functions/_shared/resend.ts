import { Resend } from "npm:resend@2.0.0";

/**
 * Central Resend configuration for Edge Functions.
 *
 * Supabase secrets (Dashboard → Project Settings → Edge Functions):
 * - RESEND_API_KEY — required to send mail
 * - RESEND_FROM — optional, e.g. "Vesta <noreply@yourdomain.com>" (must be a verified domain in Resend)
 * - RESEND_REPLY_TO — optional reply-to address
 *
 * Without a verified domain, Resend allows testing with onboarding@resend.dev as the from address.
 */
const DEFAULT_FROM = "Vesta <onboarding@resend.dev>";

export function getResendFrom(): string {
  const v = Deno.env.get("RESEND_FROM")?.trim();
  return v && v.length > 0 ? v : DEFAULT_FROM;
}

export function getResendReplyTo(): string | undefined {
  const v = Deno.env.get("RESEND_REPLY_TO")?.trim();
  return v && v.length > 0 ? v : undefined;
}

export function createResend(): Resend | null {
  const key = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!key) return null;
  return new Resend(key);
}

/** Fields for `resend.emails.send` (Resend JS SDK uses camelCase). */
export function resendBaseSendFields(): { from: string; replyTo?: string } {
  const replyTo = getResendReplyTo();
  return replyTo ? { from: getResendFrom(), replyTo } : { from: getResendFrom() };
}
