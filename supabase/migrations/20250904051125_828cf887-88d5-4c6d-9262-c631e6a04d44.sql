-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION sync_staff_record()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insert or update staff record when welcome link is created/updated
  INSERT INTO staff_records (
    application_id,
    applicant_name, 
    start_date,
    supervisors,
    welcome_link_data,
    status
  ) VALUES (
    NEW.application_id,
    NEW.applicant_name,
    NEW.start_date, 
    NEW.supervisors,
    row_to_json(NEW),
    CASE WHEN NEW.deleted_at IS NOT NULL THEN 'deleted' ELSE 'active' END
  )
  ON CONFLICT (application_id) DO UPDATE SET
    applicant_name = NEW.applicant_name,
    start_date = NEW.start_date,
    supervisors = NEW.supervisors, 
    welcome_link_data = row_to_json(NEW),
    status = CASE WHEN NEW.deleted_at IS NOT NULL THEN 'deleted' ELSE 'active' END,
    updated_at = now();
  
  RETURN NEW;
END;
$$;