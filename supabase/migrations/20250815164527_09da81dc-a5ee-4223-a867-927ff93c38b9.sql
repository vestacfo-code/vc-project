-- Enhanced security for job_applications: Add rate limiting and abuse prevention
-- while maintaining necessary functionality for legitimate job applications

-- First, let's add a table to track submission attempts for rate limiting
CREATE TABLE IF NOT EXISTS public.job_application_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  email TEXT NOT NULL,
  submission_count INTEGER NOT NULL DEFAULT 1,
  last_submission TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rate limiting table
ALTER TABLE public.job_application_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limiting data
CREATE POLICY "rate_limits_service_only" 
ON public.job_application_rate_limits 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Add additional security columns to job_applications for audit trail
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS submission_source TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS verified_email BOOLEAN DEFAULT false;

-- Create a security function to validate submissions
CREATE OR REPLACE FUNCTION public.validate_job_application_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Block submissions with suspicious patterns
  IF char_length(NEW.full_name) < 2 OR NEW.full_name ~ '[0-9@#$%^&*()]+' THEN
    RAISE EXCEPTION 'Invalid name format detected';
  END IF;
  
  -- Validate email format more strictly
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Block obvious spam patterns in why_work_here
  IF NEW.why_work_here IS NOT NULL AND (
    char_length(NEW.why_work_here) < 20 OR
    NEW.why_work_here ~ '(http://|https://|www\.|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b)'
  ) THEN
    RAISE EXCEPTION 'Invalid application content detected';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_job_application ON public.job_applications;
CREATE TRIGGER validate_job_application
  BEFORE INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_job_application_submission();

-- Update the RLS policies to be more restrictive while maintaining functionality
-- Drop existing insert policies
DROP POLICY IF EXISTS "job_applications_anonymous_insert" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_authenticated_insert" ON public.job_applications;

-- Create new, more secure insert policy for anonymous users
CREATE POLICY "job_applications_secure_anonymous_insert" 
ON public.job_applications 
FOR INSERT 
TO anon
WITH CHECK (
  -- Must have required fields filled
  email IS NOT NULL AND
  first_name IS NOT NULL AND 
  last_name IS NOT NULL AND
  job_role_id IS NOT NULL AND
  privacy_policy_consent = true AND
  -- Basic format validation
  char_length(trim(first_name)) >= 2 AND
  char_length(trim(last_name)) >= 2 AND
  email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Create secure insert policy for authenticated users
CREATE POLICY "job_applications_secure_authenticated_insert" 
ON public.job_applications 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Same validations as anonymous
  email IS NOT NULL AND
  first_name IS NOT NULL AND 
  last_name IS NOT NULL AND
  job_role_id IS NOT NULL AND
  privacy_policy_consent = true AND
  char_length(trim(first_name)) >= 2 AND
  char_length(trim(last_name)) >= 2 AND
  email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);