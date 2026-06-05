CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'other',
  cover_image_url TEXT,
  location TEXT,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  requires_seating BOOLEAN DEFAULT FALSE,
  registration_mode TEXT DEFAULT 'single_section',
  status TEXT DEFAULT 'draft',
  created_by UUID,
  max_capacity INTEGER,
  allow_duplicate_registration BOOLEAN DEFAULT FALSE,
  region_id TEXT
);

CREATE TABLE IF NOT EXISTS event_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  max_capacity INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registration_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fields_config JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  form_id UUID REFERENCES registration_forms(id) ON DELETE SET NULL,
  section_id UUID REFERENCES event_sections(id) ON DELETE SET NULL,
  form_data JSONB DEFAULT '{}'::jsonb,
  invited_by_staff_id TEXT,
  registration_source TEXT DEFAULT 'link',
  status TEXT DEFAULT 'confirmed',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  staff_id TEXT
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES event_registrations(id) ON DELETE CASCADE,
  section_id UUID REFERENCES event_sections(id) ON DELETE SET NULL,
  attended BOOLEAN DEFAULT FALSE,
  check_in_time TIMESTAMPTZ,
  marked_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seating_arrangements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  section_id UUID REFERENCES event_sections(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES event_registrations(id) ON DELETE CASCADE,
  table_number TEXT,
  seat_number TEXT,
  zone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_sections_event_id ON event_sections(event_id);
CREATE INDEX IF NOT EXISTS idx_registration_forms_event_id ON registration_forms(event_id);
CREATE INDEX IF NOT EXISTS idx_registration_forms_slug ON registration_forms(slug);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_form_id ON event_registrations(form_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_section_id ON event_registrations(section_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_event_id ON attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_registration_id ON attendance_records(registration_id);
CREATE INDEX IF NOT EXISTS idx_seating_arrangements_event_id ON seating_arrangements(event_id);
CREATE INDEX IF NOT EXISTS idx_seating_arrangements_registration_id ON seating_arrangements(registration_id);

ALTER TABLE events REPLICA IDENTITY FULL;
ALTER TABLE event_sections REPLICA IDENTITY FULL;
ALTER TABLE registration_forms REPLICA IDENTITY FULL;
ALTER TABLE event_registrations REPLICA IDENTITY FULL;
ALTER TABLE attendance_records REPLICA IDENTITY FULL;
ALTER TABLE seating_arrangements REPLICA IDENTITY FULL;
