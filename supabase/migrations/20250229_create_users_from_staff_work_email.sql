-- Auto-create user accounts from staff work_email and link them
-- Only for staff with non-empty work_email and active status

-- Step 1: Insert user records from staff work_email (skip if email already exists)
INSERT INTO "user" (email, full_name, role, account_status, employment_status, linked_staff_id)
SELECT
  s.work_email,
  COALESCE(s.display_name, s.chinese_name, s.work_email),
  'user',
  'Active',
  'active',
  s.bubble_id
FROM staff s
WHERE s.work_email IS NOT NULL
  AND s.work_email != ''
  AND s.o_status = 'Active'
ON CONFLICT (email) DO UPDATE SET
  linked_staff_id = EXCLUDED.linked_staff_id,
  full_name = CASE
    WHEN "user".full_name IS NULL OR "user".full_name = '' OR "user".full_name = "user".email
    THEN EXCLUDED.full_name
    ELSE "user".full_name
  END;

-- Step 2: Update staff.linked_user_email to complete the two-way link
UPDATE staff s
SET linked_user_email = s.work_email
WHERE s.work_email IS NOT NULL
  AND s.work_email != ''
  AND s.o_status = 'Active'
  AND (s.linked_user_email IS NULL OR s.linked_user_email = '');
