-- Add guest_index column to seating_arrangements for companion seat tracking
-- guest_index = 0 means the main registrant, 1+ means companions
ALTER TABLE seating_arrangements ADD COLUMN IF NOT EXISTS guest_index INTEGER DEFAULT 0;

-- Remove duplicates before adding unique index (keep latest row)
DELETE FROM seating_arrangements a
USING seating_arrangements b
WHERE a.event_id = b.event_id
  AND a.registration_id = b.registration_id
  AND a.guest_index = b.guest_index
  AND a.created_at < b.created_at;
