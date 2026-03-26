-- Remove education-related columns from job_applications table
ALTER TABLE public.job_applications 
DROP COLUMN IF EXISTS highest_degree,
DROP COLUMN IF EXISTS institution,
DROP COLUMN IF EXISTS graduation_year;