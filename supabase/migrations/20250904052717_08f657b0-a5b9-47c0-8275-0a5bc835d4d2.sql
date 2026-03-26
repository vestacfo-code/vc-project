-- First, let's sync any existing preboarding data that wasn't captured yet
DO $$
DECLARE
    welcome_record RECORD;
    steps_data jsonb;
BEGIN
    -- Loop through all welcome links and sync their preboarding data
    FOR welcome_record IN 
        SELECT DISTINCT wl.id as welcome_link_id, wl.application_id, wl.applicant_name
        FROM welcome_links wl
        WHERE EXISTS (
            SELECT 1 FROM preboarding_steps ps 
            WHERE ps.welcome_link_id = wl.id
        )
    LOOP
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
        ) INTO steps_data
        FROM preboarding_steps ps
        WHERE ps.welcome_link_id = welcome_record.welcome_link_id;
        
        -- Update or insert staff record with this preboarding data
        INSERT INTO staff_records (
            application_id,
            applicant_name,
            preboarding_data,
            status,
            created_at,
            updated_at
        ) VALUES (
            welcome_record.application_id,
            welcome_record.applicant_name,
            steps_data,
            'active',
            NOW(),
            NOW()
        )
        ON CONFLICT (application_id) DO UPDATE SET
            preboarding_data = CASE 
                WHEN staff_records.preboarding_data IS NULL OR staff_records.preboarding_data = '{}'::jsonb 
                THEN steps_data 
                ELSE staff_records.preboarding_data 
            END,
            updated_at = NOW();
            
        RAISE NOTICE 'Synced preboarding data for application_id: %, steps count: %', 
            welcome_record.application_id, 
            jsonb_array_length(steps_data);
    END LOOP;
END $$;

-- Update the sync function to handle DELETE operations properly
CREATE OR REPLACE FUNCTION sync_preboarding_data()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  app_id uuid;
  all_steps jsonb;
  target_welcome_link_id uuid;
BEGIN
  -- Determine which welcome link ID to use based on operation
  IF TG_OP = 'DELETE' THEN
    target_welcome_link_id := OLD.welcome_link_id;
  ELSE
    target_welcome_link_id := NEW.welcome_link_id;
  END IF;
  
  -- Get the application_id from the welcome link
  SELECT wl.application_id INTO app_id
  FROM welcome_links wl
  WHERE wl.id = target_welcome_link_id;
  
  -- If application_id not found, exit
  IF app_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
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
  WHERE ps.welcome_link_id = target_welcome_link_id;
  
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
$$;