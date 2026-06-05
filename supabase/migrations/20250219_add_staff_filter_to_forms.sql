ALTER TABLE registration_forms ADD COLUMN IF NOT EXISTS staff_filter_teams JSONB DEFAULT '[]'::jsonb;
