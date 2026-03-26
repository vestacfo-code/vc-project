-- Remove the dangerous anonymous read access policy from documents table
-- This policy allows anyone to read all document metadata including file names, user IDs, and business information
DROP POLICY "Allow anonymous read access to documents count" ON public.documents;

-- The get_public_stats() function will still work because it uses SECURITY DEFINER
-- which gives it elevated privileges to count documents without exposing individual document metadata