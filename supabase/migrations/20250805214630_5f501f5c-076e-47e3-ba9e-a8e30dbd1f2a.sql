-- Add terms acceptance tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_version VARCHAR(10) DEFAULT '1.0';

-- Add terms acceptance log table for audit trail
CREATE TABLE IF NOT EXISTS terms_acceptance_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  terms_version VARCHAR(10) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on terms acceptance log
ALTER TABLE terms_acceptance_log ENABLE ROW LEVEL SECURITY;

-- Create policies for terms acceptance log
CREATE POLICY "Users can view their own terms acceptance log" 
ON terms_acceptance_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own terms acceptance" 
ON terms_acceptance_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);