CREATE TABLE IF NOT EXISTS sync_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name TEXT UNIQUE NOT NULL,
  table_name TEXT,
  last_synced_at TIMESTAMPTZ,
  total_fetched INTEGER DEFAULT 0,
  total_upserted INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
