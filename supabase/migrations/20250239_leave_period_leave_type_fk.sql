-- Replace the free-text limited_leave_types column on leave_period with a
-- proper foreign key to leave_type(id).

-- 1. New FK column
ALTER TABLE leave_period ADD COLUMN IF NOT EXISTS limited_leave_type_id BIGINT;

-- 2. Migrate existing data. Historically limited_leave_types stored a Bubble id,
--    so resolve it against leave_type.bubble_id (and fall back to a numeric id
--    if it was already stored that way).
UPDATE leave_period lp
SET limited_leave_type_id = lt.id
FROM leave_type lt
WHERE NULLIF(lp.limited_leave_types, '') IS NOT NULL
  AND lp.limited_leave_types = lt.bubble_id;

UPDATE leave_period lp
SET limited_leave_type_id = lp.limited_leave_types::BIGINT
FROM leave_type lt
WHERE lp.limited_leave_type_id IS NULL
  AND lp.limited_leave_types ~ '^[0-9]+$'
  AND lp.limited_leave_types::BIGINT = lt.id;

-- 3. Add the foreign key constraint
ALTER TABLE leave_period
  ADD CONSTRAINT leave_period_limited_leave_type_id_fkey
  FOREIGN KEY (limited_leave_type_id) REFERENCES leave_type(id) ON DELETE SET NULL;

-- 4. Drop the old free-text column
ALTER TABLE leave_period DROP COLUMN IF EXISTS limited_leave_types;
