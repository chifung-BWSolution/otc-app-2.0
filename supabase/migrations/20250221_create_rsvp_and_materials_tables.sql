CREATE TABLE IF NOT EXISTS event_rsvp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  send_via_notification BOOLEAN DEFAULT TRUE,
  send_via_email BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  section_id UUID REFERENCES event_sections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  responsible_person TEXT,
  budget NUMERIC(10,2),
  status TEXT DEFAULT 'not_prepared',
  attachment_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_rsvp_templates_event_id ON event_rsvp_templates(event_id);
CREATE INDEX IF NOT EXISTS idx_event_materials_event_id ON event_materials(event_id);
CREATE INDEX IF NOT EXISTS idx_event_materials_section_id ON event_materials(section_id);

ALTER TABLE event_rsvp_templates REPLICA IDENTITY FULL;
ALTER TABLE event_materials REPLICA IDENTITY FULL;
