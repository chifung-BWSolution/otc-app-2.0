-- ============================================================
-- 1. Create leave_period lookup table
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_period (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  display TEXT NOT NULL,
  eng_display TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO leave_period (code, display, eng_display, is_active)
VALUES
  ('NA', '自訂時間', 'Manual', false),
  ('CL', '延後上班', 'OT Event Leave', true),
  ('FD', '全日', 'Full Day', true),
  ('PM', '下午', 'PM', true),
  ('AM', '上午', 'AM', true)
ON CONFLICT (code) DO UPDATE SET
  display = EXCLUDED.display,
  eng_display = EXCLUDED.eng_display,
  is_active = EXCLUDED.is_active;

-- ============================================================
-- 2. Create bubble_leave table (for Bubble historical import)
-- ============================================================
CREATE TABLE IF NOT EXISTS bubble_leave (
  id BIGSERIAL PRIMARY KEY,
  bubble_id TEXT UNIQUE,
  base44_id TEXT,
  staff_id TEXT,
  staff_name TEXT,
  display_name TEXT,
  leave_type TEXT,
  leave_type_id TEXT,
  leave_period TEXT,
  leave_period_code TEXT,
  quota NUMERIC,
  approved BOOLEAN,
  status TEXT,
  approver_id TEXT,
  approver_name TEXT,
  rejecter_id TEXT,
  rejecter_name TEXT,
  start_date_time TEXT,
  end_date_time TEXT,
  count_year TEXT,
  application_reason TEXT,
  reject_reason TEXT,
  remarks TEXT,
  prove_url TEXT,
  info_tech_url TEXT,
  google_event_id TEXT,
  interview_email BOOLEAN,
  send_email BOOLEAN,
  send_approval_email BOOLEAN,
  created_by_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for staff lookups
CREATE INDEX IF NOT EXISTS idx_bubble_leave_staff_id ON bubble_leave(staff_id);
CREATE INDEX IF NOT EXISTS idx_bubble_leave_bubble_id ON bubble_leave(bubble_id);
