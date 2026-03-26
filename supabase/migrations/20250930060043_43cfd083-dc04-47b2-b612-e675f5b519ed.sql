-- Add custom questions support to job roles
ALTER TABLE job_roles 
ADD COLUMN custom_questions JSONB DEFAULT '[]'::jsonb;

-- Add custom answers support to job applications  
ALTER TABLE job_applications
ADD COLUMN custom_answers JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN job_roles.custom_questions IS 'Array of custom question objects with id, type, label, required, placeholder, options fields';
COMMENT ON COLUMN job_applications.custom_answers IS 'Object mapping question IDs to applicant answers';