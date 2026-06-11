-- ============================================================
-- 1. bubble_leave: Populate staff_name from staff table lookup
--    (staff_id stores Bubble staff ID, staff.bubble_id is the same)
-- ============================================================
UPDATE bubble_leave bl
SET staff_name = s.display_name
FROM staff s
WHERE bl.staff_id = s.bubble_id
  AND (bl.staff_name IS NULL OR bl.staff_name = '');

-- ============================================================
-- 2. bubble_leave: Populate leave_type (readable name) from leave_type table
--    leave_type column currently stores Bubble ID for synced records
--    Map it to leave_type.full_label using leave_type.bubble_id
-- ============================================================
UPDATE bubble_leave bl
SET leave_type = lt.full_label
FROM leave_type lt
WHERE bl.leave_type = lt.bubble_id
  AND lt.full_label IS NOT NULL;

-- Also populate leave_type_id with the leave_type code for future reference
UPDATE bubble_leave bl
SET leave_type_id = lt.code
FROM leave_type lt
WHERE bl.leave_type = lt.full_label
  AND lt.code IS NOT NULL
  AND (bl.leave_type_id IS NULL OR bl.leave_type_id LIKE '17%');

-- ============================================================
-- 3. bubble_leave: Populate leave_period_code from leave_period table
--    leave_period column stores Bubble ID for synced records
--    Map it to leave_period.code using leave_period.bubble_id
-- ============================================================
UPDATE bubble_leave bl
SET leave_period_code = lp.code,
    leave_period = lp.display
FROM leave_period lp
WHERE bl.leave_period = lp.bubble_id
  AND lp.code IS NOT NULL;

-- Also fix records where leave_period stores the code directly
UPDATE bubble_leave bl
SET leave_period_code = bl.leave_period
WHERE bl.leave_period IN ('AM', 'PM', 'FD', 'NA', 'CL')
  AND (bl.leave_period_code IS NULL OR bl.leave_period_code = '');

-- ============================================================
-- 4. bubble_leave: Populate status from approved field
--    For old imported records that have approved but no status
-- ============================================================
UPDATE bubble_leave
SET status = CASE
  WHEN approved = 'true' THEN '已批核'
  WHEN approved = 'false' THEN '不批核'
  ELSE '審查中'
END
WHERE (status IS NULL OR status = '')
  AND approved IS NOT NULL;

-- ============================================================
-- 5. bubble_leave: Populate approver_name from staff table
-- ============================================================
UPDATE bubble_leave bl
SET approver_name = s.display_name
FROM staff s
WHERE bl.approver_id = s.bubble_id
  AND (bl.approver_name IS NULL OR bl.approver_name = '');

-- ============================================================
-- 6. bubble_leave: Remove unused/duplicate columns
--    - google_event_id: Bubble internal workflow only
--    - interview_email: Bubble internal workflow only
--    - send_email: Bubble internal workflow only
--    - send_approval_email: Bubble internal workflow only
--    - created_by_id: redundant with staff_id
--    - base44_id: no longer used
-- ============================================================
ALTER TABLE bubble_leave DROP COLUMN IF EXISTS google_event_id;
ALTER TABLE bubble_leave DROP COLUMN IF EXISTS interview_email;
ALTER TABLE bubble_leave DROP COLUMN IF EXISTS send_email;
ALTER TABLE bubble_leave DROP COLUMN IF EXISTS send_approval_email;
ALTER TABLE bubble_leave DROP COLUMN IF EXISTS created_by_id;
ALTER TABLE bubble_leave DROP COLUMN IF EXISTS base44_id;

-- ============================================================
-- 7. Remove base44_id from ALL other tables
-- ============================================================
ALTER TABLE annual_review DROP COLUMN IF EXISTS base44_id;
ALTER TABLE appraisal_report DROP COLUMN IF EXISTS base44_id;
ALTER TABLE assessment_result DROP COLUMN IF EXISTS base44_id;
ALTER TABLE bubble_clockin DROP COLUMN IF EXISTS base44_id;
ALTER TABLE bubble_man_hour_date DROP COLUMN IF EXISTS base44_id;
ALTER TABLE bubble_man_hour_task DROP COLUMN IF EXISTS base44_id;
ALTER TABLE bubble_merits_demerits DROP COLUMN IF EXISTS base44_id;
ALTER TABLE bubble_ot DROP COLUMN IF EXISTS base44_id;
ALTER TABLE bubble_project DROP COLUMN IF EXISTS base44_id;
ALTER TABLE bubble_staff_kpi DROP COLUMN IF EXISTS base44_id;
ALTER TABLE bubble_staff_kpimonth DROP COLUMN IF EXISTS base44_id;
ALTER TABLE company_event DROP COLUMN IF EXISTS base44_id;
ALTER TABLE contribution_type DROP COLUMN IF EXISTS base44_id;
ALTER TABLE course DROP COLUMN IF EXISTS base44_id;
ALTER TABLE course_category DROP COLUMN IF EXISTS base44_id;
ALTER TABLE course_resource DROP COLUMN IF EXISTS base44_id;
ALTER TABLE leave_type DROP COLUMN IF EXISTS base44_id;
ALTER TABLE merit_demerit_type DROP COLUMN IF EXISTS base44_id;
ALTER TABLE nosbu DROP COLUMN IF EXISTS base44_id;
ALTER TABLE nosdistrict DROP COLUMN IF EXISTS base44_id;
ALTER TABLE nostask DROP COLUMN IF EXISTS base44_id;
ALTER TABLE nostask_type DROP COLUMN IF EXISTS base44_id;
ALTER TABLE nosteam DROP COLUMN IF EXISTS base44_id;
ALTER TABLE nosteam_role DROP COLUMN IF EXISTS base44_id;
ALTER TABLE notification DROP COLUMN IF EXISTS base44_id;
ALTER TABLE peer_review DROP COLUMN IF EXISTS base44_id;
ALTER TABLE profile_update_request DROP COLUMN IF EXISTS base44_id;
ALTER TABLE region DROP COLUMN IF EXISTS base44_id;
ALTER TABLE review_preset DROP COLUMN IF EXISTS base44_id;
ALTER TABLE score_level DROP COLUMN IF EXISTS base44_id;
ALTER TABLE staff DROP COLUMN IF EXISTS base44_id;
ALTER TABLE staff_contact_person DROP COLUMN IF EXISTS base44_id;
ALTER TABLE staff_education DROP COLUMN IF EXISTS base44_id;
ALTER TABLE staff_information DROP COLUMN IF EXISTS base44_id;
ALTER TABLE staff_qaanswer DROP COLUMN IF EXISTS base44_id;
ALTER TABLE staff_qacategory DROP COLUMN IF EXISTS base44_id;
ALTER TABLE staff_qaquestion DROP COLUMN IF EXISTS base44_id;
ALTER TABLE staff_work_experience DROP COLUMN IF EXISTS base44_id;
ALTER TABLE tender_registration DROP COLUMN IF EXISTS base44_id;
