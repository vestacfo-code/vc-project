-- Add new fields to job_applications table
ALTER TABLE job_applications 
ADD COLUMN full_name TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT, 
ADD COLUMN country TEXT,
ADD COLUMN instagram_handle TEXT,
ADD COLUMN highest_degree TEXT,
ADD COLUMN institution TEXT,
ADD COLUMN graduation_year INTEGER,
ADD COLUMN work_authorization TEXT,
ADD COLUMN earliest_start_date DATE,
ADD COLUMN why_work_here TEXT,
ADD COLUMN references TEXT,
ADD COLUMN background_check_consent BOOLEAN DEFAULT false,
ADD COLUMN privacy_policy_consent BOOLEAN DEFAULT false;

-- Update existing applications to have consent as true (for existing data)
UPDATE job_applications 
SET background_check_consent = true, privacy_policy_consent = true 
WHERE background_check_consent IS NULL OR privacy_policy_consent IS NULL;