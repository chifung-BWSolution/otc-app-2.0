CREATE TABLE IF NOT EXISTS notification (
  id BIGSERIAL PRIMARY KEY,
  base44_id TEXT,
  user_id TEXT,
  staff_id TEXT,
  title TEXT,
  message TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  metadata JSONB,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tender_registration (
  id BIGSERIAL PRIMARY KEY,
  base44_id TEXT,
  project_name TEXT,
  project_number TEXT,
  client TEXT,
  status TEXT,
  region TEXT,
  staff_id TEXT,
  staff_name TEXT,
  tender_date DATE,
  deadline DATE,
  amount NUMERIC,
  notes TEXT,
  metadata JSONB,
  created_by_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);
