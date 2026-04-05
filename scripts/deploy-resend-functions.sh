#!/usr/bin/env bash
# Deploy every Edge Function that sends mail via Resend.
# Requires: supabase CLI logged in with deploy access to the project.
# Optional: SUPABASE_PROJECT_REF=your_ref (defaults to linked project in supabase/.temp).
#
# Uses --use-api so Docker is not required for bundling.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ARGS=(--use-api --yes)
if [[ -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  ARGS+=(--project-ref "$SUPABASE_PROJECT_REF")
fi

FUNCS=(
  send-test-email
  send-password-reset
  stripe-webhook
  invite-team-member
  team-notifications
  send-welcome-email
  send-subscription-email
  send-notification-email
  send-application-confirmation
  create-support-ticket
  detect-hotel-anomalies
  detect-hotel-anomalies-internal
  generate-weekly-report
)

for f in "${FUNCS[@]}"; do
  echo "==> Deploying $f"
  supabase functions deploy "$f" "${ARGS[@]}"
done

echo "==> All Resend-related functions deployed."
