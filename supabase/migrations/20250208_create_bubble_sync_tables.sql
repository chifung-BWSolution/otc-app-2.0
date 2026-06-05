-- Create all bubble sync target tables that were missing
-- Each table MUST have bubble_id TEXT UNIQUE for upsert(onConflict: "bubble_id") to work

-- 1. staff table: ensure bubble_id column exists and is UNIQUE
ALTER TABLE staff ADD COLUMN IF NOT EXISTS bubble_id TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'staff'::regclass
    AND contype = 'u'
    AND (conname = 'staff_bubble_id_key' OR conname = 'uq_staff_bubble_id')
  ) THEN
    ALTER TABLE staff ADD CONSTRAINT staff_bubble_id_key UNIQUE (bubble_id);
  END IF;
END $$;

-- 2. staff_information table
CREATE TABLE IF NOT EXISTS staff_information (
  id BIGSERIAL PRIMARY KEY,
  bubble_id TEXT UNIQUE,
  staff_id TEXT,
  chinese_name TEXT,
  english_name TEXT,
  nickname TEXT,
  birthday TEXT,
  phone TEXT,
  residential_telephone TEXT,
  email1 TEXT,
  email2 TEXT,
  identity_card_number TEXT,
  mainland_travel_permit_number TEXT,
  new_bank_card_number TEXT,
  bank_card_name TEXT,
  bank_card_owner TEXT,
  chinese_mailing_address TEXT,
  english_mailing_address TEXT,
  native_place TEXT,
  residential_area TEXT,
  marital_status TEXT,
  commuting_time TEXT,
  is_active TEXT,
  is_smoking TEXT,
  no_working_experience TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- 3. bubble_ot table
CREATE TABLE IF NOT EXISTS bubble_ot (
  id BIGSERIAL PRIMARY KEY,
  bubble_id TEXT UNIQUE,
  remarks TEXT,
  ot_hour TEXT,
  event_name TEXT,
  reject_reason TEXT,
  staff_id TEXT,
  end_date_time TEXT,
  is_interview TEXT,
  start_date_time TEXT,
  clockin_id TEXT,
  ot_type TEXT,
  status TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- 4. bubble_clockin table
CREATE TABLE IF NOT EXISTS bubble_clockin (
  id BIGSERIAL PRIMARY KEY,
  bubble_id TEXT UNIQUE,
  prove_out_url TEXT,
  remarks_in TEXT,
  face_image_in_url TEXT,
  prove_in_url TEXT,
  clockin_time TEXT,
  ot_minutes TEXT,
  remarks_out TEXT,
  staff_id TEXT,
  clock_out_time TEXT,
  late_minutes TEXT,
  accuracy_in TEXT,
  accuracy_out TEXT,
  face_image_out_url TEXT,
  face_image_file_url_in TEXT,
  reason_for_no_clock TEXT,
  request_update_end_time TEXT,
  face_image_file_url_out TEXT,
  request_update_start_time TEXT,
  geo_location_in TEXT,
  geo_location_out TEXT,
  google_location_in TEXT,
  google_location_out TEXT,
  status_in TEXT,
  status_out TEXT,
  tags_in TEXT,
  tags_out TEXT,
  work_location_in TEXT,
  work_location_out TEXT,
  photo_approval_in TEXT,
  photo_approval_out TEXT,
  request_update_end_location TEXT,
  request_update_start_location TEXT,
  dingding_in_attendance_id TEXT,
  dingding_out_attendance_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- 5. bubble_man_hour_date table
CREATE TABLE IF NOT EXISTS bubble_man_hour_date (
  id BIGSERIAL PRIMARY KEY,
  bubble_id TEXT UNIQUE,
  report_date TEXT,
  staff_id TEXT,
  total_work_hour TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- 6. bubble_man_hour_task table
CREATE TABLE IF NOT EXISTS bubble_man_hour_task (
  id BIGSERIAL PRIMARY KEY,
  bubble_id TEXT UNIQUE,
  asana_link TEXT,
  work_hour TEXT,
  images TEXT,
  keywords TEXT,
  meeting_topic TEXT,
  output_count TEXT,
  task_description TEXT,
  task_id TEXT,
  project_id TEXT,
  brand_id TEXT,
  meeting_invite_sent TEXT,
  projects TEXT,
  task_type_id TEXT,
  man_hour_date_id TEXT,
  meeting_participants TEXT,
  meeting_method TEXT,
  output_unit TEXT,
  work_location TEXT,
  meeting_duration TEXT,
  meeting_request_date TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- 7. bubble_project table
CREATE TABLE IF NOT EXISTS bubble_project (
  id BIGSERIAL PRIMARY KEY,
  bubble_id TEXT UNIQUE,
  outcome TEXT,
  asana_link TEXT,
  pic_id TEXT,
  display_name TEXT,
  started_date TEXT,
  bubble_api_id TEXT,
  is_key_project TEXT,
  estimated_income TEXT,
  estimated_expense TEXT,
  estimated_man_hour TEXT,
  brands TEXT,
  collaborators TEXT,
  status TEXT,
  teams TEXT,
  locations TEXT,
  roles TEXT,
  sub_projects TEXT,
  task_types TEXT,
  project_timeline TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- 8. bubble_staff_kpi table
CREATE TABLE IF NOT EXISTS bubble_staff_kpi (
  id BIGSERIAL PRIMARY KEY,
  bubble_id TEXT UNIQUE,
  score TEXT,
  asana_link TEXT,
  kpi_sales TEXT,
  related_file_url TEXT,
  self_score TEXT,
  leader_comment TEXT,
  box_folder TEXT,
  key_achievement TEXT,
  project_id TEXT,
  improve_description TEXT,
  leader_suggest_score TEXT,
  breakthrough_description TEXT,
  staff_kpi_month_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- 9. bubble_staff_kpimonth table
CREATE TABLE IF NOT EXISTS bubble_staff_kpimonth (
  id BIGSERIAL PRIMARY KEY,
  bubble_id TEXT UNIQUE,
  report_month TEXT,
  staff_id TEXT,
  company_comment TEXT,
  company_point TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);
