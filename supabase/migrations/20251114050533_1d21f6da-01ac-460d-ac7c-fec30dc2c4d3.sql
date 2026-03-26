-- Add 'training' permission to the admin_permission enum
-- This separates viewing training from managing training

ALTER TYPE admin_permission ADD VALUE IF NOT EXISTS 'training';