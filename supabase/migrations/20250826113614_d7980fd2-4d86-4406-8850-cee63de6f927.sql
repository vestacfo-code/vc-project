-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true);

-- Create storage policies for blog images
CREATE POLICY "Public can view blog images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

CREATE POLICY "Admin can upload blog images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'blog-images' AND (auth.jwt() ->> 'email') = 'support@joinfinlo.ai');

CREATE POLICY "Admin can update blog images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'blog-images' AND (auth.jwt() ->> 'email') = 'support@joinfinlo.ai');

CREATE POLICY "Admin can delete blog images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'blog-images' AND (auth.jwt() ->> 'email') = 'support@joinfinlo.ai');