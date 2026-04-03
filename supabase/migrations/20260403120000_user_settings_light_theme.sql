-- Light-only product: normalize persisted theme and chat chrome preferences
UPDATE public.user_settings
SET theme = 'light'
WHERE lower(trim(theme)) IN ('dark', 'system');

UPDATE public.user_settings
SET chat_dark_mode = false
WHERE chat_dark_mode IS TRUE;

ALTER TABLE public.user_settings ALTER COLUMN theme SET DEFAULT 'light';
ALTER TABLE public.user_settings ALTER COLUMN chat_dark_mode SET DEFAULT false;
