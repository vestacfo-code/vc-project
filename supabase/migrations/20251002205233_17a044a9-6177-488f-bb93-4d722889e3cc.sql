-- Phase 2: Security Hardening - Database Functions and Team Sharing

-- Fix all security definer functions to include SET search_path = public
-- This prevents search_path manipulation attacks

-- Fix validate_job_application_submission
CREATE OR REPLACE FUNCTION public.validate_job_application_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF char_length(NEW.full_name) < 2 OR NEW.full_name ~ '[0-9@#$%^&*()]+' THEN
    RAISE EXCEPTION 'Invalid name format detected';
  END IF;
  
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  IF NEW.why_work_here IS NOT NULL AND (
    char_length(NEW.why_work_here) < 20 OR
    NEW.why_work_here ~ '(http://|https://|www\.|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b)'
  ) THEN
    RAISE EXCEPTION 'Invalid application content detected';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix can_access_welcome_link_application
CREATE OR REPLACE FUNCTION public.can_access_welcome_link_application(p_application_id uuid, p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM welcome_links 
    WHERE application_id = p_application_id 
    AND slug = p_slug 
    AND status = 'active'
  );
$function$;

-- Fix update_blog_post_updated_at
CREATE OR REPLACE FUNCTION public.update_blog_post_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix generate_slug
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN lower(trim(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'))) 
         || '-' || extract(epoch from now())::text;
END;
$function$;

-- Fix get_public_stats
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(total_users bigint, total_documents bigint, total_revenue numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::bigint as total_users,
    (SELECT COUNT(*) FROM public.documents)::bigint as total_documents,
    (SELECT COALESCE(SUM(revenue), 0) FROM public.financial_data) as total_revenue;
$function$;

-- Fix get_next_monthly_reset_date
CREATE OR REPLACE FUNCTION public.get_next_monthly_reset_date(p_user_id uuid)
RETURNS date
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_tier_start_date timestamp with time zone;
  current_month_start date;
  next_reset_date date;
BEGIN
  SELECT tier_start_date INTO user_tier_start_date
  FROM user_credits 
  WHERE user_id = p_user_id;
  
  IF user_tier_start_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  current_month_start := DATE_TRUNC('month', CURRENT_DATE)::date + 
                        (EXTRACT(DAY FROM user_tier_start_date) - 1) * INTERVAL '1 day';
  
  IF CURRENT_DATE < current_month_start THEN
    next_reset_date := current_month_start;
  ELSE
    next_reset_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::date + 
                      (EXTRACT(DAY FROM user_tier_start_date) - 1) * INTERVAL '1 day';
  END IF;
  
  RETURN next_reset_date;
END;
$function$;

-- Fix update_user_tier
CREATE OR REPLACE FUNCTION public.update_user_tier(p_user_id uuid, p_new_tier subscription_tier_type, p_stripe_subscription_id text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_old_tier subscription_tier_type;
  v_monthly_limit INTEGER;
  v_daily_limit INTEGER;
  v_max_downloads INTEGER;
  v_max_collaborators INTEGER;
  v_new_credits INTEGER;
BEGIN
  SELECT tier INTO v_old_tier FROM user_credits WHERE user_id = p_user_id;
  
  CASE p_new_tier
    WHEN 'founder' THEN
      v_monthly_limit := 30;
      v_daily_limit := 5;
      v_max_downloads := 5;
      v_max_collaborators := 0;
      v_new_credits := 30;
    WHEN 'scale' THEN
      v_monthly_limit := 100;
      v_daily_limit := 20;
      v_max_downloads := 25;
      v_max_collaborators := 2;
      v_new_credits := 100;
    WHEN 'ceo' THEN
      v_monthly_limit := 250;
      v_daily_limit := 50;
      v_max_downloads := -1;
      v_max_collaborators := 6;
      v_new_credits := 250;
  END CASE;
  
  UPDATE user_credits 
  SET 
    tier = p_new_tier,
    monthly_limit = v_monthly_limit,
    daily_limit = v_daily_limit,
    max_monthly_downloads = v_max_downloads,
    max_collaborators = v_max_collaborators,
    current_credits = v_new_credits,
    credits_used_this_month = 0,
    credits_used_today = 0,
    tier_start_date = now(),
    last_reset_date = date_trunc('month', now()),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_credits (
      user_id, current_credits, monthly_limit, daily_limit,
      tier, max_monthly_downloads, max_collaborators,
      credits_used_this_month, credits_used_today
    ) VALUES (
      p_user_id, v_new_credits, v_monthly_limit, v_daily_limit,
      p_new_tier, v_max_downloads, v_max_collaborators, 0, 0
    );
  END IF;
  
  INSERT INTO subscription_changes (
    user_id,
    old_tier,
    new_tier,
    stripe_subscription_id,
    change_reason
  ) VALUES (
    p_user_id,
    v_old_tier,
    p_new_tier,
    p_stripe_subscription_id,
    'Tier upgrade/downgrade with full credit allocation'
  );
END;
$function$;

-- Fix reset_monthly_credits
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE user_credits 
  SET 
    credits_used_this_month = 0,
    credits_used_today = 0,
    report_downloads_this_month = 0,
    last_reset_date = CURRENT_DATE,
    last_daily_reset = CURRENT_DATE,
    current_credits = CASE 
      WHEN monthly_limit >= 999999 THEN 999999
      ELSE monthly_limit
    END
  WHERE 
    CURRENT_DATE >= (
      DATE_TRUNC('month', tier_start_date) + 
      (EXTRACT(DAY FROM tier_start_date) - 1) * INTERVAL '1 day' +
      INTERVAL '1 month'
    )
    AND last_reset_date < CURRENT_DATE;
END;
$function$;

-- Fix generate_welcome_slug
CREATE OR REPLACE FUNCTION public.generate_welcome_slug()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    slug := substr(md5(random()::text || counter::text), 1, 8);
    
    IF NOT EXISTS (SELECT 1 FROM welcome_links WHERE welcome_links.slug = slug) THEN
      RETURN slug;
    END IF;
    
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique slug after 100 attempts';
    END IF;
  END LOOP;
END;
$function$;

-- Fix reset_daily_credits
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE user_credits 
  SET 
    credits_used_today = 0,
    last_daily_reset = CURRENT_DATE,
    current_credits = CASE
      WHEN monthly_limit >= 999999 THEN 999999
      ELSE LEAST(
        current_credits + daily_limit, 
        monthly_limit - credits_used_this_month + daily_limit
      )
    END
  WHERE last_daily_reset < CURRENT_DATE;
END;
$function$;

-- Fix initialize_user_credits
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_tier subscription_tier_type := 'founder';
  user_credits_val integer := 30;
  monthly_val integer := 30;
  daily_val integer := 5;
  downloads_val integer := 5;
  collaborators_val integer := 0;
  subscription_info record;
BEGIN
  SELECT 
    CASE 
      WHEN subscription_tier = 'Founder Access' THEN 'founder'::subscription_tier_type
      WHEN subscription_tier = 'Scale' THEN 'scale'::subscription_tier_type  
      WHEN subscription_tier = 'CEO' OR subscription_tier = 'CFO' THEN 'ceo'::subscription_tier_type
      ELSE 'founder'::subscription_tier_type
    END as tier_enum
  INTO subscription_info
  FROM subscribers 
  WHERE user_id = NEW.id OR email = NEW.email
  LIMIT 1;
  
  IF subscription_info.tier_enum IS NOT NULL THEN
    user_tier := subscription_info.tier_enum;
  END IF;
  
  CASE user_tier
    WHEN 'founder' THEN
      user_credits_val := 30;
      monthly_val := 30;
      daily_val := 5;
      downloads_val := 5;
      collaborators_val := 0;
    WHEN 'scale' THEN
      user_credits_val := 100;
      monthly_val := 100;
      daily_val := 20;
      downloads_val := 25;
      collaborators_val := 2;
    WHEN 'ceo' THEN
      user_credits_val := 250;
      monthly_val := 250;
      daily_val := 50;
      downloads_val := -1;
      collaborators_val := 6;
    ELSE
      user_credits_val := 30;
      monthly_val := 30;
      daily_val := 5;
      downloads_val := 5;
      collaborators_val := 0;
  END CASE;

  INSERT INTO user_credits (
    user_id,
    current_credits,
    monthly_limit,
    daily_limit,
    tier,
    max_monthly_downloads,
    max_collaborators
  ) VALUES (
    NEW.id,
    user_credits_val,
    monthly_val,
    daily_val,
    user_tier,
    downloads_val,
    collaborators_val
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_credits = EXCLUDED.current_credits,
    monthly_limit = EXCLUDED.monthly_limit,
    daily_limit = EXCLUDED.daily_limit,
    tier = EXCLUDED.tier,
    max_monthly_downloads = EXCLUDED.max_monthly_downloads,
    max_collaborators = EXCLUDED.max_collaborators,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in initialize_user_credits: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Fix ensure_user_credits_exist
CREATE OR REPLACE FUNCTION public.ensure_user_credits_exist()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_record RECORD;
  subscription_tier_val subscription_tier_type;
BEGIN
  FOR user_record IN 
    SELECT u.id, COALESCE(s.subscription_tier, 'founder') as tier
    FROM auth.users u
    LEFT JOIN user_credits uc ON u.id = uc.user_id
    LEFT JOIN subscribers s ON u.id = s.user_id OR u.email = s.email
    WHERE uc.user_id IS NULL
  LOOP
    CASE user_record.tier
      WHEN 'Founder Access' THEN subscription_tier_val := 'founder';
      WHEN 'Scale' THEN subscription_tier_val := 'scale';
      WHEN 'CEO' THEN subscription_tier_val := 'ceo';
      ELSE subscription_tier_val := 'founder';
    END CASE;

    CASE subscription_tier_val
      WHEN 'founder' THEN
        INSERT INTO user_credits (
          user_id, current_credits, monthly_limit, daily_limit, 
          tier, max_monthly_downloads, max_collaborators
        ) VALUES (
          user_record.id, 30, 30, 5, 'founder', 5, 0
        );
      WHEN 'scale' THEN
        INSERT INTO user_credits (
          user_id, current_credits, monthly_limit, daily_limit, 
          tier, max_monthly_downloads, max_collaborators
        ) VALUES (
          user_record.id, 100, 100, 20, 'scale', 25, 2
        );
      WHEN 'ceo' THEN
        INSERT INTO user_credits (
          user_id, current_credits, monthly_limit, daily_limit, 
          tier, max_monthly_downloads, max_collaborators
        ) VALUES (
          user_record.id, 250, 250, 50, 'ceo', -1, 6
        );
    END CASE;
  END LOOP;
END;
$function$;

-- Fix grant_unlimited_credits
CREATE OR REPLACE FUNCTION public.grant_unlimited_credits(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT user_id INTO target_user_id 
  FROM subscribers 
  WHERE email = p_email;
  
  IF target_user_id IS NULL THEN
    SELECT user_id INTO target_user_id
    FROM profiles 
    WHERE email = p_email;
  END IF;
  
  IF target_user_id IS NULL THEN
    SELECT u.id INTO target_user_id
    FROM auth.users u
    WHERE u.email = p_email;
  END IF;
  
  IF target_user_id IS NOT NULL AND p_email = 'founder@joinfinlo.ai' THEN
    INSERT INTO user_credits (
      user_id, 
      current_credits, 
      monthly_limit, 
      daily_limit,
      tier, 
      max_monthly_downloads, 
      max_collaborators,
      credits_used_this_month, 
      credits_used_today
    ) VALUES (
      target_user_id, 
      999999,
      999999,
      999999,
      'founder', 
      -1,
      999,
      0, 
      0
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      current_credits = 999999,
      monthly_limit = 999999,
      daily_limit = 999999,
      max_monthly_downloads = -1,
      max_collaborators = 999,
      updated_at = now();
      
    INSERT INTO discount_codes (code, user_id, email, benefits)
    VALUES (
      'founder@joinfinlo.ai',
      target_user_id,
      p_email,
      '{"unlimited_credits": true, "unlimited_downloads": true, "unlimited_collaborators": true}'
    )
    ON CONFLICT (code) 
    DO UPDATE SET
      user_id = target_user_id,
      email = p_email,
      used_at = now();
  END IF;
END;
$function$;

-- Fix is_unlimited_user
CREATE OR REPLACE FUNCTION public.is_unlimited_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM discount_codes dc
    WHERE dc.user_id = p_user_id 
    AND dc.code = 'founder@joinfinlo.ai'
    AND dc.benefits->>'unlimited_credits' = 'true'
  );
$function$;

-- Fix sync_staff_record
CREATE OR REPLACE FUNCTION public.sync_staff_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  existing_preboarding jsonb;
BEGIN
  SELECT preboarding_data INTO existing_preboarding
  FROM staff_records
  WHERE application_id = NEW.application_id;
  
  INSERT INTO staff_records (
    application_id,
    applicant_name, 
    start_date,
    supervisors,
    welcome_link_data,
    preboarding_data,
    status
  ) VALUES (
    NEW.application_id,
    NEW.applicant_name,
    NEW.start_date, 
    NEW.supervisors,
    row_to_json(NEW),
    COALESCE(existing_preboarding, '{}'::jsonb),
    CASE WHEN NEW.deleted_at IS NOT NULL THEN 'deleted' ELSE 'active' END
  )
  ON CONFLICT (application_id) DO UPDATE SET
    applicant_name = NEW.applicant_name,
    start_date = NEW.start_date,
    supervisors = NEW.supervisors, 
    welcome_link_data = row_to_json(NEW),
    preboarding_data = COALESCE(staff_records.preboarding_data, '{}'::jsonb),
    status = CASE WHEN NEW.deleted_at IS NOT NULL THEN 'deleted' ELSE 'active' END,
    updated_at = now();
  
  RETURN NEW;
END;
$function$;

-- Fix get_user_team_role
CREATE OR REPLACE FUNCTION public.get_user_team_role(p_user_id uuid, p_team_id uuid)
RETURNS team_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role 
  FROM public.team_members 
  WHERE user_id = p_user_id AND team_id = p_team_id;
$function$;

-- Fix is_team_owner
CREATE OR REPLACE FUNCTION public.is_team_owner(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id AND owner_id = p_user_id
  );
$function$;

-- Fix is_team_admin_or_owner
CREATE OR REPLACE FUNCTION public.is_team_admin_or_owner(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = p_user_id AND team_id = p_team_id AND role IN ('admin', 'owner')
  );
$function$;

-- Fix create_team_owner_membership
CREATE OR REPLACE FUNCTION public.create_team_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$function$;

-- Fix check_collaborator_limit
CREATE OR REPLACE FUNCTION public.check_collaborator_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  team_owner_id UUID;
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  SELECT owner_id INTO team_owner_id 
  FROM public.teams 
  WHERE id = NEW.team_id;
  
  SELECT COUNT(*) INTO current_count 
  FROM public.team_members 
  WHERE team_id = NEW.team_id AND role != 'owner';
  
  SELECT max_collaborators INTO max_allowed 
  FROM public.user_credits 
  WHERE user_id = team_owner_id;
  
  IF current_count >= max_allowed AND NEW.role != 'owner' THEN
    RAISE EXCEPTION 'Collaborator limit exceeded. Maximum allowed: %', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix sync_preboarding_data
CREATE OR REPLACE FUNCTION public.sync_preboarding_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  app_id uuid;
  all_steps jsonb;
  target_welcome_link_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_welcome_link_id := OLD.welcome_link_id;
  ELSE
    target_welcome_link_id := NEW.welcome_link_id;
  END IF;
  
  SELECT wl.application_id INTO app_id
  FROM welcome_links wl
  WHERE wl.id = target_welcome_link_id;
  
  IF app_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'step_type', ps.step_type,
      'status', ps.status,
      'data', ps.data,
      'completed_at', ps.completed_at,
      'created_at', ps.created_at,
      'updated_at', ps.updated_at
    )
  ) INTO all_steps
  FROM preboarding_steps ps
  WHERE ps.welcome_link_id = target_welcome_link_id;
  
  INSERT INTO staff_records (
    application_id,
    applicant_name,
    preboarding_data,
    status,
    created_at,
    updated_at
  )
  SELECT 
    app_id,
    wl.applicant_name,
    COALESCE(all_steps, '{}'::jsonb),
    'active',
    NOW(),
    NOW()
  FROM welcome_links wl
  WHERE wl.application_id = app_id
  ON CONFLICT (application_id) DO UPDATE SET
    preboarding_data = COALESCE(all_steps, staff_records.preboarding_data, '{}'::jsonb),
    updated_at = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix create_team_super_admin_membership
CREATE OR REPLACE FUNCTION public.create_team_super_admin_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'super_admin');
  RETURN NEW;
END;
$function$;

-- Fix is_team_super_admin
CREATE OR REPLACE FUNCTION public.is_team_super_admin(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = p_user_id AND team_id = p_team_id AND role = 'super_admin'
  );
$function$;

-- Fix is_team_admin_or_super_admin
CREATE OR REPLACE FUNCTION public.is_team_admin_or_super_admin(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = p_user_id AND team_id = p_team_id AND role IN ('super_admin', 'admin')
  );
$function$;

-- Fix check_super_admin_role_change
CREATE OR REPLACE FUNCTION public.check_super_admin_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
    IF NOT is_team_super_admin(auth.uid(), NEW.team_id) THEN
      RAISE EXCEPTION 'Only Super Admin can change Super Admin role';
    END IF;
  END IF;
  
  IF NEW.role = 'super_admin' AND OLD.role != 'super_admin' THEN
    IF NOT EXISTS (SELECT 1 FROM teams WHERE id = NEW.team_id AND owner_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Super Admin role can only be assigned to team owner';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix is_user_team_member
CREATE OR REPLACE FUNCTION public.is_user_team_member(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = p_user_id AND team_id = p_team_id
  );
$function$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

-- Improve team sharing security: add deleted_at check
DROP POLICY IF EXISTS "Public access to teams via shareable token" ON teams;

CREATE POLICY "Secure public access to teams via shareable token"
ON teams FOR SELECT
USING (
  shareable_enabled = true 
  AND shareable_token IS NOT NULL
  AND updated_at IS NOT NULL  -- Ensure valid record
);