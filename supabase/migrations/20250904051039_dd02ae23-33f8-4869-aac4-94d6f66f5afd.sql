-- Add soft delete capability to welcome_links and store preboarding data
ALTER TABLE welcome_links ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone NULL;

-- Create a table to persist staff information even after welcome link deletion
CREATE TABLE IF NOT EXISTS staff_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL,
  applicant_name text NOT NULL,
  start_date date,
  supervisors jsonb DEFAULT '[]'::jsonb,
  preboarding_data jsonb DEFAULT '{}'::jsonb,
  welcome_link_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  deleted_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on staff_records
ALTER TABLE staff_records ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_records
CREATE POLICY "Admin can manage staff records" ON staff_records
FOR ALL USING (
  (auth.jwt() ->> 'email') = ANY(ARRAY['finlo.hq@gmail.com', 'founder@joinfinlo.ai']) 
  OR auth.role() = 'service_role'
);

-- Create trigger to update updated_at
CREATE TRIGGER update_staff_records_updated_at
BEFORE UPDATE ON staff_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to sync staff records when welcome links are created/updated
CREATE OR REPLACE FUNCTION sync_staff_record()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for welcome_links
CREATE TRIGGER sync_staff_record_trigger
AFTER INSERT OR UPDATE ON welcome_links
FOR EACH ROW
EXECUTE FUNCTION sync_staff_record();

-- Add unique constraint on application_id for staff_records
ALTER TABLE staff_records ADD CONSTRAINT staff_records_application_id_key UNIQUE (application_id);