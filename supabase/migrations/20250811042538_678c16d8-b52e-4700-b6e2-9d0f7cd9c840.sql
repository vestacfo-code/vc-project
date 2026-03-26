-- Storage RLS policies for user-specific documents in 'user-documents' bucket
-- Allow users to manage files under a second-level folder matching their auth.uid(), e.g. valuations/{uid}/...

-- SELECT policy: users can read metadata and generate signed URLs for their own files
CREATE POLICY "Users can read their own files (user-documents)"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-documents'
  AND coalesce((storage.foldername(name))[2], '') = auth.uid()::text
);

-- INSERT policy: users can upload files only into their own second-level folder
CREATE POLICY "Users can upload to their own folder (user-documents)"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents'
  AND coalesce((storage.foldername(name))[2], '') = auth.uid()::text
);

-- UPDATE policy: users can update files only in their own folder
CREATE POLICY "Users can update their own files (user-documents)"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-documents'
  AND coalesce((storage.foldername(name))[2], '') = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-documents'
  AND coalesce((storage.foldername(name))[2], '') = auth.uid()::text
);

-- DELETE policy: users can delete files only in their own folder
CREATE POLICY "Users can delete their own files (user-documents)"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-documents'
  AND coalesce((storage.foldername(name))[2], '') = auth.uid()::text
);
