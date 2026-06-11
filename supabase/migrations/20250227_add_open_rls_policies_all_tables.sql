-- Ensure RLS is enabled and add open access policies for all main tables
-- This ensures dev admin bypass and anon access works correctly

DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'user', 'staff', 'region', 'notification',
    'annual_review', 'peer_review', 'appraisal_report',
    'bubble_clockin', 'bubble_leave', 'bubble_man_hour_date',
    'bubble_man_hour_task', 'bubble_merits_demerits', 'bubble_ot',
    'bubble_project', 'bubble_staff_kpi', 'bubble_staff_kpimonth',
    'check_in_record', 'company_app', 'company_event', 'company_form',
    'company_news', 'contribution_type', 'course', 'course_category',
    'course_resource', 'exam_question', 'exam_result', 'expense_record',
    'faq_item', 'file_upload', 'knowledge_item', 'leave_balance',
    'leave_period', 'leave_type', 'merit_demerit_type',
    'nosbu', 'nosdistrict', 'nostask', 'nostask_type', 'nosteam', 'nosteam_role',
    'admin_help_request', 'app_access_request', 'app_feedback',
    'app_license_assignment', 'assessment_arrangement', 'assessment_result',
    'assessment_time_change_request', 'profile_update_request',
    'resource_item', 'review_preset', 'score_level',
    'staff_contact_person', 'staff_education', 'staff_information',
    'staff_profile', 'staff_qaanswer', 'staff_qacategory', 'staff_qaquestion',
    'staff_work_experience', 'sync_progress', 'tech_news',
    'tender_registration', 'weekly_report', 'workshop', 'workshop_attendance'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    -- Only proceed if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      -- Enable RLS (idempotent)
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

      -- Drop and recreate open policies (use simple text concat for policy names to avoid quoting issues)
      EXECUTE format('DROP POLICY IF EXISTS "open_select" ON public.%I', tbl);
      EXECUTE format('CREATE POLICY "open_select" ON public.%I FOR SELECT USING (true)', tbl);

      EXECUTE format('DROP POLICY IF EXISTS "open_insert" ON public.%I', tbl);
      EXECUTE format('CREATE POLICY "open_insert" ON public.%I FOR INSERT WITH CHECK (true)', tbl);

      EXECUTE format('DROP POLICY IF EXISTS "open_update" ON public.%I', tbl);
      EXECUTE format('CREATE POLICY "open_update" ON public.%I FOR UPDATE USING (true)', tbl);

      EXECUTE format('DROP POLICY IF EXISTS "open_delete" ON public.%I', tbl);
      EXECUTE format('CREATE POLICY "open_delete" ON public.%I FOR DELETE USING (true)', tbl);
    END IF;
  END LOOP;
END $$;
