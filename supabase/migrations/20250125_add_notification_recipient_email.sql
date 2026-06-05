DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification' AND column_name = 'recipient_email'
  ) THEN
    ALTER TABLE notification ADD COLUMN recipient_email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification' AND column_name = 'recipient_staff_id'
  ) THEN
    ALTER TABLE notification ADD COLUMN recipient_staff_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification' AND column_name = 'ref_id'
  ) THEN
    ALTER TABLE notification ADD COLUMN ref_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification' AND column_name = 'ref_name'
  ) THEN
    ALTER TABLE notification ADD COLUMN ref_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification' AND column_name = 'days_remaining'
  ) THEN
    ALTER TABLE notification ADD COLUMN days_remaining NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification' AND column_name = 'action_taken'
  ) THEN
    ALTER TABLE notification ADD COLUMN action_taken TEXT DEFAULT 'pending';
  END IF;
END $$;
