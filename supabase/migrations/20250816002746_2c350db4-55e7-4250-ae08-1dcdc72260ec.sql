-- Check if RLS policies exist for documents table and create them if missing
DO $$
BEGIN
  -- Check if any RLS policies exist for documents table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class pc ON pol.polrelid = pc.oid
    WHERE pc.relname = 'documents'
  ) THEN
    -- Create RLS policies for documents table
    CREATE POLICY "Users can view their own documents" 
    ON public.documents 
    FOR SELECT 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own documents" 
    ON public.documents 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own documents" 
    ON public.documents 
    FOR UPDATE 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own documents" 
    ON public.documents 
    FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;
END $$;