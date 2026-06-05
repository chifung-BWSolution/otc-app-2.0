ALTER TABLE notification ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS recipient_staff_id TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS ref_id TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS ref_name TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS days_remaining NUMERIC;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS action_taken TEXT DEFAULT 'pending';
