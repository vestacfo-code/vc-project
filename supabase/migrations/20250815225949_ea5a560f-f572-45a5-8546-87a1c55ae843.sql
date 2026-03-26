-- Check if this specific user has a credits record and create one if missing
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
  '71e12259-8afc-48d6-b294-9289ffe1480c'::uuid as user_id,
  30 as current_credits,
  30 as monthly_limit,
  5 as daily_limit,
  'founder'::subscription_tier_type as tier,
  5 as max_monthly_downloads,
  0 as max_collaborators,
  0 as credits_used_this_month,
  0 as credits_used_today
WHERE NOT EXISTS (
  SELECT 1 FROM user_credits 
  WHERE user_id = '71e12259-8afc-48d6-b294-9289ffe1480c'::uuid
);