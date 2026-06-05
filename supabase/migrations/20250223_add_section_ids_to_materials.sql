ALTER TABLE event_materials ADD COLUMN IF NOT EXISTS section_ids TEXT[] DEFAULT '{}';
