-- Add RLS policies for team members to access quickbooks_messages

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Team members can view messages" ON public.quickbooks_messages;
DROP POLICY IF EXISTS "Team members can create messages" ON public.quickbooks_messages;

-- Allow team members to view messages in shared conversations
CREATE POLICY "Team members can view messages"
ON public.quickbooks_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quickbooks_conversations c
    WHERE c.id = quickbooks_messages.conversation_id
    AND can_access_team_data(auth.uid(), c.user_id)
  )
);

-- Allow team members to create messages in shared conversations  
CREATE POLICY "Team members can create messages"
ON public.quickbooks_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quickbooks_conversations c
    WHERE c.id = conversation_id
    AND can_access_team_data(auth.uid(), c.user_id)
  )
);