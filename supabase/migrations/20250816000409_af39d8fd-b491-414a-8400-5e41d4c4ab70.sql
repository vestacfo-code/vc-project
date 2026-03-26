-- Fix credit balance for user with incorrect amount
UPDATE user_credits 
SET current_credits = monthly_limit - credits_used_this_month,
    updated_at = now()
WHERE user_id = '71e12259-8afc-48d6-b294-9289ffe1480c' 
AND current_credits > 10000; -- Safety check to only fix obviously wrong amounts