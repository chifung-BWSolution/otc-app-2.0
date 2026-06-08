-- Insert missing users (upsert to avoid conflicts)
INSERT INTO "user" (email, full_name, role, account_status, employment_status)
VALUES
  ('chifung.login@gmail.com', 'Login Chi Fung Asia', 'admin', 'Active', 'active'),
  ('angel.kaffa@gmail.com', 'angel.kaffa', 'admin', 'Active', 'active'),
  ('brandingworks.value@gmail.com', 'brandingworks.value', 'user', 'Active', 'active'),
  ('brandingworks.vision@gmail.com', 'brandingworks.vision', 'user', 'Active', 'active'),
  ('brandingworks.excite@gmail.com', 'Risa Janamoto', 'user', 'Active', 'active'),
  ('brandingworks.solution@gmail.com', 'Candy Yip', 'user', 'Active', 'active'),
  ('brandingworks.spirit@gmail.com', 'Alpha Chow', 'user', 'Active', 'active'),
  ('brandingworks.logic@gmail.com', 'Wing Chan', 'user', 'Active', 'active')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  account_status = EXCLUDED.account_status,
  employment_status = EXCLUDED.employment_status;

-- Link users to staff records by matching display_name
UPDATE "user" u
SET linked_staff_id = s.bubble_id
FROM staff s
WHERE (u.linked_staff_id IS NULL OR u.linked_staff_id = '')
  AND s.o_status = 'Active'
  AND (
    (u.email = 'brandingworks.value@gmail.com' AND (s.display_name ILIKE '%brandingworks%value%' OR s.chinese_name ILIKE '%brandingworks%value%'))
    OR (u.email = 'brandingworks.vision@gmail.com' AND (s.display_name ILIKE '%brandingworks%vision%' OR s.chinese_name ILIKE '%brandingworks%vision%'))
    OR (u.email = 'brandingworks.excite@gmail.com' AND (s.display_name ILIKE '%Risa%' OR s.display_name ILIKE '%Janamoto%'))
    OR (u.email = 'brandingworks.solution@gmail.com' AND s.display_name ILIKE '%Candy%Yip%')
    OR (u.email = 'brandingworks.spirit@gmail.com' AND s.display_name ILIKE '%Alpha%Chow%')
    OR (u.email = 'brandingworks.logic@gmail.com' AND s.display_name ILIKE '%Wing%Chan%')
    OR (u.email = 'chifung.login@gmail.com' AND (s.display_name ILIKE '%Chi Fung%' OR s.display_name ILIKE '%Login%'))
    OR (u.email = 'angel.kaffa@gmail.com' AND (s.display_name ILIKE '%Angel%' OR s.display_name ILIKE '%kaffa%'))
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
    'chifung.login@gmail.com',
    'angel.kaffa@gmail.com',
    'brandingworks.value@gmail.com',
    'brandingworks.vision@gmail.com',
    'brandingworks.excite@gmail.com',
    'brandingworks.solution@gmail.com',
    'brandingworks.spirit@gmail.com',
    'brandingworks.logic@gmail.com'
  );
