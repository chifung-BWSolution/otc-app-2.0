ALTER TABLE IF EXISTS knowledge_item ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE IF EXISTS knowledge_item ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE IF EXISTS knowledge_item ADD COLUMN IF NOT EXISTS week_start TEXT;
ALTER TABLE IF EXISTS knowledge_item ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE IF EXISTS company_event ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS company_event ADD COLUMN IF NOT EXISTS event_date TEXT;
ALTER TABLE IF EXISTS company_event ADD COLUMN IF NOT EXISTS time_range TEXT;
ALTER TABLE IF EXISTS company_event ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE IF EXISTS company_event ADD COLUMN IF NOT EXISTS region_codes TEXT[];

ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS dept TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS from_date TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS to_date TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS time_slot TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS delegate_email TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS delegate_name TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS approver_email TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS approver_name TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS reviewed_at TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE IF EXISTS leave_request ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

CREATE TABLE IF NOT EXISTS company_app (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  category TEXT,
  platform TEXT[],
  description TEXT,
  departments TEXT[],
  workflows TEXT,
  login_url TEXT,
  login_account TEXT,
  login_note TEXT,
  subscription_plan TEXT,
  monthly_cost NUMERIC DEFAULT 0,
  card_last4 TEXT,
  expiry_date TEXT,
  auto_renew BOOLEAN DEFAULT false,
  status TEXT DEFAULT '使用中',
  contact_person TEXT,
  icon_url TEXT,
  learning_resources JSONB,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_form (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  category TEXT,
  file_url TEXT,
  file_size TEXT,
  icon TEXT DEFAULT '📄',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  region_codes TEXT[],
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faq_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT,
  answer TEXT,
  category TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  region_codes TEXT[],
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  user_name TEXT,
  region_code TEXT,
  title TEXT,
  category TEXT,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'HKD',
  expense_date TEXT,
  receipt_url TEXT,
  notes TEXT,
  status TEXT DEFAULT '審批中',
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_help_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  user_name TEXT,
  region_code TEXT,
  request_type TEXT,
  title TEXT,
  description TEXT,
  urgency TEXT DEFAULT '中',
  status TEXT DEFAULT '待處理',
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS check_in_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  user_name TEXT,
  date TEXT,
  type TEXT,
  time TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  accuracy INTEGER,
  location_valid BOOLEAN DEFAULT false,
  distance_from_office INTEGER,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  user_name TEXT,
  dept TEXT,
  leave_type_code TEXT,
  leave_type_name TEXT,
  entitlement NUMERIC DEFAULT 0,
  used NUMERIC DEFAULT 0,
  remaining NUMERIC DEFAULT 0,
  year INTEGER,
  created_date TIMESTAMPTZ DEFAULT NOW()
);
