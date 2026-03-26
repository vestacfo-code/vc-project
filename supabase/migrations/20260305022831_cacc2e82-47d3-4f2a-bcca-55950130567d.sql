
-- Reassign all pricing data from orphaned user to current active user
UPDATE pricing_products SET user_id = '7936a948-ef17-47df-996b-5ffada33af6f' WHERE user_id = 'd9a7e6c2-c706-4d54-a0b5-187e43d322e3';
UPDATE pricing_suppliers SET user_id = '7936a948-ef17-47df-996b-5ffada33af6f' WHERE user_id = 'd9a7e6c2-c706-4d54-a0b5-187e43d322e3';
UPDATE pricing_ai_recommendations SET user_id = '7936a948-ef17-47df-996b-5ffada33af6f' WHERE user_id = 'd9a7e6c2-c706-4d54-a0b5-187e43d322e3';
