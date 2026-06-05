-- Allow all operations on event_rsvp_templates table
ALTER TABLE event_rsvp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select on event_rsvp_templates" ON event_rsvp_templates;
CREATE POLICY "Allow all select on event_rsvp_templates"
  ON event_rsvp_templates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all insert on event_rsvp_templates" ON event_rsvp_templates;
CREATE POLICY "Allow all insert on event_rsvp_templates"
  ON event_rsvp_templates FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on event_rsvp_templates" ON event_rsvp_templates;
CREATE POLICY "Allow all update on event_rsvp_templates"
  ON event_rsvp_templates FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow all delete on event_rsvp_templates" ON event_rsvp_templates;
CREATE POLICY "Allow all delete on event_rsvp_templates"
  ON event_rsvp_templates FOR DELETE
  USING (true);

-- Allow all operations on event_materials table
ALTER TABLE event_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select on event_materials" ON event_materials;
CREATE POLICY "Allow all select on event_materials"
  ON event_materials FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all insert on event_materials" ON event_materials;
CREATE POLICY "Allow all insert on event_materials"
  ON event_materials FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on event_materials" ON event_materials;
CREATE POLICY "Allow all update on event_materials"
  ON event_materials FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow all delete on event_materials" ON event_materials;
CREATE POLICY "Allow all delete on event_materials"
  ON event_materials FOR DELETE
  USING (true);
