-- Add hidden column to job_applications table to support hiding applications
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;