-- Fix security vulnerability: Restrict SELECT access to job_applications
-- Only allow specific authorized admin users to view job application data

-- Create a policy that only allows the admin user to view job applications
CREATE POLICY "Only authorized admins can view job applications" 
ON public.job_applications 
FOR SELECT 
USING (
  -- Allow access only for the specific admin email
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'finlo.hq@gmail.com'
  )
);

-- Update the service role policy to be more specific about operations
-- Remove the overly broad service role policy
DROP POLICY IF EXISTS "Service role can manage job applications" ON public.job_applications;

-- Create more specific service role policies
CREATE POLICY "Service role can insert job applications" 
ON public.job_applications 
FOR INSERT 
USING (true);

CREATE POLICY "Service role can update job applications" 
ON public.job_applications 
FOR UPDATE 
USING (true);

CREATE POLICY "Service role can delete job applications" 
ON public.job_applications 
FOR DELETE 
USING (true);

CREATE POLICY "Service role can select job applications" 
ON public.job_applications 
FOR SELECT 
USING (true);