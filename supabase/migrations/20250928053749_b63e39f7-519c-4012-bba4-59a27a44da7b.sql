-- Clean up old QuickBooks integrations, keep only the most recent one per user
UPDATE quickbooks_integrations 
SET is_active = false 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM quickbooks_integrations 
  ORDER BY user_id, created_at DESC
);