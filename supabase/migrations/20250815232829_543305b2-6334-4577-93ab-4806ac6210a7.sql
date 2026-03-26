-- Remove daily limits for paid plans (scale and ceo), keeping only monthly limits
UPDATE user_credits 
SET daily_limit = 999999 
WHERE tier IN ('scale', 'ceo');