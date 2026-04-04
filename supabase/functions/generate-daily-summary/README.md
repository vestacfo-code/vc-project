# generate-daily-summary

Supabase Edge Function (Deno runtime) that generates a daily AI financial briefing for a hotel and detects metric anomalies.

## What it does

1. Accepts a POST request with `{ hotel_id, date? }`.
2. Verifies the requesting user is a member of the hotel via `hotel_members`.
3. Fetches the last 14 days of `daily_metrics` for the hotel.
4. Fetches hotel details (name, room_count, city, currency).
5. Calculates week-over-week changes for RevPAR, ADR, Occupancy, and GOPPAR.
6. Detects anomalies: any metric that deviates >15% from its 7-day rolling average is flagged with a severity level (`low` / `medium` / `high` / `critical`).
7. Calls the OpenAI Chat Completions API (`gpt-4o`) to generate a structured daily briefing.
8. Falls back to a templated summary if the OpenAI call fails — the function always returns a result.
9. Upserts the summary into `ai_summaries` (unique on `hotel_id + date + period_type`).
10. Upserts any detected anomalies into the `anomalies` table.
11. Returns the summary and anomaly list in the response body.

## Request format

```
POST /functions/v1/generate-daily-summary
Authorization: Bearer <supabase-jwt>
Content-Type: application/json

{
  "hotel_id": "uuid",
  "date": "YYYY-MM-DD"   // optional, defaults to today
}
```

## Response format

```json
{
  "success": true,
  "summary": {
    "hotel_id": "uuid",
    "date": "2026-03-28",
    "period_type": "daily",
    "headline": "...",
    "body": "...",
    "status": "on_track | attention_needed | critical",
    "recommendation": "...",
    "model": "gpt-4o",
    "tokens_used": 312,
    "used_fallback": false,
    "generated_at": "2026-03-28T10:00:00.000Z"
  },
  "anomalies": [
    {
      "metric_name": "revpar",
      "expected_value": 189.0,
      "actual_value": 145.0,
      "deviation_pct": -23.28,
      "severity": "medium",
      "message": "RevPAR is 23% below your 7-day average (145.00 vs 189.00)"
    }
  ]
}
```

Error responses use standard HTTP status codes: `400` (bad request), `401` (unauthorized / not a hotel member), `500` (server error).

## Environment variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key used to call `gpt-4o`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for privileged DB access. |
| `SUPABASE_URL` | Supabase project URL (auto-injected by Supabase). |
| `SUPABASE_ANON_KEY` | Supabase anon key used to verify the user JWT (auto-injected). |

## Anomaly severity thresholds

| Deviation from 7-day avg | Severity |
|---|---|
| >15% | low |
| >25% | medium |
| >40% | high |
| >60% | critical |
