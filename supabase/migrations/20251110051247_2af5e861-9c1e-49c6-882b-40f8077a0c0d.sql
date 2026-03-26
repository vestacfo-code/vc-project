-- Add section tracking columns to training_assignments
ALTER TABLE training_assignments
ADD COLUMN IF NOT EXISTS current_section_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_sections INTEGER[] DEFAULT '{}';

COMMENT ON COLUMN training_assignments.current_section_index IS 'Index of the current section the user is viewing';
COMMENT ON COLUMN training_assignments.completed_sections IS 'Array of section indices that have been completed';