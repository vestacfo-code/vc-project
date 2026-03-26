-- Create social media posts table
CREATE TABLE public.social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_date TIMESTAMPTZ,
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  engagement_metrics JSONB DEFAULT '{}'::JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all social media posts"
  ON public.social_media_posts
  FOR ALL
  USING (has_permission(auth.uid(), 'content_calendar_management'::admin_permission));

-- Create storage bucket for social media assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media-assets', 'social-media-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can upload social media assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'social-media-assets' AND
    has_permission(auth.uid(), 'content_calendar_management'::admin_permission)
  );

CREATE POLICY "Admins can view social media assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'social-media-assets');

CREATE POLICY "Admins can update social media assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'social-media-assets' AND
    has_permission(auth.uid(), 'content_calendar_management'::admin_permission)
  );

CREATE POLICY "Admins can delete social media assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'social-media-assets' AND
    has_permission(auth.uid(), 'content_calendar_management'::admin_permission)
  );

-- Trigger for updated_at
CREATE TRIGGER update_social_media_posts_updated_at
  BEFORE UPDATE ON public.social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_social_media_posts_scheduled_date ON public.social_media_posts(scheduled_date);
CREATE INDEX idx_social_media_posts_status ON public.social_media_posts(status);
CREATE INDEX idx_social_media_posts_author_id ON public.social_media_posts(author_id);