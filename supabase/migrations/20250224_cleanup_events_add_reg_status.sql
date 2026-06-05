-- Remove unused columns from events table
ALTER TABLE events DROP COLUMN IF EXISTS region_id;
ALTER TABLE events DROP COLUMN IF EXISTS rsvp_message;
ALTER TABLE events DROP COLUMN IF EXISTS materials_list;

-- Add registration_status to event_registrations
-- Values: pending (待處理), rsvp_sent (已傳送RSVP), awaiting_confirm (待確認), attending (會出席), not_attending (不會出席)
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'pending';
