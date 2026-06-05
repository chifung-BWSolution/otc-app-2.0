-- 1. Drop created_by_id column from bubble_man_hour_date
ALTER TABLE bubble_man_hour_date DROP COLUMN IF EXISTS created_by_id;

-- 2. Create a trigger function that populates staff_name from staff table using staff_id
CREATE OR REPLACE FUNCTION populate_man_hour_date_staff_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.staff_id IS NOT NULL THEN
    SELECT COALESCE(full_name, display_name, chinese_name) INTO NEW.staff_name
    FROM staff
    WHERE bubble_id = NEW.staff_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger on INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_populate_man_hour_date_staff_name ON bubble_man_hour_date;
CREATE TRIGGER trg_populate_man_hour_date_staff_name
  BEFORE INSERT OR UPDATE ON bubble_man_hour_date
  FOR EACH ROW
  EXECUTE FUNCTION populate_man_hour_date_staff_name();

-- 4. Backfill existing rows
UPDATE bubble_man_hour_date mhd
SET staff_name = COALESCE(s.full_name, s.display_name, s.chinese_name)
FROM staff s
WHERE mhd.staff_id = s.bubble_id
  AND mhd.staff_id IS NOT NULL;
