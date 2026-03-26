-- Consumer Features table - tracks enabled custom features per user
CREATE TABLE public.consumer_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  enabled_by UUID REFERENCES auth.users(id),
  enabled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_key)
);

-- Custom Pricing table - stores manual pricing for custom solution users
CREATE TABLE public.custom_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fixed_amount NUMERIC DEFAULT 0,
  monthly_amount NUMERIC DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Consumer Invite Links table - for manual consumer creation with pre-configured settings
CREATE TABLE public.consumer_invite_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  slug TEXT NOT NULL UNIQUE,
  custom_pricing_id UUID REFERENCES public.custom_pricing(id),
  features JSONB DEFAULT '[]'::jsonb,
  custom_logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id)
);

-- Add columns to profiles table for custom solutions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS custom_logo_url TEXT,
ADD COLUMN IF NOT EXISTS is_custom_solution BOOLEAN DEFAULT false;

-- Enable RLS on all new tables
ALTER TABLE public.consumer_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_invite_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consumer_features
CREATE POLICY "Super admins can manage all consumer features"
ON public.consumer_features FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own features"
ON public.consumer_features FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for custom_pricing
CREATE POLICY "Super admins can manage all custom pricing"
ON public.custom_pricing FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own pricing"
ON public.custom_pricing FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for consumer_invite_links
CREATE POLICY "Super admins can manage invite links"
ON public.consumer_invite_links FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone can view active invite by slug"
ON public.consumer_invite_links FOR SELECT
USING (status = 'active' AND expires_at > now());

-- Create indexes for performance
CREATE INDEX idx_consumer_features_user_id ON public.consumer_features(user_id);
CREATE INDEX idx_consumer_features_feature_key ON public.consumer_features(feature_key);
CREATE INDEX idx_custom_pricing_user_id ON public.custom_pricing(user_id);
CREATE INDEX idx_consumer_invite_links_slug ON public.consumer_invite_links(slug);
CREATE INDEX idx_consumer_invite_links_email ON public.consumer_invite_links(email);

-- Add consumer_management permission type
DO $$
BEGIN
  -- Check if we need to add to admin_permission enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'consumer_management' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'admin_permission')
  ) THEN
    ALTER TYPE admin_permission ADD VALUE IF NOT EXISTS 'consumer_management';
  END IF;
END $$;