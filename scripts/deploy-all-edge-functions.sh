#!/usr/bin/env bash
# Deploy every Supabase Edge Function (except _shared) for the project in supabase/config.toml.
# Usage: bash scripts/deploy-all-edge-functions.sh
# Optional: SUPABASE_PROJECT_REF=your-ref (defaults to project_id in config.toml)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  PROJECT_REF="$SUPABASE_PROJECT_REF"
else
  PROJECT_REF="$(grep -E '^project_id\s*=' supabase/config.toml | head -1 | cut -d= -f2 | tr -d ' "')"
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo "Could not resolve project ref. Set SUPABASE_PROJECT_REF or fix supabase/config.toml project_id." >&2
  exit 1
fi

echo "Deploying Edge Functions to project: $PROJECT_REF"
echo "Requires: supabase login && network. JWT verification follows config.toml per function."
echo ""

for dir in supabase/functions/*/; do
  name="$(basename "$dir")"
  [[ "$name" == "_shared" ]] && continue
  [[ -f "${dir}index.ts" ]] || continue
  echo ">>> $name"
  supabase functions deploy "$name" --project-ref "$PROJECT_REF"
done

echo ""
echo "Done. Ensure SENTRY_DSN is set: supabase secrets list --project-ref $PROJECT_REF"
