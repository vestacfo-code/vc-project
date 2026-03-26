-- Initialize user credits for users who don't have them yet
INSERT INTO user_credits (
  user_id, 
  current_credits, 
  monthly_limit, 
  daily_limit,
  tier, 
  max_monthly_downloads, 
  max_collaborators,
  credits_used_this_month, 
  credits_used_today
)
SELECT 
  u.id as user_id,
  30 as current_credits,
  30 as monthly_limit,
  5 as daily_limit,
  'founder'::subscription_tier_type as tier,
  5 as max_monthly_downloads,
  0 as max_collaborators,
  0 as credits_used_this_month,
  0 as credits_used_today
FROM auth.users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
WHERE uc.user_id IS NULL;