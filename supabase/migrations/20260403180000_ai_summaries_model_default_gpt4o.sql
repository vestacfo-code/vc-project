-- Align default model label with generate-daily-summary (OpenAI gpt-4o).
ALTER TABLE public.ai_summaries
  ALTER COLUMN model SET DEFAULT 'gpt-4o';
