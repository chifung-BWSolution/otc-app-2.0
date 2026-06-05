-- Convert bubble_leave non-TEXT columns to TEXT to match StaffInformation pattern
-- This ensures consistent behavior with syncBubbleTable (serializeValue stores everything as text)
-- and bubbleDataStats (.neq(col, "") works uniformly on all columns)

-- 1. Convert BOOLEAN columns to TEXT
ALTER TABLE bubble_leave ALTER COLUMN approved TYPE TEXT USING CASE WHEN approved IS NULL THEN NULL WHEN approved THEN 'true' ELSE 'false' END;
ALTER TABLE bubble_leave ALTER COLUMN interview_email TYPE TEXT USING CASE WHEN interview_email IS NULL THEN NULL WHEN interview_email THEN 'true' ELSE 'false' END;
ALTER TABLE bubble_leave ALTER COLUMN send_email TYPE TEXT USING CASE WHEN send_email IS NULL THEN NULL WHEN send_email THEN 'true' ELSE 'false' END;
ALTER TABLE bubble_leave ALTER COLUMN send_approval_email TYPE TEXT USING CASE WHEN send_approval_email IS NULL THEN NULL WHEN send_approval_email THEN 'true' ELSE 'false' END;

-- 2. Convert NUMERIC columns to TEXT
ALTER TABLE bubble_leave ALTER COLUMN quota TYPE TEXT USING CASE WHEN quota IS NULL THEN NULL ELSE quota::TEXT END;

-- 3. Convert NUMERIC column 'days' to TEXT (added in later migration)
ALTER TABLE bubble_leave ALTER COLUMN days TYPE TEXT USING CASE WHEN days IS NULL THEN NULL ELSE days::TEXT END;
