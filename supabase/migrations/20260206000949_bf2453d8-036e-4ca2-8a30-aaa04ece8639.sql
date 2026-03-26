-- ============================================
-- EXTENDED TEAM DATA SHARING RLS POLICIES
-- Documents, Business Profiles, Financial Data
-- ============================================

-- Drop existing policies on documents if they exist
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;
DROP POLICY IF EXISTS "Team members can view documents" ON public.documents;

-- Documents RLS - Full collaboration (view + create)
CREATE POLICY "Users can manage their own documents"
ON public.documents
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view documents"
ON public.documents
FOR SELECT
USING (public.can_access_team_data(auth.uid(), user_id));

CREATE POLICY "Team members can create documents"
ON public.documents
FOR INSERT
WITH CHECK (
  -- Allow if user is creating their own document
  auth.uid() = user_id
  OR
  -- Or if user_id belongs to team owner they're a member of
  public.can_access_team_data(auth.uid(), user_id)
);

-- Drop existing policies on business_profiles
DROP POLICY IF EXISTS "Users can manage their own business profiles" ON public.business_profiles;
DROP POLICY IF EXISTS "Team members can view business profiles" ON public.business_profiles;

-- Business Profiles RLS
CREATE POLICY "Users can manage their own business profiles"
ON public.business_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view business profiles"
ON public.business_profiles
FOR SELECT
USING (public.can_access_team_data(auth.uid(), user_id));

-- Drop existing policies on financial_snapshots
DROP POLICY IF EXISTS "Users can manage their own financial snapshots" ON public.financial_snapshots;
DROP POLICY IF EXISTS "Team members can view financial snapshots" ON public.financial_snapshots;

-- Financial Snapshots RLS
CREATE POLICY "Users can manage their own financial snapshots"
ON public.financial_snapshots
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view financial snapshots"
ON public.financial_snapshots
FOR SELECT
USING (public.can_access_team_data(auth.uid(), user_id));

-- Drop existing policies on financial_data
DROP POLICY IF EXISTS "Users can manage their own financial data" ON public.financial_data;
DROP POLICY IF EXISTS "Team members can view financial data" ON public.financial_data;

-- Financial Data RLS
CREATE POLICY "Users can manage their own financial data"
ON public.financial_data
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view financial data"
ON public.financial_data
FOR SELECT
USING (public.can_access_team_data(auth.uid(), user_id));

-- Drop existing policies on business_health_scores
DROP POLICY IF EXISTS "Users can manage their own health scores" ON public.business_health_scores;
DROP POLICY IF EXISTS "Team members can view health scores" ON public.business_health_scores;

-- Business Health Scores RLS
CREATE POLICY "Users can manage their own health scores"
ON public.business_health_scores
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view health scores"
ON public.business_health_scores
FOR SELECT
USING (public.can_access_team_data(auth.uid(), user_id));

-- Conversation documents - team members can attach docs to team conversations
DROP POLICY IF EXISTS "Team members can attach documents to conversations" ON public.conversation_documents;

CREATE POLICY "Team members can attach documents to conversations"
ON public.conversation_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quickbooks_conversations qc
    WHERE qc.id = conversation_documents.conversation_id
    AND public.can_access_team_data(auth.uid(), qc.user_id)
  )
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = conversation_documents.document_id
    AND public.can_access_team_data(auth.uid(), d.user_id)
  )
);

-- Allow team members to create conversations under owner's account
DROP POLICY IF EXISTS "Team members can create conversations" ON public.quickbooks_conversations;

CREATE POLICY "Team members can create conversations"
ON public.quickbooks_conversations
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR public.can_access_team_data(auth.uid(), user_id)
);

-- Allow team members to add messages to team conversations
DROP POLICY IF EXISTS "Team members can add messages" ON public.quickbooks_messages;

CREATE POLICY "Team members can add messages"
ON public.quickbooks_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quickbooks_conversations qc
    WHERE qc.id = quickbooks_messages.conversation_id
    AND public.can_access_team_data(auth.uid(), qc.user_id)
  )
);