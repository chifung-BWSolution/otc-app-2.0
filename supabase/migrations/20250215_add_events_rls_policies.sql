-- Allow all operations on events table
DROP POLICY IF EXISTS "Allow all select on events" ON events;
CREATE POLICY "Allow all select on events"
  ON events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all insert on events" ON events;
CREATE POLICY "Allow all insert on events"
  ON events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on events" ON events;
CREATE POLICY "Allow all update on events"
  ON events FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow all delete on events" ON events;
CREATE POLICY "Allow all delete on events"
  ON events FOR DELETE
  USING (true);

-- Also add policies for related event tables
DROP POLICY IF EXISTS "Allow all select on event_sections" ON event_sections;
CREATE POLICY "Allow all select on event_sections"
  ON event_sections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all insert on event_sections" ON event_sections;
CREATE POLICY "Allow all insert on event_sections"
  ON event_sections FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on event_sections" ON event_sections;
CREATE POLICY "Allow all update on event_sections"
  ON event_sections FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow all delete on event_sections" ON event_sections;
CREATE POLICY "Allow all delete on event_sections"
  ON event_sections FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Allow all select on registration_forms" ON registration_forms;
CREATE POLICY "Allow all select on registration_forms"
  ON registration_forms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all insert on registration_forms" ON registration_forms;
CREATE POLICY "Allow all insert on registration_forms"
  ON registration_forms FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on registration_forms" ON registration_forms;
CREATE POLICY "Allow all update on registration_forms"
  ON registration_forms FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow all delete on registration_forms" ON registration_forms;
CREATE POLICY "Allow all delete on registration_forms"
  ON registration_forms FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Allow all select on event_registrations" ON event_registrations;
CREATE POLICY "Allow all select on event_registrations"
  ON event_registrations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all insert on event_registrations" ON event_registrations;
CREATE POLICY "Allow all insert on event_registrations"
  ON event_registrations FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on event_registrations" ON event_registrations;
CREATE POLICY "Allow all update on event_registrations"
  ON event_registrations FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow all delete on event_registrations" ON event_registrations;
CREATE POLICY "Allow all delete on event_registrations"
  ON event_registrations FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Allow all select on attendance_records" ON attendance_records;
CREATE POLICY "Allow all select on attendance_records"
  ON attendance_records FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all insert on attendance_records" ON attendance_records;
CREATE POLICY "Allow all insert on attendance_records"
  ON attendance_records FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on attendance_records" ON attendance_records;
CREATE POLICY "Allow all update on attendance_records"
  ON attendance_records FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow all delete on attendance_records" ON attendance_records;
CREATE POLICY "Allow all delete on attendance_records"
  ON attendance_records FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Allow all select on seating_arrangements" ON seating_arrangements;
CREATE POLICY "Allow all select on seating_arrangements"
  ON seating_arrangements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow all insert on seating_arrangements" ON seating_arrangements;
CREATE POLICY "Allow all insert on seating_arrangements"
  ON seating_arrangements FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on seating_arrangements" ON seating_arrangements;
CREATE POLICY "Allow all update on seating_arrangements"
  ON seating_arrangements FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow all delete on seating_arrangements" ON seating_arrangements;
CREATE POLICY "Allow all delete on seating_arrangements"
  ON seating_arrangements FOR DELETE
  USING (true);
