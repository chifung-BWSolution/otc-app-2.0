-- The bubble_leave table is missing the leave_period_code column
-- This may have happened if the table existed before migration 20250129 ran
-- (CREATE TABLE IF NOT EXISTS would skip creating it with the new schema)

ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS leave_period_code TEXT;
