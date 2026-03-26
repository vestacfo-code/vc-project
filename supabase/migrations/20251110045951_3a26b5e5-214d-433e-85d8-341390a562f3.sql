-- Make training-materials bucket public so cover images display
UPDATE storage.buckets 
SET public = true 
WHERE id = 'training-materials';