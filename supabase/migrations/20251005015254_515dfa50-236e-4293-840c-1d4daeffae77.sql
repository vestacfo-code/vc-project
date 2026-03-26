-- Backfill profiles for existing Google SSO users who don't have a profile yet
INSERT INTO public.profiles (
  user_id,
  email,
  full_name,
  avatar_url
)
SELECT 
  au.id,
  au.email,
  -- Try 'full_name' first (email/password), then 'name' (Google SSO), fallback to email
  COALESCE(
    au.raw_user_meta_data ->> 'full_name',
    au.raw_user_meta_data ->> 'name',
    au.email
  ) as full_name,
  -- Capture avatar from Google SSO (stored as 'avatar_url' or 'picture')
  COALESCE(
    au.raw_user_meta_data ->> 'avatar_url',
    au.raw_user_meta_data ->> 'picture'
  ) as avatar_url
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;