-- Update existing profiles to pull names from user metadata
UPDATE profiles p
SET 
  full_name = COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    p.email
  ),
  avatar_url = COALESCE(
    p.avatar_url,
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  )
FROM auth.users au
WHERE p.user_id = au.id
  AND (p.full_name IS NULL OR p.full_name = '' OR p.full_name = p.email);