-- Update RLS policy for quickbooks_data to work with edge functions
DROP POLICY IF EXISTS "Users can manage their own QB data" ON quickbooks_data;

-- Create new policy that works with both direct client access and edge functions
CREATE POLICY "Users can manage their own QB data" 
ON quickbooks_data 
FOR ALL 
USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Add a policy for insert operations specifically for edge functions
CREATE POLICY "Edge functions can insert QB data" 
ON quickbooks_data 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);