/**
 * Plain-language KPI copy for hotel owners (dashboard tooltips).
 * Aligns expectations: Vesta reflects loaded daily_metrics; PMS remains operational source of truth.
 */
export const HOTEL_KPI_TOOLTIPS = {
  revpar:
    'RevPAR is room revenue divided by available room nights for that day. Vesta shows what has been synced or imported into your daily metrics — use your PMS night audit or pickup report if you need to reconcile to the penny.',
  adr:
    'ADR is average revenue per occupied room night. It uses the same daily metrics row as RevPAR. If your PMS defines ADR differently (e.g. with comps or packages), compare both side by side the first week.',
  occupancy:
    'Occupancy here is sold room nights divided by available room nights, shown as a percentage. It depends on how rooms sold and availability were captured when data was synced or uploaded.',
  goppar:
    'GOPPAR is gross operating profit per available room. It needs both revenue and expense fields in your daily metrics. Treat this as directional unless your finance team has aligned definitions with imported or synced data.',
} as const

export const HOTEL_KPI_DATA_SOURCE_NOTE =
  'These figures reflect the latest daily metrics stored in Vesta for your property. Your PMS or accounting system remains the system of record — use Vesta for trends, alerts, and owner-ready context.'
