-- The start_date_time and end_date_time columns in bubble_leave are TIMESTAMPTZ
-- but Bubble sends them as text strings. The import function inserts text directly.
-- Fix: change these columns to TEXT type to accept text values from Bubble.

ALTER TABLE bubble_leave 
  ALTER COLUMN start_date_time TYPE TEXT USING start_date_time::TEXT;

ALTER TABLE bubble_leave 
  ALTER COLUMN end_date_time TYPE TEXT USING end_date_time::TEXT;

-- Also fix created_date and updated_date if they cause issues later
-- These are set to NOW() in the function so they stay as TIMESTAMPTZ - no change needed.
