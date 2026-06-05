-- Create user table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  department TEXT,
  employment_status TEXT DEFAULT 'active',
  account_status TEXT DEFAULT 'Active',
  linked_staff_id TEXT,
  password_hint TEXT
);

-- Insert users with role and email
INSERT INTO "user" (email, full_name, role, account_status, employment_status)
VALUES
  ('brandingworks.live@gmail.com', 'Bis Sit', 'admin', 'Active', 'active'),
  ('brandingworks.logic@gmail.com', 'Wing Chan', 'user', 'Active', 'active'),
  ('brandingworks.motive@gmail.com', 'Maggie Chan', 'user', 'Active', 'active'),
  ('brandingworks.online@gmail.com', 'Leo Tse', 'user', 'Active', 'active'),
  ('brandingworks.project@gmail.com', 'Jacqueline Hsiao', 'user', 'Active', 'active'),
  ('brandingworks.solution@gmail.com', 'Candy Yip', 'user', 'Active', 'active'),
  ('brandingworks.spirit@gmail.com', 'Alpha Chow', 'user', 'Active', 'active'),
  ('chifung.dynamic@gmail.com', 'Rebecca Cheng', 'user', 'Active', 'active')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  account_status = EXCLUDED.account_status,
  employment_status = EXCLUDED.employment_status;

-- Link users to staff records by matching display_name
-- Update user.linked_staff_id with staff.bubble_id
UPDATE "user" u
SET linked_staff_id = s.bubble_id
FROM staff s
WHERE (u.linked_staff_id IS NULL OR u.linked_staff_id = '')
  AND s.o_status = 'Active'
  AND (
    (u.email = 'brandingworks.live@gmail.com' AND s.display_name ILIKE '%Bis%')
    OR (u.email = 'brandingworks.logic@gmail.com' AND s.display_name ILIKE '%Wing%Chan%')
    OR (u.email = 'brandingworks.motive@gmail.com' AND s.display_name ILIKE '%Maggie%Chan%')
    OR (u.email = 'brandingworks.online@gmail.com' AND s.display_name ILIKE '%Leo%Tse%')
    OR (u.email = 'brandingworks.project@gmail.com' AND s.display_name ILIKE '%Jacqueline%Hsiao%')
    OR (u.email = 'brandingworks.solution@gmail.com' AND s.display_name ILIKE '%Candy%Yip%')
    OR (u.email = 'brandingworks.spirit@gmail.com' AND s.display_name ILIKE '%Alpha%Chow%')
    OR (u.email = 'chifung.dynamic@gmail.com' AND s.display_name ILIKE '%Rebecca%Cheng%')
  );

-- Also update staff.linked_user_email to complete the two-way link
UPDATE staff s
SET linked_user_email = u.email
FROM "user" u
WHERE u.linked_staff_id = s.bubble_id
  AND u.linked_staff_id IS NOT NULL
  AND u.linked_staff_id != ''
  AND (s.linked_user_email IS NULL OR s.linked_user_email = '')
  AND u.email IN (
    'brandingworks.live@gmail.com',
    'brandingworks.logic@gmail.com',
    'brandingworks.motive@gmail.com',
    'brandingworks.online@gmail.com',
    'brandingworks.project@gmail.com',
    'brandingworks.solution@gmail.com',
    'brandingworks.spirit@gmail.com',
    'chifung.dynamic@gmail.com'
  );
