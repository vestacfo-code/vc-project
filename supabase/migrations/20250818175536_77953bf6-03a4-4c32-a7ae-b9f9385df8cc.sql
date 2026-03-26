-- Remove the dangerous anonymous read access policy from profiles table
-- This policy allows anyone to read all user profiles including emails, names, and company data
DROP POLICY "Allow anonymous read access to public stats" ON public.profiles;

-- The get_public_stats() function will still work because it uses SECURITY DEFINER
-- which gives it elevated privileges to count records without exposing personal data