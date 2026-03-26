-- Create function to sync preboarding data to staff records
CREATE OR REPLACE FUNCTION sync_preboarding_data()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  app_id uuid;
  all_steps jsonb;
BEGIN
  -- Get the application_id from the welcome link
  SELECT wl.application_id INTO app_id
  FROM welcome_links wl
  WHERE wl.id = NEW.welcome_link_id;
  
  -- Get all preboarding steps for this welcome link
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
  WHERE ps.welcome_link_id = NEW.welcome_link_id;
  
  -- Update or insert staff record with preboarding data
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
    all_steps,
    'active',
    NOW(),
    NOW()
  FROM welcome_links wl
  WHERE wl.application_id = app_id
  ON CONFLICT (application_id) DO UPDATE SET
    preboarding_data = all_steps,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger for preboarding steps
DROP TRIGGER IF EXISTS sync_preboarding_data_trigger ON preboarding_steps;
CREATE TRIGGER sync_preboarding_data_trigger
AFTER INSERT OR UPDATE OR DELETE ON preboarding_steps
FOR EACH ROW
EXECUTE FUNCTION sync_preboarding_data();

-- Also update the existing sync_staff_record function to handle preboarding data
CREATE OR REPLACE FUNCTION sync_staff_record()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  existing_preboarding jsonb;
BEGIN
  -- Get existing preboarding data to preserve it
  SELECT preboarding_data INTO existing_preboarding
  FROM staff_records
  WHERE application_id = NEW.application_id;
  
  -- Insert or update staff record when welcome link is created/updated
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
    -- Preserve existing preboarding data
    preboarding_data = COALESCE(staff_records.preboarding_data, '{}'::jsonb),
    status = CASE WHEN NEW.deleted_at IS NOT NULL THEN 'deleted' ELSE 'active' END,
    updated_at = now();
  
  RETURN NEW;
END;
$$;