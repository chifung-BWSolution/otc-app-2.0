-- The bubble_leave table may be missing columns because it existed before migration 20250129 ran
-- CREATE TABLE IF NOT EXISTS skipped creating it with the new schema
-- Adding ALL columns that the import function needs

ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS bubble_id TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS base44_id TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS staff_id TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS staff_name TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS leave_type TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS leave_type_id TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS leave_period TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS leave_period_code TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS quota NUMERIC;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS approved BOOLEAN;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS approver_id TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS approver_name TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS rejecter_id TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS rejecter_name TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS start_date_time TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS end_date_time TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS count_year TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS application_reason TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS prove_url TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS info_tech_url TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS interview_email BOOLEAN;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS send_email BOOLEAN;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS send_approval_email BOOLEAN;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS updated_date TIMESTAMPTZ DEFAULT NOW();
