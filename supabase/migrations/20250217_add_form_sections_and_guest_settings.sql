ALTER TABLE registration_forms ADD COLUMN IF NOT EXISTS section_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE registration_forms ADD COLUMN IF NOT EXISTS max_guests_per_registration INTEGER DEFAULT 0;
ALTER TABLE registration_forms ADD COLUMN IF NOT EXISTS show_inviter_field BOOLEAN DEFAULT TRUE;

ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 0;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS guest_names JSONB DEFAULT '[]'::jsonb;
