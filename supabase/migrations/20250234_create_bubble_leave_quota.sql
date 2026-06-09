CREATE TABLE IF NOT EXISTS bubble_leave_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bubble_id TEXT UNIQUE NOT NULL,
  plus_minus_quota TEXT,
  calculation_date TEXT,
  count_year TEXT,
  operator_text TEXT,
  reason TEXT,
  staff_id TEXT,
  staff_name TEXT,
  created_date TEXT,
  modified_date TEXT,
  created_by TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bubble_leave_quota ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to bubble_leave_quota" ON bubble_leave_quota;
CREATE POLICY "Allow all access to bubble_leave_quota"
  ON bubble_leave_quota FOR ALL
  USING (true)
  WITH CHECK (true);
