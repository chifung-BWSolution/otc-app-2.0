INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access for event covers" ON storage.objects;
CREATE POLICY "Public read access for event covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-covers');

DROP POLICY IF EXISTS "Authenticated users can upload event covers" ON storage.objects;
CREATE POLICY "Authenticated users can upload event covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-covers');

DROP POLICY IF EXISTS "Authenticated users can update event covers" ON storage.objects;
CREATE POLICY "Authenticated users can update event covers"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'event-covers');

DROP POLICY IF EXISTS "Authenticated users can delete event covers" ON storage.objects;
CREATE POLICY "Authenticated users can delete event covers"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-covers');
