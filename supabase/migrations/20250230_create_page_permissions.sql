CREATE TABLE IF NOT EXISTS page_permissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role TEXT NOT NULL,
  page_path TEXT NOT NULL,
  allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, page_path)
);

CREATE TABLE IF NOT EXISTS user_page_overrides (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  user_email TEXT,
  page_path TEXT NOT NULL,
  allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, page_path)
);

ALTER TABLE page_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_page_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to page_permissions" ON page_permissions;
CREATE POLICY "Allow all access to page_permissions" ON page_permissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to user_page_overrides" ON user_page_overrides;
CREATE POLICY "Allow all access to user_page_overrides" ON user_page_overrides FOR ALL USING (true) WITH CHECK (true);
