-- ============================================
-- TEAM DATA SHARING RLS POLICIES
-- ============================================

-- Helper function to get the team owner's user_id for a team member
CREATE OR REPLACE FUNCTION public.get_team_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.owner_id
  FROM public.team_members tm
  INNER JOIN public.teams t ON t.id = tm.team_id
  WHERE tm.user_id = _user_id
    AND tm.role != 'owner'
  LIMIT 1
$$;

-- Helper function to check if user can access data for a given data_owner_id
-- Returns true if user is the owner OR is a team member of that owner's team
CREATE OR REPLACE FUNCTION public.can_access_team_data(_user_id uuid, _data_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _user_id = _data_owner_id -- User is the data owner
    OR EXISTS (
      -- User is a member of a team owned by the data owner
      SELECT 1 
      FROM public.team_members tm
      INNER JOIN public.teams t ON t.id = tm.team_id
      WHERE tm.user_id = _user_id
        AND t.owner_id = _data_owner_id
        AND tm.role != 'owner'
    )
$$;

-- Helper function to get the effective user_id for data access
-- Returns team owner's ID if user is a member, otherwise returns user's own ID
CREATE OR REPLACE FUNCTION public.get_effective_user_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT t.owner_id
      FROM public.team_members tm
      INNER JOIN public.teams t ON t.id = tm.team_id
      WHERE tm.user_id = _user_id
        AND tm.role != 'owner'
      LIMIT 1
    ),
    _user_id
  )
$$;

-- Drop existing policies on quickbooks_integrations
DROP POLICY IF EXISTS "Users can manage their own QuickBooks integrations" ON public.quickbooks_integrations;
DROP POLICY IF EXISTS "Team members can view integrations" ON public.quickbooks_integrations;

-- New policies for quickbooks_integrations
CREATE POLICY "Users can manage their own QuickBooks integrations"
ON public.quickbooks_integrations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view integrations"
ON public.quickbooks_integrations
FOR SELECT
USING (public.can_access_team_data(auth.uid(), user_id));

-- Drop existing policies on quickbooks_data
DROP POLICY IF EXISTS "Users can manage their own QuickBooks data" ON public.quickbooks_data;
DROP POLICY IF EXISTS "Team members can view data" ON public.quickbooks_data;

-- New policies for quickbooks_data
CREATE POLICY "Users can manage their own QuickBooks data"
ON public.quickbooks_data
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view data"
ON public.quickbooks_data
FOR SELECT
USING (public.can_access_team_data(auth.uid(), user_id));

-- Drop existing policies on quickbooks_conversations
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.quickbooks_conversations;
DROP POLICY IF EXISTS "Team members can view conversations" ON public.quickbooks_conversations;

-- New policies for quickbooks_conversations  
CREATE POLICY "Users can manage their own conversations"
ON public.quickbooks_conversations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team members can view conversations"
ON public.quickbooks_conversations
FOR SELECT
USING (public.can_access_team_data(auth.uid(), user_id));

-- Drop existing policies on quickbooks_messages
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.quickbooks_messages;
DROP POLICY IF EXISTS "Team members can view messages" ON public.quickbooks_messages;

-- Messages policy (via conversation)
CREATE POLICY "Users can manage their own messages"
ON public.quickbooks_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.quickbooks_conversations qc
    WHERE qc.id = quickbooks_messages.conversation_id
    AND qc.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quickbooks_conversations qc
    WHERE qc.id = quickbooks_messages.conversation_id
    AND qc.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can view messages"
ON public.quickbooks_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quickbooks_conversations qc
    WHERE qc.id = quickbooks_messages.conversation_id
    AND public.can_access_team_data(auth.uid(), qc.user_id)
  )
);

-- Helper function to get user's team role
CREATE OR REPLACE FUNCTION public.get_team_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.teams t WHERE t.owner_id = _user_id
      ) THEN 'owner'
      ELSE (
        SELECT tm.role::text
        FROM public.team_members tm
        WHERE tm.user_id = _user_id
        LIMIT 1
      )
    END
$$;