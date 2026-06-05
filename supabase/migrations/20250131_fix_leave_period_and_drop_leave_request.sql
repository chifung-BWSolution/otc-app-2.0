-- ============================================================
-- 1. Fix leave_period table: add missing columns
--    - limited_leave_types: relates to leave_type table (stores leave_type IDs)
--    - bubble_id: unique Bubble ID for this record
-- ============================================================

ALTER TABLE leave_period ADD COLUMN IF NOT EXISTS limited_leave_types TEXT;
ALTER TABLE leave_period ADD COLUMN IF NOT EXISTS bubble_id TEXT UNIQUE;

-- Update existing records with bubble_id and limited_leave_types data
UPDATE leave_period SET bubble_id = '1737106791087x793592504562483200', limited_leave_types = NULL WHERE code = 'NA';
UPDATE leave_period SET bubble_id = '1735808293079x986033414650986500', limited_leave_types = '1733292583491x565358080478937100' WHERE code = 'CL';
UPDATE leave_period SET bubble_id = '1733294631537x317416671710543900', limited_leave_types = NULL WHERE code = 'FD';
UPDATE leave_period SET bubble_id = '1733293358410x855921608733229000', limited_leave_types = NULL WHERE code = 'PM';
UPDATE leave_period SET bubble_id = '1733293192938x294420169356738560', limited_leave_types = NULL WHERE code = 'AM';

-- ============================================================
-- 2. Add leave application fields to bubble_leave table
--    so it can be used for BOTH imported records AND new applications
-- ============================================================

ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS dept TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS from_date TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS to_date TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS time_slot TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS days NUMERIC;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS delegate_email TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS delegate_name TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS approver_email TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS reviewed_at TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE bubble_leave ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

-- Add index for user_email lookups
CREATE INDEX IF NOT EXISTS idx_bubble_leave_user_email ON bubble_leave(user_email);

-- ============================================================
-- 3. Drop leave_request table (no longer needed)
-- ============================================================

DROP TABLE IF EXISTS leave_request;
