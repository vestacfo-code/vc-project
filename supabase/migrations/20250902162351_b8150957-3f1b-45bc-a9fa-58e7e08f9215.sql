-- Allow public access to job applications that are linked to active welcome links
CREATE POLICY "Public can view job applications linked to active welcome links" 
ON public.job_applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.welcome_links 
    WHERE welcome_links.application_id = job_applications.id 
    AND welcome_links.status = 'active'
  )
);