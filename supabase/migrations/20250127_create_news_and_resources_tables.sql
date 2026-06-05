CREATE TABLE IF NOT EXISTS company_news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  time_label TEXT,
  image TEXT,
  author TEXT,
  urgent BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  region_code TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tech_news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  time_label TEXT,
  image TEXT,
  source TEXT,
  hot BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_item (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  location TEXT,
  borrow_method TEXT,
  return_method TEXT,
  stock INT DEFAULT 0,
  category TEXT,
  value TEXT,
  usage_type TEXT,
  user_scope TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  region_code TEXT,
  sort_order INT DEFAULT 0,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_news REPLICA IDENTITY FULL;
ALTER TABLE tech_news REPLICA IDENTITY FULL;
ALTER TABLE resource_item REPLICA IDENTITY FULL;
