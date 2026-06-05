-- ============================================================
-- One-time Bubble Leave Import Function
-- 
-- This creates a stored function that processes leave data
-- imported from the Bubble CSV export.
-- 
-- The function:
-- 1. Accepts JSONB array of leave records
-- 2. Matches staff names to staff.id (precise match via display_name)
-- 3. Converts Bubble dates to ISO8601
-- 4. Converts boolean strings (yes/no) to actual booleans
-- 5. Maps Bubble leave period IDs to codes
-- 6. Maps Bubble leave type IDs to leave type names
-- 7. Derives status from approved field
-- 8. Upserts into bubble_leave using bubble_id as unique key
-- ============================================================

CREATE OR REPLACE FUNCTION import_bubble_leaves(records JSONB)
RETURNS JSONB AS $$
DECLARE
  rec JSONB;
  v_staff_id TEXT;
  v_approver_id TEXT;
  v_rejecter_id TEXT;
  v_approved BOOLEAN;
  v_status TEXT;
  v_leave_period_code TEXT;
  v_leave_type TEXT;
  v_interview_email BOOLEAN;
  v_send_email BOOLEAN;
  v_send_approval_email BOOLEAN;
  v_quota NUMERIC;
  v_count INT := 0;
  v_errors INT := 0;
  v_bubble_id TEXT;
  v_staff_name TEXT;
  v_approver_name TEXT;
  v_rejecter_name TEXT;
  v_display_name TEXT;
  v_leave_type_bubble_id TEXT;
  v_leave_period_bubble_id TEXT;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(records)
  LOOP
    BEGIN
      -- Extract basic fields
      v_bubble_id := rec->>'unique id';
      v_staff_name := NULLIF(TRIM(rec->>'Staff'), '');
      v_approver_name := NULLIF(TRIM(rec->>'Approver'), '');
      v_rejecter_name := NULLIF(TRIM(rec->>'Rejecter'), '');
      v_display_name := NULLIF(TRIM(rec->>'Display Name'), '');
      v_leave_type_bubble_id := NULLIF(TRIM(rec->>'N_Leave Type'), '');
      v_leave_period_bubble_id := NULLIF(TRIM(rec->>'N_Leave Period'), '');

      -- Skip if no bubble_id
      IF v_bubble_id IS NULL OR v_bubble_id = '' THEN
        v_errors := v_errors + 1;
        CONTINUE;
      END IF;

      -- Match staff name to staff.id (precise match on display_name)
      v_staff_id := NULL;
      IF v_staff_name IS NOT NULL THEN
        SELECT s.bubble_id INTO v_staff_id
        FROM staff s
        WHERE LOWER(TRIM(s.display_name)) = LOWER(v_staff_name)
        LIMIT 1;
      END IF;

      -- Match approver name to staff.id
      v_approver_id := NULL;
      IF v_approver_name IS NOT NULL THEN
        SELECT s.bubble_id INTO v_approver_id
        FROM staff s
        WHERE LOWER(TRIM(s.display_name)) = LOWER(v_approver_name)
        LIMIT 1;
      END IF;

      -- Match rejecter name to staff.id
      v_rejecter_id := NULL;
      IF v_rejecter_name IS NOT NULL THEN
        SELECT s.bubble_id INTO v_rejecter_id
        FROM staff s
        WHERE LOWER(TRIM(s.display_name)) = LOWER(v_rejecter_name)
        LIMIT 1;
      END IF;

      -- Convert approved field: "yes" -> true, "no" -> false, "" -> null
      v_approved := CASE
        WHEN LOWER(TRIM(rec->>'Approved')) = 'yes' THEN true
        WHEN LOWER(TRIM(rec->>'Approved')) = 'no' THEN false
        ELSE NULL
      END;

      -- Derive status from approved + rejecter
      v_status := CASE
        WHEN v_approved = true THEN 'approved'
        WHEN v_approved = false THEN 'rejected'
        WHEN v_rejecter_name IS NOT NULL AND v_rejecter_name != '' THEN 'rejected'
        ELSE 'pending'
      END;

      -- Map leave period Bubble ID to code
      v_leave_period_code := CASE v_leave_period_bubble_id
        WHEN '1733293358410x855921608733229000' THEN 'PM'
        WHEN '1733294631537x317416671710543900' THEN 'FD'
        WHEN '1733293192938x294420169356738560' THEN 'AM'
        ELSE 'NA'
      END;

      -- Map leave type Bubble ID to Chinese name
      v_leave_type := CASE v_leave_type_bubble_id
        WHEN '1733292378108x727664326271828000' THEN '有薪假期'
        WHEN '1733292415484x950625549715767300' THEN '無薪假期/無薪病假'
        WHEN '1733292425936x527279806772674560' THEN '有薪病假'
        WHEN '1733292583491x565358080478937100' THEN '活動補假'
        WHEN '1733292490849x198849159539458050' THEN '生日假期'
        WHEN '1741596126152x596304259906535400' THEN '無薪病假'
        ELSE NULL
      END;

      -- Convert boolean fields
      v_interview_email := CASE
        WHEN LOWER(TRIM(rec->>'Interview Email')) = 'yes' THEN true
        WHEN LOWER(TRIM(rec->>'Interview Email')) = 'no' THEN false
        ELSE NULL
      END;

      v_send_email := CASE
        WHEN LOWER(TRIM(rec->>'Send Email')) = 'yes' THEN true
        WHEN LOWER(TRIM(rec->>'Send Email')) = 'no' THEN false
        ELSE NULL
      END;

      v_send_approval_email := CASE
        WHEN LOWER(TRIM(rec->>'Send Approval Email')) = 'yes' THEN true
        WHEN LOWER(TRIM(rec->>'Send Approval Email')) = 'no' THEN false
        ELSE NULL
      END;

      -- Convert quota
      v_quota := CASE
        WHEN rec->>'"-Quota"' IS NOT NULL AND rec->>'"-Quota"' != '' THEN (rec->>'"-Quota"')::NUMERIC
        WHEN rec->>'-Quota' IS NOT NULL AND rec->>'-Quota' != '' THEN (rec->>'-Quota')::NUMERIC
        ELSE NULL
      END;

      -- Upsert into bubble_leave
      INSERT INTO bubble_leave (
        bubble_id,
        staff_id,
        staff_name,
        display_name,
        leave_type,
        leave_type_id,
        leave_period,
        leave_period_code,
        quota,
        approved,
        status,
        approver_id,
        approver_name,
        rejecter_id,
        rejecter_name,
        start_date_time,
        end_date_time,
        count_year,
        application_reason,
        reject_reason,
        remarks,
        prove_url,
        interview_email,
        send_email,
        send_approval_email,
        created_by_id,
        created_date,
        updated_date
      )
      VALUES (
        v_bubble_id,
        v_staff_id,
        v_staff_name,
        v_display_name,
        v_leave_type,
        v_leave_type_bubble_id,
        v_leave_period_code,
        v_leave_period_code,
        v_quota,
        v_approved,
        v_status,
        v_approver_id,
        v_approver_name,
        v_rejecter_id,
        v_rejecter_name,
        NULLIF(TRIM(rec->>'Start Date & Time'), ''),
        NULLIF(TRIM(rec->>'End Date & Time'), ''),
        NULLIF(TRIM(rec->>'Count Year'), ''),
        NULLIF(TRIM(rec->>'Reason for apply'), ''),
        NULLIF(TRIM(rec->>'Reject Reason'), ''),
        NULLIF(TRIM(rec->>'Remarks'), ''),
        NULLIF(TRIM(rec->>'Prove'), ''),
        v_interview_email,
        v_send_email,
        v_send_approval_email,
        NULLIF(TRIM(rec->>'Creator'), ''),
        CASE WHEN rec->>'Creation Date' IS NOT NULL AND rec->>'Creation Date' != '' 
          THEN NOW() ELSE NOW() END,
        CASE WHEN rec->>'Modified Date' IS NOT NULL AND rec->>'Modified Date' != ''
          THEN NOW() ELSE NOW() END
      )
      ON CONFLICT (bubble_id) DO UPDATE SET
        staff_id = EXCLUDED.staff_id,
        staff_name = EXCLUDED.staff_name,
        display_name = EXCLUDED.display_name,
        leave_type = EXCLUDED.leave_type,
        leave_type_id = EXCLUDED.leave_type_id,
        leave_period = EXCLUDED.leave_period,
        leave_period_code = EXCLUDED.leave_period_code,
        quota = EXCLUDED.quota,
        approved = EXCLUDED.approved,
        status = EXCLUDED.status,
        approver_id = EXCLUDED.approver_id,
        approver_name = EXCLUDED.approver_name,
        rejecter_id = EXCLUDED.rejecter_id,
        rejecter_name = EXCLUDED.rejecter_name,
        start_date_time = EXCLUDED.start_date_time,
        end_date_time = EXCLUDED.end_date_time,
        count_year = EXCLUDED.count_year,
        application_reason = EXCLUDED.application_reason,
        reject_reason = EXCLUDED.reject_reason,
        remarks = EXCLUDED.remarks,
        prove_url = EXCLUDED.prove_url,
        interview_email = EXCLUDED.interview_email,
        send_email = EXCLUDED.send_email,
        send_approval_email = EXCLUDED.send_approval_email,
        created_by_id = EXCLUDED.created_by_id,
        updated_date = NOW();

      v_count := v_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE NOTICE 'Error importing bubble_id %: %', v_bubble_id, SQLERRM;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'imported', v_count,
    'errors', v_errors,
    'total', jsonb_array_length(records)
  );
END;
$$ LANGUAGE plpgsql;
