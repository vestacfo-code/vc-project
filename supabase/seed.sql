-- =============================================================================
-- Vesta CFO — demo hotel sample data (local / SQL editor / db reset)
-- =============================================================================
-- Populates KPIs, channel mix, budget targets, expenses, AI briefing, anomalies,
-- recommendations, integrations + sync logs, notifications, and a partner lead.
--
-- Prerequisites:
--   • Migrations applied (Vesta hotel + financial + AI + partner tables).
--   • At least one row in auth.users (sign up once in the app, or create a user
--     in Authentication → Users). The seed attaches the demo property to the
--     **first user by created_at**, unless you set:
--       SELECT set_config('vesta.seed_user_email', 'you@example.com', false);
--     before running this script in a session (optional).
--
-- Idempotent: removes any previous demo org named "Vesta CFO Demo Org" owned
-- by the target user, then recreates fresh data (so you can re-run safely).
-- =============================================================================

DO $$
DECLARE
  demo_user   uuid;
  org_id      uuid;
  hotel_id    uuid;
  integ_id    uuid;
  partner_pk  uuid;
  email_cfg   text := current_setting('vesta.seed_user_email', true);
BEGIN
  IF email_cfg IS NOT NULL AND length(trim(email_cfg)) > 0 THEN
    SELECT u.id INTO demo_user
    FROM auth.users u
    WHERE u.email = lower(trim(email_cfg))
    LIMIT 1;
  ELSE
    SELECT u.id INTO demo_user
    FROM auth.users u
    ORDER BY u.created_at
    LIMIT 1;
  END IF;

  IF demo_user IS NULL THEN
    RAISE NOTICE 'vesta seed: no auth user found. Create a user (sign up), then run again.';
    RETURN;
  END IF;

  DELETE FROM public.organizations o
  WHERE o.name = 'Vesta CFO Demo Org'
    AND o.owner_user_id = demo_user;

  INSERT INTO public.organizations (name, owner_user_id, plan)
  VALUES ('Vesta CFO Demo Org', demo_user, 'growth')
  RETURNING id INTO org_id;

  INSERT INTO public.hotels (
    organization_id,
    name,
    address,
    city,
    state,
    zip,
    country,
    room_count,
    star_rating,
    property_type,
    timezone,
    currency,
    pms_provider,
    onboarding_profile
  )
  VALUES (
    org_id,
    'Vesta CFO Demo Hotel',
    '100 Harbor Walk',
    'San Diego',
    'CA',
    '92101',
    'US',
    120,
    4.2,
    'resort',
    'America/Los_Angeles',
    'USD',
    'mews',
    jsonb_build_object(
      'role', 'gm',
      'goals', jsonb_build_array('grow_revpar', 'control_labor'),
      'data_approach', 'mixed',
      'portfolio_size', 'single'
    )
  )
  RETURNING id INTO hotel_id;

  INSERT INTO public.hotel_members (hotel_id, user_id, role)
  VALUES (hotel_id, demo_user, 'owner')
  ON CONFLICT (hotel_id, user_id) DO NOTHING;

  -- ── Daily metrics (35 days: charts use last 30; dashboard compares today vs yesterday) ──
  INSERT INTO public.daily_metrics (
    hotel_id,
    date,
    rooms_available,
    rooms_sold,
    rooms_out_of_order,
    adr,
    revpar,
    room_revenue,
    fnb_revenue,
    spa_revenue,
    other_revenue,
    total_revenue,
    labor_cost,
    labor_cost_ratio,
    total_expenses,
    gop,
    goppar,
    gop_margin,
    data_source
  )
  SELECT
    hotel_id,
    d,
    120,
    LEAST(118, GREATEST(62, 74 + (abs(hashtext(d::text || 'vesta')) % 42)))::integer,
    CASE WHEN d = current_date - 3 THEN 4 ELSE 0 END,
    (172.0 + (abs(hashtext('adr' || d::text)) % 48))::numeric(10, 2),
    0::numeric(10, 2),
    0::numeric(12, 2),
    0::numeric(12, 2),
    0::numeric(12, 2),
    0::numeric(12, 2),
    0::numeric(12, 2),
    0::numeric(12, 2),
    0::numeric(5, 4),
    0::numeric(12, 2),
    0::numeric(12, 2),
    0::numeric(10, 2),
    0::numeric(5, 4),
    'manual'
  FROM generate_series((current_date - 34)::date, current_date::date, interval '1 day') AS d;

  UPDATE public.daily_metrics dm
  SET
    room_revenue = (dm.rooms_sold::numeric * dm.adr),
    fnb_revenue = round((dm.rooms_sold::numeric * dm.adr) * 0.21 + 900 + (abs(hashtext(dm.date::text || 'fnb')) % 600), 2),
    spa_revenue = round(1200 + (abs(hashtext(dm.date::text || 'spa')) % 1400), 2),
    other_revenue = round(450 + (abs(hashtext(dm.date::text || 'oth')) % 500), 2),
    total_revenue = round(
      (dm.rooms_sold::numeric * dm.adr)
      + ((dm.rooms_sold::numeric * dm.adr) * 0.21 + 900 + (abs(hashtext(dm.date::text || 'fnb')) % 600))
      + (1200 + (abs(hashtext(dm.date::text || 'spa')) % 1400))
      + (450 + (abs(hashtext(dm.date::text || 'oth')) % 500)),
      2
    )
  WHERE dm.hotel_id = hotel_id;

  UPDATE public.daily_metrics dm
  SET
    labor_cost = round(dm.total_revenue * 0.31 + (abs(hashtext(dm.date::text || 'lab')) % 800), 2),
    total_expenses = round(dm.total_revenue * 0.31 + (abs(hashtext(dm.date::text || 'lab')) % 800)
      + dm.total_revenue * 0.14 + 400, 2)
  WHERE dm.hotel_id = hotel_id;

  UPDATE public.daily_metrics dm
  SET
    revpar = round(dm.total_revenue / 120.0, 2),
    gop = round(dm.total_revenue - dm.total_expenses, 2),
    goppar = round((dm.total_revenue - dm.total_expenses) / 120.0, 2),
    labor_cost_ratio = CASE WHEN dm.total_revenue > 0 THEN round(dm.labor_cost / dm.total_revenue, 4) ELSE 0 END,
    gop_margin = CASE WHEN dm.total_revenue > 0 THEN round((dm.total_revenue - dm.total_expenses) / dm.total_revenue, 4) ELSE 0 END
  WHERE dm.hotel_id = hotel_id;

  -- ── Revenue by channel (stacked chart; net_revenue is generated) ──
  INSERT INTO public.revenue_by_channel (
    hotel_id, date, channel, revenue, bookings_count, room_nights, commission_amount, commission_rate
  )
  SELECT
    dm.hotel_id,
    dm.date,
    v.channel,
    round(dm.room_revenue * (v.pct / 100.0), 2),
    greatest(
      1,
      (round(dm.rooms_sold::numeric * (v.pct / 100.0) / 2.5))::integer
    ),
    greatest(0, (round(dm.rooms_sold::numeric * (v.pct / 100.0)))::integer),
    CASE
      WHEN v.channel IN ('booking_com', 'expedia') THEN round(dm.room_revenue * (v.pct / 100.0) * 0.16, 2)
      WHEN v.channel = 'airbnb' THEN round(dm.room_revenue * (v.pct / 100.0) * 0.14, 2)
      ELSE 0
    END,
    CASE
      WHEN v.channel IN ('booking_com', 'expedia') THEN 0.1600
      WHEN v.channel = 'airbnb' THEN 0.1400
      ELSE 0
    END
  FROM public.daily_metrics dm
  CROSS JOIN (
    VALUES
      ('direct', 32::numeric),
      ('booking_com', 28::numeric),
      ('expedia', 18::numeric),
      ('corporate', 12::numeric),
      ('airbnb', 6::numeric),
      ('other', 4::numeric)
  ) AS v(channel, pct)
  WHERE dm.hotel_id = hotel_id
    AND dm.date >= current_date - 34;

  -- ── Expenses (mix of categories for reports / integrations views) ──
  INSERT INTO public.expenses (hotel_id, date, category, subcategory, vendor, description, amount, is_recurring, source)
  VALUES
    (hotel_id, current_date - 2, 'labor', 'payroll', 'ADP', 'Bi-weekly payroll', 28500.00, true, 'manual'),
    (hotel_id, current_date - 5, 'utilities', 'electric', 'SDG&E', 'Electric — main meter', 6200.00, false, 'manual'),
    (hotel_id, current_date - 7, 'food_beverage', 'inventory', 'Sysco', 'F&B inventory delivery', 12400.00, false, 'manual'),
    (hotel_id, current_date - 9, 'marketing', 'digital', 'Meta Ads', 'Summer campaign', 2100.00, false, 'manual'),
    (hotel_id, current_date - 11, 'technology', 'saas', 'Cloudbeds add-on', 'Channel analytics module', 349.00, true, 'manual'),
    (hotel_id, current_date - 14, 'maintenance', 'hvac', 'Coastal HVAC', 'Lobby unit service', 1850.00, false, 'manual'),
    (hotel_id, current_date - 18, 'supplies', 'housekeeping', 'Grainger', 'Housekeeping cart restock', 780.00, false, 'manual'),
    (hotel_id, current_date - 21, 'distribution', 'ota', 'Booking.com', 'Commission invoice (period)', 9100.00, false, 'manual');

  -- ── Budget targets (current month — slightly different from actuals for variance UI) ──
  INSERT INTO public.budget_targets (
    hotel_id, year, month,
    target_occupancy, target_adr, target_revpar, target_revenue, target_gop, target_labor_ratio
  )
  VALUES (
    hotel_id,
    extract(year from current_date)::integer,
    extract(month from current_date)::integer,
    0.78,
    188.00,
    152.00,
    575000.00,
    198000.00,
    0.30
  )
  ON CONFLICT (hotel_id, year, month) DO UPDATE SET
    target_occupancy = excluded.target_occupancy,
    target_adr = excluded.target_adr,
    target_revpar = excluded.target_revpar,
    target_revenue = excluded.target_revenue,
    target_gop = excluded.target_gop,
    target_labor_ratio = excluded.target_labor_ratio,
    updated_at = now();

  -- ── AI daily briefing (today) ──
  INSERT INTO public.ai_summaries (
    hotel_id, date, period_type, headline, body, status, metrics_snapshot, model
  )
  VALUES (
    hotel_id,
    current_date,
    'daily',
    'Occupancy strong; watch labor vs. budget',
    'RevPAR is tracking ahead of last week with solid direct and corporate mix. '
    || 'Labor cost ratio is elevated on the weekend peak — consider flex scheduling for F&B. '
    || 'OTA commission spend is in line; test a direct-booking offer on corporate accounts.',
    'attention_needed',
    jsonb_build_object('source', 'seed', 'note', 'Replace via Generate briefing in the app'),
    'seed'
  )
  ON CONFLICT (hotel_id, date, period_type) DO UPDATE SET
    headline = excluded.headline,
    body = excluded.body,
    status = excluded.status,
    metrics_snapshot = excluded.metrics_snapshot,
    generated_at = now();

  -- ── Anomalies (schema: metric, title, description, severity info|warning|critical) ──
  INSERT INTO public.anomalies (
    hotel_id, date, metric, severity, title, description,
    current_value, expected_min, expected_max, resolved
  )
  VALUES
    (
      hotel_id, current_date, 'labor_cost_ratio', 'warning',
      'Labor cost ratio above trailing average',
      'Labor as a percent of revenue is higher than the prior 14-day average. Review scheduling and overtime.',
      0.34, 0.26, 0.31, false
    ),
    (
      hotel_id, current_date - 1, 'adr', 'info',
      'ADR dipped on a high-occupancy night',
      'Rate was discounted on a group block while occupancy was high — acceptable if negotiated, otherwise review BAR settings.',
      162.00, 175.00, 205.00, false
    ),
    (
      hotel_id, current_date - 2, 'total_revenue', 'critical',
      'Revenue shortfall vs. same weekday prior week',
      'Total revenue came in materially below the prior week''s same weekday. Validate channel pickup and any group wash.',
      42000.00, 48000.00, 58000.00, false
    ),
    (
      hotel_id, current_date - 10, 'occupancy_rate', 'info',
      'Resolved: brief occupancy dip',
      'One-off weather event; recovered within 48 hours.',
      0.58, 0.62, 0.88, true
    );

  UPDATE public.anomalies a
  SET resolved_at = now()
  WHERE a.hotel_id = hotel_id AND a.resolved = true AND a.resolved_at IS NULL;

  -- ── Recommendations ──
  INSERT INTO public.recommendations (
    hotel_id, category, title, description, estimated_savings_monthly, effort, status, partner_slug
  )
  VALUES
    (
      hotel_id, 'supplies',
      'Bundle sustainable F&B packaging',
      'Negotiate a single vendor program for takeout and banquet disposables to cut unit cost and freight.',
      1200.00, 'low', 'pending', 'the-lotus-group'
    ),
    (
      hotel_id, 'revenue',
      'Corporate direct rate parity check',
      'Audit corporate BAR vs. OTA after fees — small gaps often leak margin on high-volume accounts.',
      800.00, 'medium', 'in_progress', NULL
    );

  -- ── Integration + sync history (Integrations page) ──
  INSERT INTO public.integrations (hotel_id, type, provider, status, last_sync_at, settings)
  VALUES (
    hotel_id, 'pms', 'mews', 'active', now() - interval '2 hours',
    jsonb_build_object('demo', true, 'property_code', 'DEMO-WEST')
  )
  RETURNING id INTO integ_id;

  INSERT INTO public.sync_logs (integration_id, hotel_id, status, records_synced, records_failed, completed_at)
  VALUES
    (integ_id, hotel_id, 'success', 118, 0, now() - interval '2 hours'),
    (integ_id, hotel_id, 'partial', 95, 3, now() - interval '1 day'),
    (integ_id, hotel_id, 'success', 120, 0, now() - interval '2 days');

  -- ── In-app notifications ──
  INSERT INTO public.hotel_notifications (hotel_id, user_id, type, title, body, link)
  VALUES
    (
      hotel_id, demo_user, 'anomaly',
      'Revenue variance detected',
      'Open Anomalies to review the critical alert from the seed dataset.',
      '/anomalies'
    ),
    (
      hotel_id, demo_user, 'daily_briefing',
      'Daily briefing ready',
      'Your seeded summary is in the dashboard briefing card.',
      '/'
    );

  INSERT INTO public.notification_preferences (user_id, hotel_id, daily_briefing_email, anomaly_email, weekly_report_email)
  VALUES (demo_user, hotel_id, true, true, true)
  ON CONFLICT (user_id, hotel_id) DO UPDATE SET
    daily_briefing_email = true,
    anomaly_email = true,
    weekly_report_email = true,
    updated_at = now();

  -- ── Partner marketplace lead (if Lotus partner exists) ──
  SELECT p.id INTO partner_pk FROM public.partners p WHERE p.slug = 'the-lotus-group' LIMIT 1;
  IF partner_pk IS NOT NULL THEN
    INSERT INTO public.partner_leads (partner_id, hotel_id, user_id, source)
    VALUES (partner_pk, hotel_id, demo_user, 'marketplace');
  END IF;

  RAISE NOTICE 'vesta seed: demo hotel % for user %', hotel_id, demo_user;
END $$;
