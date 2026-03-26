-- Create shared_conversations table
CREATE TABLE IF NOT EXISTS public.shared_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES quickbooks_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shared_conversations ENABLE ROW LEVEL SECURITY;

-- Users can create shares for their own conversations
CREATE POLICY "Users can create shares for own conversations"
  ON public.shared_conversations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM quickbooks_conversations qc
      WHERE qc.id = conversation_id AND qc.user_id = auth.uid()
    )
  );

-- Users can view their own shares
CREATE POLICY "Users can view their shares"
  ON public.shared_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone with the token can view the conversation (public access)
CREATE POLICY "Public can view with valid token"
  ON public.shared_conversations FOR SELECT
  USING (true);

-- Users can delete their own shares
CREATE POLICY "Users can delete their shares"
  ON public.shared_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_shared_conversations_token ON public.shared_conversations(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_conversations_conversation ON public.shared_conversations(conversation_id);