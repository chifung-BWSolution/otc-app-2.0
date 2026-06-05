DROP FUNCTION IF EXISTS import_bubble_leaves(JSONB);

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
  v_error_samples JSONB := '[]'::JSONB;
  v_err_msg TEXT;
  v_quota_raw TEXT;
  v_key TEXT;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(records)
  LOOP
    BEGIN
      v_bubble_id := NULLIF(TRIM(rec->>'unique id'), '');
      v_staff_name := NULLIF(TRIM(rec->>'Staff'), '');
      v_approver_name := NULLIF(TRIM(rec->>'Approver'), '');
      v_rejecter_name := NULLIF(TRIM(rec->>'Rejecter'), '');
      v_display_name := NULLIF(TRIM(rec->>'Display Name'), '');
      v_leave_type_bubble_id := NULLIF(TRIM(rec->>'N_Leave Type'), '');
      v_leave_period_bubble_id := NULLIF(TRIM(rec->>'N_Leave Period'), '');

      IF v_bubble_id IS NULL THEN
        v_errors := v_errors + 1;
        IF jsonb_array_length(v_error_samples) < 5 THEN
          v_error_samples := v_error_samples || jsonb_build_object(
            'error', 'missing bubble_id (unique id field is empty or missing)',
            'staff_name', COALESCE(v_staff_name, 'N/A'),
            'rec_keys', (SELECT jsonb_agg(k) FROM jsonb_object_keys(rec) AS k)
          );
        END IF;
        CONTINUE;
      END IF;

      v_staff_id := NULL;
      IF v_staff_name IS NOT NULL THEN
        SELECT s.bubble_id INTO v_staff_id
        FROM staff s
        WHERE LOWER(TRIM(s.display_name)) = LOWER(v_staff_name)
        LIMIT 1;
      END IF;

      v_approver_id := NULL;
      IF v_approver_name IS NOT NULL THEN
        SELECT s.bubble_id INTO v_approver_id
        FROM staff s
        WHERE LOWER(TRIM(s.display_name)) = LOWER(v_approver_name)
        LIMIT 1;
      END IF;

      v_rejecter_id := NULL;
      IF v_rejecter_name IS NOT NULL THEN
        SELECT s.bubble_id INTO v_rejecter_id
        FROM staff s
        WHERE LOWER(TRIM(s.display_name)) = LOWER(v_rejecter_name)
        LIMIT 1;
      END IF;

      v_approved := CASE
        WHEN LOWER(TRIM(rec->>'Approved')) = 'yes' THEN true
        WHEN LOWER(TRIM(rec->>'Approved')) = 'no' THEN false
        ELSE NULL
      END;

      v_status := CASE
        WHEN v_approved = true THEN 'approved'
        WHEN v_approved = false THEN 'rejected'
        WHEN v_rejecter_name IS NOT NULL THEN 'rejected'
        ELSE 'pending'
      END;

      v_leave_period_code := CASE v_leave_period_bubble_id
        WHEN '1733293358410x855921608733229000' THEN 'PM'
        WHEN '1733294631537x317416671710543900' THEN 'FD'
        WHEN '1733293192938x294420169356738560' THEN 'AM'
        ELSE 'NA'
      END;

      v_leave_type := CASE v_leave_type_bubble_id
        WHEN '1733292378108x727664326271828000' THEN '有薪假期'
        WHEN '1733292415484x950625549715767300' THEN '無薪假期/無薪病假'
        WHEN '1733292425936x527279806772674560' THEN '有薪病假'
        WHEN '1733292583491x565358080478937100' THEN '活動補假'
        WHEN '1733292490849x198849159539458050' THEN '生日假期'
        WHEN '1741596126152x596304259906535400' THEN '無薪病假'
        ELSE NULL
      END;

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

      v_quota := NULL;
      v_quota_raw := rec->>'-Quota';
      IF v_quota_raw IS NULL OR v_quota_raw = '' THEN
        FOR v_key IN SELECT k FROM jsonb_object_keys(rec) AS k WHERE k ILIKE '%quota%'
        LOOP
          v_quota_raw := rec->>v_key;
          EXIT;
        END LOOP;
      END IF;

      IF v_quota_raw IS NOT NULL AND v_quota_raw != '' THEN
        BEGIN
          v_quota := v_quota_raw::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
          v_quota := NULL;
        END;
      END IF;

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
        NOW(),
        NOW()
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
      GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT;
      v_errors := v_errors + 1;
      IF jsonb_array_length(v_error_samples) < 5 THEN
        v_error_samples := v_error_samples || jsonb_build_object(
          'bubble_id', COALESCE(v_bubble_id, 'NULL'),
          'error', v_err_msg,
          'staff_name', COALESCE(v_staff_name, 'NULL'),
          'rec_keys', (SELECT jsonb_agg(k) FROM jsonb_object_keys(rec) AS k)
        );
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'imported', v_count,
    'errors', v_errors,
    'total', jsonb_array_length(records),
    'error_samples', v_error_samples
  );
END;
$$ LANGUAGE plpgsql;
