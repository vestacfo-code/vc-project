-- Remove the is_hidden column from job_applications table
ALTER TABLE public.job_applications 
DROP COLUMN IF EXISTS is_hidden;