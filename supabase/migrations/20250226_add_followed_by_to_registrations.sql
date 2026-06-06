ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS followed_by TEXT;
