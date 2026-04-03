#!/usr/bin/env bash
# ============================================================
# Vesta — Deploy all edge functions + apply migrations
# Run this once after: supabase login && supabase link --project-ref qjgnbvrxpmspzfqlomjc
# ============================================================

set -e

PROJECT_REF="qjgnbvrxpmspzfqlomjc"
FUNCTIONS=(
  "hotel-ai-chat"
  "hotel-forecasting"
  "hotel-briefing-generator"
  "generate-hotel-briefing"
  "detect-hotel-anomalies"
  "detect-hotel-anomalies-internal"
  "mews-connect"
  "mews-sync"
  "mews-webhook"
  "send-notification-email"
)

echo "🚀 Vesta Deploy Script"
echo "====================="

# 1. Apply pending migrations
echo ""
echo "📦 Applying database migrations..."
npx supabase db push --linked

# 2. Deploy edge functions
echo ""
echo "⚡ Deploying edge functions..."
for fn in "${FUNCTIONS[@]}"; do
  if [ -d "supabase/functions/$fn" ]; then
    echo "  → deploying $fn..."
    npx supabase functions deploy "$fn" --no-verify-jwt
  fi
done

# 3. Set required secrets (prompts user for values)
echo ""
echo "🔑 Checking required secrets..."
echo "  Make sure these are set in Supabase Dashboard → Settings → Edge Functions → Secrets:"
echo "  - OPENAI_API_KEY        (for generate-hotel-briefing)"
echo "  - ANTHROPIC_API_KEY     (for hotel-ai-chat)"
echo "  - RESEND_API_KEY        (for email alerts)"
echo ""
echo "✅ Deploy complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Set OPENAI_API_KEY in Supabase Dashboard → Edge Functions → Secrets"
echo "  2. Set ANTHROPIC_API_KEY in same place"
echo "  3. Set RESEND_API_KEY in same place"
echo "  4. Verify Google OAuth: add https://qjgnbvrxpmspzfqlomjc.supabase.co/auth/v1/callback to Google Cloud Console"
