# Vesta CFO — Brand kit

Aligned with **`docs/AI_CFO_Dev_Plan_v2.pdf`** (product narrative, pricing, features). Code tokens live in `src/brand/vesta-cfo-brand.ts` and `src/index.css` (`:root`).

## Colors

| Role | Hex | Usage |
|------|-----|--------|
| Navy (primary) | `#1B3A5C` | Headers, primary buttons, nav active states, trust |
| Navy muted | `#2E6DA4` | Links, secondary emphasis |
| Gold (accent) | `#C8963E` | CTAs, highlights, KPI “positive” accents |
| Cream | `#F7F4EE` | Page backgrounds, warm marketing canvas |
| Mist | `#D6E8F2` | Soft panels, subtle fills |

Tailwind: `vesta-navy`, `vesta-navy-muted`, `vesta-gold`, `vesta-cream`, `vesta-mist` (see `tailwind.config.ts`).

## Typography

- **Serif / display:** Cormorant Garamond — headlines, “Vesta CFO” moments  
- **Sans:** DM Sans — UI body, nav, forms  
- **Mono:** DM Mono — labels, technical callouts  

## Product naming

- **Product:** Vesta CFO  
- **Not:** Generic “AI accountant” or prior-company positioning  

## SaaS pricing (public)

From the dev plan **Stream 1: SaaS subscription**:

| Tier | Who | Price | Includes (summary) |
|------|-----|-------|---------------------|
| **Starter** | 1–2 properties | **$299/mo** | Dashboard, AI summary, anomaly alerts, **1 PMS** |
| **Growth** | 3–15 properties | **$799/mo per property** | + Benchmarking, forecasting, multi-PMS, partner recommendations |
| **Enterprise** | 15+ properties | **Custom (~$2K+/mo)** | White-glove, SLA, custom integrations, dedicated support |

**Stream 2** (partner marketplace / AI Cost Cutter) and **Stream 3** (future data insights) are positioning layers on the site copy, not separate SKUs on the pricing table.

## Feature pillars (for copy)

1. **AI financial summary** — Daily briefing, weekly report, Ask AI, variance explanations, scenarios (roadmap by version).  
2. **Cost Cutter & marketplace** — Spend analysis, anomalies, partner recommendations, savings tracker.  
3. **Monitoring & alerts** — Revenue, labor, F&B, OTA commissions, notifications.  
4. **Dashboard & metrics** — RevPAR, ADR, GOPPAR, TRevPAR, benchmarking, cash flow, multi-property.  
5. **Integrations** — PMS first; OTAs, payroll, F&B POS, accounting, banking, invoices per roadmap.  

## Voice

- Speak to **owners, GMs, asset managers** at independent and boutique hotels.  
- Prefer **hotel metrics and outcomes** over abstract “AI credits.”  
- Marketplace savings are **specific and quantified** when possible (“$X/room”, “estimated annual savings”).  

## App vs marketing

Public pricing and feature copy follow **`docs/AI_CFO_Dev_Plan_v2.pdf`**. Some in-app flows may still reference **legacy Stripe** assistant tiers (e.g. Scale / CFO at different price points) until billing is migrated; the **pricing page** is the source of truth for what you sell to hotels going forward.

---

*Update this file when the PDF roadmap or pricing changes.*
