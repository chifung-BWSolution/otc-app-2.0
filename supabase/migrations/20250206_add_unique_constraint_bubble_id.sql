-- The import_bubble_leaves function uses ON CONFLICT (bubble_id)
-- but the unique constraint may be missing if the table was created
-- before migration 20250129, or if bubble_id was added without UNIQUE.
-- Fix: add unique constraint if it doesn't exist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'bubble_leave'::regclass 
    AND contype = 'u'
    AND conname = 'bubble_leave_bubble_id_key'
  ) THEN
    ALTER TABLE bubble_leave ADD CONSTRAINT bubble_leave_bubble_id_key UNIQUE (bubble_id);
  END IF;
END $$;
