-- Set chat_dark_mode default to true for the column and update all existing users
ALTER TABLE public.user_settings ALTER COLUMN chat_dark_mode SET DEFAULT true;

-- Update existing users who have it set to false or null
UPDATE public.user_settings SET chat_dark_mode = true WHERE chat_dark_mode IS NULL OR chat_dark_mode = false;