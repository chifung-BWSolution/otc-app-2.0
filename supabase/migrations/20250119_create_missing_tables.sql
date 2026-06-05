CREATE TABLE IF NOT EXISTS assessment_result (
  id BIGSERIAL PRIMARY KEY,
  base44_id TEXT,
  staff_id TEXT,
  staff_name TEXT,
  assessment_id TEXT,
  score NUMERIC,
  grade TEXT,
  status TEXT,
  exam_date DATE,
  answers JSONB,
  metadata JSONB,
  created_by_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_update_request (
  id BIGSERIAL PRIMARY KEY,
  base44_id TEXT,
  staff_id TEXT,
  staff_name TEXT,
  request_type TEXT,
  status TEXT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  approved_by TEXT,
  approved_date TIMESTAMPTZ,
  metadata JSONB,
  created_by_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_request (
  id BIGSERIAL PRIMARY KEY,
  base44_id TEXT,
  staff_id TEXT,
  staff_name TEXT,
  leave_type TEXT,
  leave_type_id TEXT,
  start_date DATE,
  end_date DATE,
  days NUMERIC,
  reason TEXT,
  status TEXT,
  approved_by TEXT,
  approved_date TIMESTAMPTZ,
  attachment TEXT,
  metadata JSONB,
  created_by_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course (
  id BIGSERIAL PRIMARY KEY,
  base44_id TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  category_id TEXT,
  instructor TEXT,
  duration TEXT,
  status TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  max_participants INTEGER,
  metadata JSONB,
  created_by_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_event (
  id BIGSERIAL PRIMARY KEY,
  base44_id TEXT,
  title TEXT,
  description TEXT,
  event_type TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  organizer TEXT,
  status TEXT,
  region TEXT,
  metadata JSONB,
  created_by_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);
