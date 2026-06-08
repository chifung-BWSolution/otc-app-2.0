export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_help_request: {
        Row: {
          created_date: string | null
          description: string | null
          id: string
          region_code: string | null
          request_type: string | null
          status: string | null
          title: string | null
          urgency: string | null
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          created_date?: string | null
          description?: string | null
          id?: string
          region_code?: string | null
          request_type?: string | null
          status?: string | null
          title?: string | null
          urgency?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          created_date?: string | null
          description?: string | null
          id?: string
          region_code?: string | null
          request_type?: string | null
          status?: string | null
          title?: string | null
          urgency?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      annual_review: {
        Row: {
          attendance_work_days: number | null
          base44_id: string | null
          boss_adjustment_note: string | null
          boss_dept_goals: Json | null
          boss_extra_notes: string | null
          boss_gp_comment: string | null
          boss_gp_disabled: boolean | null
          boss_gp_fields: Json | null
          boss_gp_score: number | null
          boss_personal_goals: Json | null
          boss_score_adjustment: number | null
          boss_tender_disabled: boolean | null
          boss_tender_fields: Json | null
          challenges: string | null
          challenges_solution: string | null
          commitment: string | null
          company_feedback: string | null
          created_by_id: string | null
          created_date: string | null
          extra_contributions: Json | null
          fiscal_year: string | null
          id: number
          leader_comment: string | null
          leader_next_year_expectation: string | null
          leader_private_note: string | null
          leader_scored_at: string | null
          leader_staff_id: string | null
          next_year_goals: string | null
          project_contributions: Json | null
          skill_scores: Json | null
          skill_self_scores: Json | null
          staff_bu: string | null
          staff_id: string | null
          staff_name: string | null
          staff_position: string | null
          staff_team: string | null
          status: string | null
          submitted_at: string | null
          updated_date: string | null
        }
        Insert: {
          attendance_work_days?: number | null
          base44_id?: string | null
          boss_adjustment_note?: string | null
          boss_dept_goals?: Json | null
          boss_extra_notes?: string | null
          boss_gp_comment?: string | null
          boss_gp_disabled?: boolean | null
          boss_gp_fields?: Json | null
          boss_gp_score?: number | null
          boss_personal_goals?: Json | null
          boss_score_adjustment?: number | null
          boss_tender_disabled?: boolean | null
          boss_tender_fields?: Json | null
          challenges?: string | null
          challenges_solution?: string | null
          commitment?: string | null
          company_feedback?: string | null
          created_by_id?: string | null
          created_date?: string | null
          extra_contributions?: Json | null
          fiscal_year?: string | null
          id?: never
          leader_comment?: string | null
          leader_next_year_expectation?: string | null
          leader_private_note?: string | null
          leader_scored_at?: string | null
          leader_staff_id?: string | null
          next_year_goals?: string | null
          project_contributions?: Json | null
          skill_scores?: Json | null
          skill_self_scores?: Json | null
          staff_bu?: string | null
          staff_id?: string | null
          staff_name?: string | null
          staff_position?: string | null
          staff_team?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_date?: string | null
        }
        Update: {
          attendance_work_days?: number | null
          base44_id?: string | null
          boss_adjustment_note?: string | null
          boss_dept_goals?: Json | null
          boss_extra_notes?: string | null
          boss_gp_comment?: string | null
          boss_gp_disabled?: boolean | null
          boss_gp_fields?: Json | null
          boss_gp_score?: number | null
          boss_personal_goals?: Json | null
          boss_score_adjustment?: number | null
          boss_tender_disabled?: boolean | null
          boss_tender_fields?: Json | null
          challenges?: string | null
          challenges_solution?: string | null
          commitment?: string | null
          company_feedback?: string | null
          created_by_id?: string | null
          created_date?: string | null
          extra_contributions?: Json | null
          fiscal_year?: string | null
          id?: never
          leader_comment?: string | null
          leader_next_year_expectation?: string | null
          leader_private_note?: string | null
          leader_scored_at?: string | null
          leader_staff_id?: string | null
          next_year_goals?: string | null
          project_contributions?: Json | null
          skill_scores?: Json | null
          skill_self_scores?: Json | null
          staff_bu?: string | null
          staff_id?: string | null
          staff_name?: string | null
          staff_position?: string | null
          staff_team?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      appraisal_report: {
        Row: {
          annual_review_id: string | null
          base44_id: string | null
          boss_feedback: string | null
          created_by_id: string | null
          created_date: string | null
          fiscal_year: string | null
          id: number
          is_final: boolean | null
          pdf_url: string | null
          report_content: string | null
          score_attendance: number | null
          score_challenges: number | null
          score_contributions: number | null
          score_goals: number | null
          score_peer_review: number | null
          score_projects: number | null
          scoring_completed: boolean | null
          staff_bu: string | null
          staff_id: string | null
          staff_name: string | null
          staff_position: string | null
          staff_team: string | null
          total_score: number | null
          updated_date: string | null
          version: number | null
        }
        Insert: {
          annual_review_id?: string | null
          base44_id?: string | null
          boss_feedback?: string | null
          created_by_id?: string | null
          created_date?: string | null
          fiscal_year?: string | null
          id?: never
          is_final?: boolean | null
          pdf_url?: string | null
          report_content?: string | null
          score_attendance?: number | null
          score_challenges?: number | null
          score_contributions?: number | null
          score_goals?: number | null
          score_peer_review?: number | null
          score_projects?: number | null
          scoring_completed?: boolean | null
          staff_bu?: string | null
          staff_id?: string | null
          staff_name?: string | null
          staff_position?: string | null
          staff_team?: string | null
          total_score?: number | null
          updated_date?: string | null
          version?: number | null
        }
        Update: {
          annual_review_id?: string | null
          base44_id?: string | null
          boss_feedback?: string | null
          created_by_id?: string | null
          created_date?: string | null
          fiscal_year?: string | null
          id?: never
          is_final?: boolean | null
          pdf_url?: string | null
          report_content?: string | null
          score_attendance?: number | null
          score_challenges?: number | null
          score_contributions?: number | null
          score_goals?: number | null
          score_peer_review?: number | null
          score_projects?: number | null
          scoring_completed?: boolean | null
          staff_bu?: string | null
          staff_id?: string | null
          staff_name?: string | null
          staff_position?: string | null
          staff_team?: string | null
          total_score?: number | null
          updated_date?: string | null
          version?: number | null
        }
        Relationships: []
      }
      assessment_arrangement: {
        Row: {
          course_id: string | null
          created_date: string | null
          duration_minutes: number | null
          exam_date: string | null
          id: string
          notes: string | null
          pass_score: number | null
          score: number | null
          status: string | null
          student_email: string | null
          student_name: string | null
          title: string | null
        }
        Insert: {
          course_id?: string | null
          created_date?: string | null
          duration_minutes?: number | null
          exam_date?: string | null
          id?: string
          notes?: string | null
          pass_score?: number | null
          score?: number | null
          status?: string | null
          student_email?: string | null
          student_name?: string | null
          title?: string | null
        }
        Update: {
          course_id?: string | null
          created_date?: string | null
          duration_minutes?: number | null
          exam_date?: string | null
          id?: string
          notes?: string | null
          pass_score?: number | null
          score?: number | null
          status?: string | null
          student_email?: string | null
          student_name?: string | null
          title?: string | null
        }
        Relationships: []
      }
      assessment_result: {
        Row: {
          answers: Json | null
          assessment_id: string | null
          assessment_type: string | null
          base44_id: string | null
          bu_name: string | null
          course_code: string | null
          course_id: string | null
          course_name: string | null
          created_by_id: string | null
          created_date: string | null
          exam_date: string | null
          grade: string | null
          id: number
          metadata: Json | null
          office: string | null
          pass_score: number | null
          primary_exam_date: string | null
          primary_exam_score: number | null
          score: number | null
          staff_id: string | null
          staff_name: string | null
          status: string | null
          student_email: string | null
          student_name: string | null
          student_staff_id: string | null
          team: string | null
          title: string | null
          updated_date: string | null
        }
        Insert: {
          answers?: Json | null
          assessment_id?: string | null
          assessment_type?: string | null
          base44_id?: string | null
          bu_name?: string | null
          course_code?: string | null
          course_id?: string | null
          course_name?: string | null
          created_by_id?: string | null
          created_date?: string | null
          exam_date?: string | null
          grade?: string | null
          id?: number
          metadata?: Json | null
          office?: string | null
          pass_score?: number | null
          primary_exam_date?: string | null
          primary_exam_score?: number | null
          score?: number | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string | null
          student_email?: string | null
          student_name?: string | null
          student_staff_id?: string | null
          team?: string | null
          title?: string | null
          updated_date?: string | null
        }
        Update: {
          answers?: Json | null
          assessment_id?: string | null
          assessment_type?: string | null
          base44_id?: string | null
          bu_name?: string | null
          course_code?: string | null
          course_id?: string | null
          course_name?: string | null
          created_by_id?: string | null
          created_date?: string | null
          exam_date?: string | null
          grade?: string | null
          id?: number
          metadata?: Json | null
          office?: string | null
          pass_score?: number | null
          primary_exam_date?: string | null
          primary_exam_score?: number | null
          score?: number | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string | null
          student_email?: string | null
          student_name?: string | null
          student_staff_id?: string | null
          team?: string | null
          title?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          attended: boolean | null
          check_in_time: string | null
          created_at: string | null
          event_id: string | null
          id: string
          marked_by: string | null
          notes: string | null
          registration_id: string | null
          section_id: string | null
        }
        Insert: {
          attended?: boolean | null
          check_in_time?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          marked_by?: string | null
          notes?: string | null
          registration_id?: string | null
          section_id?: string | null
        }
        Update: {
          attended?: boolean | null
          check_in_time?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          marked_by?: string | null
          notes?: string | null
          registration_id?: string | null
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "event_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      bubble_clockin: {
        Row: {
          accuracy_in: number | null
          accuracy_out: number | null
          base44_id: string | null
          bubble_id: string | null
          clock_out_time: string | null
          clockin_time: string | null
          created_by_id: string | null
          created_date: string | null
          dingding_in_attendance_id: string | null
          dingding_out_attendance_id: string | null
          face_image_file_url_in: string | null
          face_image_file_url_out: string | null
          face_image_in_url: string | null
          face_image_out_url: string | null
          geo_location_in: string | null
          geo_location_out: string | null
          google_location_in: string | null
          google_location_out: string | null
          id: number
          late_minutes: number | null
          ot_minutes: number | null
          photo_approval_in: string | null
          photo_approval_out: string | null
          prove_in_url: string | null
          prove_out_url: string | null
          reason_for_no_clock: string | null
          remarks_in: string | null
          remarks_out: string | null
          request_update_end_location: string | null
          request_update_end_time: string | null
          request_update_start_location: string | null
          request_update_start_time: string | null
          staff_id: string | null
          staff_name: string | null
          status_in: string | null
          status_out: string | null
          tags_in: Json | null
          tags_out: Json | null
          updated_date: string | null
          work_location_in: string | null
          work_location_out: string | null
        }
        Insert: {
          accuracy_in?: number | null
          accuracy_out?: number | null
          base44_id?: string | null
          bubble_id?: string | null
          clock_out_time?: string | null
          clockin_time?: string | null
          created_by_id?: string | null
          created_date?: string | null
          dingding_in_attendance_id?: string | null
          dingding_out_attendance_id?: string | null
          face_image_file_url_in?: string | null
          face_image_file_url_out?: string | null
          face_image_in_url?: string | null
          face_image_out_url?: string | null
          geo_location_in?: string | null
          geo_location_out?: string | null
          google_location_in?: string | null
          google_location_out?: string | null
          id?: never
          late_minutes?: number | null
          ot_minutes?: number | null
          photo_approval_in?: string | null
          photo_approval_out?: string | null
          prove_in_url?: string | null
          prove_out_url?: string | null
          reason_for_no_clock?: string | null
          remarks_in?: string | null
          remarks_out?: string | null
          request_update_end_location?: string | null
          request_update_end_time?: string | null
          request_update_start_location?: string | null
          request_update_start_time?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status_in?: string | null
          status_out?: string | null
          tags_in?: Json | null
          tags_out?: Json | null
          updated_date?: string | null
          work_location_in?: string | null
          work_location_out?: string | null
        }
        Update: {
          accuracy_in?: number | null
          accuracy_out?: number | null
          base44_id?: string | null
          bubble_id?: string | null
          clock_out_time?: string | null
          clockin_time?: string | null
          created_by_id?: string | null
          created_date?: string | null
          dingding_in_attendance_id?: string | null
          dingding_out_attendance_id?: string | null
          face_image_file_url_in?: string | null
          face_image_file_url_out?: string | null
          face_image_in_url?: string | null
          face_image_out_url?: string | null
          geo_location_in?: string | null
          geo_location_out?: string | null
          google_location_in?: string | null
          google_location_out?: string | null
          id?: never
          late_minutes?: number | null
          ot_minutes?: number | null
          photo_approval_in?: string | null
          photo_approval_out?: string | null
          prove_in_url?: string | null
          prove_out_url?: string | null
          reason_for_no_clock?: string | null
          remarks_in?: string | null
          remarks_out?: string | null
          request_update_end_location?: string | null
          request_update_end_time?: string | null
          request_update_start_location?: string | null
          request_update_start_time?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status_in?: string | null
          status_out?: string | null
          tags_in?: Json | null
          tags_out?: Json | null
          updated_date?: string | null
          work_location_in?: string | null
          work_location_out?: string | null
        }
        Relationships: []
      }
      bubble_leave: {
        Row: {
          application_reason: string | null
          approved: string | null
          approver_email: string | null
          approver_id: string | null
          approver_name: string | null
          base44_id: string | null
          bubble_id: string | null
          count_year: string | null
          created_by_id: string | null
          created_date: string | null
          days: string | null
          delegate_email: string | null
          delegate_name: string | null
          dept: string | null
          display_name: string | null
          end_date_time: string | null
          from_date: string | null
          google_event_id: string | null
          id: number
          info_tech_url: string | null
          interview_email: string | null
          leave_period: string | null
          leave_period_code: string | null
          leave_type: string | null
          leave_type_id: string | null
          prove_url: string | null
          quota: string | null
          reason: string | null
          reject_reason: string | null
          rejecter_id: string | null
          rejecter_name: string | null
          remarks: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          send_approval_email: string | null
          send_email: string | null
          staff_id: string | null
          staff_name: string | null
          start_date_time: string | null
          status: string | null
          time_slot: string | null
          to_date: string | null
          updated_date: string | null
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          application_reason?: string | null
          approved?: string | null
          approver_email?: string | null
          approver_id?: string | null
          approver_name?: string | null
          base44_id?: string | null
          bubble_id?: string | null
          count_year?: string | null
          created_by_id?: string | null
          created_date?: string | null
          days?: string | null
          delegate_email?: string | null
          delegate_name?: string | null
          dept?: string | null
          display_name?: string | null
          end_date_time?: string | null
          from_date?: string | null
          google_event_id?: string | null
          id?: never
          info_tech_url?: string | null
          interview_email?: string | null
          leave_period?: string | null
          leave_period_code?: string | null
          leave_type?: string | null
          leave_type_id?: string | null
          prove_url?: string | null
          quota?: string | null
          reason?: string | null
          reject_reason?: string | null
          rejecter_id?: string | null
          rejecter_name?: string | null
          remarks?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          send_approval_email?: string | null
          send_email?: string | null
          staff_id?: string | null
          staff_name?: string | null
          start_date_time?: string | null
          status?: string | null
          time_slot?: string | null
          to_date?: string | null
          updated_date?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          application_reason?: string | null
          approved?: string | null
          approver_email?: string | null
          approver_id?: string | null
          approver_name?: string | null
          base44_id?: string | null
          bubble_id?: string | null
          count_year?: string | null
          created_by_id?: string | null
          created_date?: string | null
          days?: string | null
          delegate_email?: string | null
          delegate_name?: string | null
          dept?: string | null
          display_name?: string | null
          end_date_time?: string | null
          from_date?: string | null
          google_event_id?: string | null
          id?: never
          info_tech_url?: string | null
          interview_email?: string | null
          leave_period?: string | null
          leave_period_code?: string | null
          leave_type?: string | null
          leave_type_id?: string | null
          prove_url?: string | null
          quota?: string | null
          reason?: string | null
          reject_reason?: string | null
          rejecter_id?: string | null
          rejecter_name?: string | null
          remarks?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          send_approval_email?: string | null
          send_email?: string | null
          staff_id?: string | null
          staff_name?: string | null
          start_date_time?: string | null
          status?: string | null
          time_slot?: string | null
          to_date?: string | null
          updated_date?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      bubble_man_hour_date: {
        Row: {
          base44_id: string | null
          bubble_id: string | null
          created_date: string | null
          id: number
          report_date: string | null
          staff_id: string | null
          staff_name: string | null
          total_work_hour: number | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_id?: string | null
          created_date?: string | null
          id?: never
          report_date?: string | null
          staff_id?: string | null
          staff_name?: string | null
          total_work_hour?: number | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_id?: string | null
          created_date?: string | null
          id?: never
          report_date?: string | null
          staff_id?: string | null
          staff_name?: string | null
          total_work_hour?: number | null
          updated_date?: string | null
        }
        Relationships: []
      }
      bubble_man_hour_task: {
        Row: {
          asana_link: string | null
          base44_id: string | null
          brand_id: string | null
          brand_name: string | null
          bubble_id: string | null
          created_by_id: string | null
          created_date: string | null
          id: number
          images: Json | null
          keywords: string | null
          man_hour_date_id: string | null
          meeting_duration: string | null
          meeting_invite_sent: boolean | null
          meeting_method: string | null
          meeting_participants: Json | null
          meeting_request_date: string | null
          meeting_topic: string | null
          output_count: number | null
          output_unit: string | null
          project_id: string | null
          project_name: string | null
          projects: Json | null
          task_description: string | null
          task_id: string | null
          task_name: string | null
          task_type_id: string | null
          task_type_name: string | null
          updated_date: string | null
          work_hour: number | null
          work_location: string | null
        }
        Insert: {
          asana_link?: string | null
          base44_id?: string | null
          brand_id?: string | null
          brand_name?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          images?: Json | null
          keywords?: string | null
          man_hour_date_id?: string | null
          meeting_duration?: string | null
          meeting_invite_sent?: boolean | null
          meeting_method?: string | null
          meeting_participants?: Json | null
          meeting_request_date?: string | null
          meeting_topic?: string | null
          output_count?: number | null
          output_unit?: string | null
          project_id?: string | null
          project_name?: string | null
          projects?: Json | null
          task_description?: string | null
          task_id?: string | null
          task_name?: string | null
          task_type_id?: string | null
          task_type_name?: string | null
          updated_date?: string | null
          work_hour?: number | null
          work_location?: string | null
        }
        Update: {
          asana_link?: string | null
          base44_id?: string | null
          brand_id?: string | null
          brand_name?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          images?: Json | null
          keywords?: string | null
          man_hour_date_id?: string | null
          meeting_duration?: string | null
          meeting_invite_sent?: boolean | null
          meeting_method?: string | null
          meeting_participants?: Json | null
          meeting_request_date?: string | null
          meeting_topic?: string | null
          output_count?: number | null
          output_unit?: string | null
          project_id?: string | null
          project_name?: string | null
          projects?: Json | null
          task_description?: string | null
          task_id?: string | null
          task_name?: string | null
          task_type_id?: string | null
          task_type_name?: string | null
          updated_date?: string | null
          work_hour?: number | null
          work_location?: string | null
        }
        Relationships: []
      }
      bubble_merits_demerits: {
        Row: {
          base44_id: string | null
          brief_description: string | null
          bubble_created_by: string | null
          bubble_created_date: string | null
          bubble_id: string | null
          bubble_modified_date: string | null
          created_by_id: string | null
          created_date: string | null
          detailed_description: string | null
          event_date: string | null
          event_view_role: string | null
          id: number
          staff_id: string | null
          staff_name: string | null
          type: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          brief_description?: string | null
          bubble_created_by?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          created_by_id?: string | null
          created_date?: string | null
          detailed_description?: string | null
          event_date?: string | null
          event_view_role?: string | null
          id?: never
          staff_id?: string | null
          staff_name?: string | null
          type?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          brief_description?: string | null
          bubble_created_by?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          created_by_id?: string | null
          created_date?: string | null
          detailed_description?: string | null
          event_date?: string | null
          event_view_role?: string | null
          id?: never
          staff_id?: string | null
          staff_name?: string | null
          type?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      bubble_ot: {
        Row: {
          base44_id: string | null
          bubble_id: string | null
          clockin_id: string | null
          created_by_id: string | null
          created_date: string | null
          end_date_time: string | null
          event_name: string | null
          id: number
          is_interview: boolean | null
          ot_hour: number | null
          ot_type: string | null
          reject_reason: string | null
          remarks: string | null
          staff_id: string | null
          staff_name: string | null
          start_date_time: string | null
          status: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_id?: string | null
          clockin_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          end_date_time?: string | null
          event_name?: string | null
          id?: never
          is_interview?: boolean | null
          ot_hour?: number | null
          ot_type?: string | null
          reject_reason?: string | null
          remarks?: string | null
          staff_id?: string | null
          staff_name?: string | null
          start_date_time?: string | null
          status?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_id?: string | null
          clockin_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          end_date_time?: string | null
          event_name?: string | null
          id?: never
          is_interview?: boolean | null
          ot_hour?: number | null
          ot_type?: string | null
          reject_reason?: string | null
          remarks?: string | null
          staff_id?: string | null
          staff_name?: string | null
          start_date_time?: string | null
          status?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      bubble_project: {
        Row: {
          asana_link: string | null
          base44_id: string | null
          brands: Json | null
          bubble_api_id: string | null
          bubble_id: string | null
          collaborators: Json | null
          created_by_id: string | null
          created_date: string | null
          display_name: string | null
          estimated_expense: number | null
          estimated_income: number | null
          estimated_man_hour: number | null
          id: number
          is_key_project: boolean | null
          locations: Json | null
          outcome: string | null
          pic_id: string | null
          pic_name: string | null
          project_timeline: string | null
          roles: Json | null
          started_date: string | null
          status: string | null
          sub_projects: Json | null
          task_types: Json | null
          teams: Json | null
          updated_date: string | null
        }
        Insert: {
          asana_link?: string | null
          base44_id?: string | null
          brands?: Json | null
          bubble_api_id?: string | null
          bubble_id?: string | null
          collaborators?: Json | null
          created_by_id?: string | null
          created_date?: string | null
          display_name?: string | null
          estimated_expense?: number | null
          estimated_income?: number | null
          estimated_man_hour?: number | null
          id?: never
          is_key_project?: boolean | null
          locations?: Json | null
          outcome?: string | null
          pic_id?: string | null
          pic_name?: string | null
          project_timeline?: string | null
          roles?: Json | null
          started_date?: string | null
          status?: string | null
          sub_projects?: Json | null
          task_types?: Json | null
          teams?: Json | null
          updated_date?: string | null
        }
        Update: {
          asana_link?: string | null
          base44_id?: string | null
          brands?: Json | null
          bubble_api_id?: string | null
          bubble_id?: string | null
          collaborators?: Json | null
          created_by_id?: string | null
          created_date?: string | null
          display_name?: string | null
          estimated_expense?: number | null
          estimated_income?: number | null
          estimated_man_hour?: number | null
          id?: never
          is_key_project?: boolean | null
          locations?: Json | null
          outcome?: string | null
          pic_id?: string | null
          pic_name?: string | null
          project_timeline?: string | null
          roles?: Json | null
          started_date?: string | null
          status?: string | null
          sub_projects?: Json | null
          task_types?: Json | null
          teams?: Json | null
          updated_date?: string | null
        }
        Relationships: []
      }
      bubble_staff_kpi: {
        Row: {
          asana_link: string | null
          base44_id: string | null
          box_folder: string | null
          breakthrough_description: string | null
          bubble_id: string | null
          created_by_id: string | null
          created_date: string | null
          id: number
          improve_description: string | null
          key_achievement: string | null
          kpi_sales: number | null
          leader_comment: string | null
          leader_suggest_score: number | null
          project_id: string | null
          project_name: string | null
          related_file_url: string | null
          score: number | null
          self_score: number | null
          staff_kpi_month_id: string | null
          updated_date: string | null
        }
        Insert: {
          asana_link?: string | null
          base44_id?: string | null
          box_folder?: string | null
          breakthrough_description?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          improve_description?: string | null
          key_achievement?: string | null
          kpi_sales?: number | null
          leader_comment?: string | null
          leader_suggest_score?: number | null
          project_id?: string | null
          project_name?: string | null
          related_file_url?: string | null
          score?: number | null
          self_score?: number | null
          staff_kpi_month_id?: string | null
          updated_date?: string | null
        }
        Update: {
          asana_link?: string | null
          base44_id?: string | null
          box_folder?: string | null
          breakthrough_description?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          improve_description?: string | null
          key_achievement?: string | null
          kpi_sales?: number | null
          leader_comment?: string | null
          leader_suggest_score?: number | null
          project_id?: string | null
          project_name?: string | null
          related_file_url?: string | null
          score?: number | null
          self_score?: number | null
          staff_kpi_month_id?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      bubble_staff_kpimonth: {
        Row: {
          base44_id: string | null
          bubble_id: string | null
          company_comment: string | null
          company_point: number | null
          created_by_id: string | null
          created_date: string | null
          id: number
          report_month: string | null
          staff_id: string | null
          staff_name: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_id?: string | null
          company_comment?: string | null
          company_point?: number | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          report_month?: string | null
          staff_id?: string | null
          staff_name?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_id?: string | null
          company_comment?: string | null
          company_point?: number | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          report_month?: string | null
          staff_id?: string | null
          staff_name?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      check_in_record: {
        Row: {
          accuracy: number | null
          created_date: string | null
          date: string | null
          distance_from_office: number | null
          id: string
          latitude: number | null
          location_valid: boolean | null
          longitude: number | null
          time: string | null
          type: string | null
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          accuracy?: number | null
          created_date?: string | null
          date?: string | null
          distance_from_office?: number | null
          id?: string
          latitude?: number | null
          location_valid?: boolean | null
          longitude?: number | null
          time?: string | null
          type?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          accuracy?: number | null
          created_date?: string | null
          date?: string | null
          distance_from_office?: number | null
          id?: string
          latitude?: number | null
          location_valid?: boolean | null
          longitude?: number | null
          time?: string | null
          type?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      company_app: {
        Row: {
          auto_renew: boolean | null
          card_last4: string | null
          category: string | null
          contact_person: string | null
          created_date: string | null
          departments: string[] | null
          description: string | null
          expiry_date: string | null
          icon_url: string | null
          id: string
          learning_resources: Json | null
          login_account: string | null
          login_note: string | null
          login_url: string | null
          monthly_cost: number | null
          name: string | null
          platform: string[] | null
          status: string | null
          subscription_plan: string | null
          workflows: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          card_last4?: string | null
          category?: string | null
          contact_person?: string | null
          created_date?: string | null
          departments?: string[] | null
          description?: string | null
          expiry_date?: string | null
          icon_url?: string | null
          id?: string
          learning_resources?: Json | null
          login_account?: string | null
          login_note?: string | null
          login_url?: string | null
          monthly_cost?: number | null
          name?: string | null
          platform?: string[] | null
          status?: string | null
          subscription_plan?: string | null
          workflows?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          card_last4?: string | null
          category?: string | null
          contact_person?: string | null
          created_date?: string | null
          departments?: string[] | null
          description?: string | null
          expiry_date?: string | null
          icon_url?: string | null
          id?: string
          learning_resources?: Json | null
          login_account?: string | null
          login_note?: string | null
          login_url?: string | null
          monthly_cost?: number | null
          name?: string | null
          platform?: string[] | null
          status?: string | null
          subscription_plan?: string | null
          workflows?: string | null
        }
        Relationships: []
      }
      company_event: {
        Row: {
          base44_id: string | null
          color: string | null
          created_by_id: string | null
          created_date: string | null
          description: string | null
          end_date: string | null
          event_date: string | null
          event_type: string | null
          id: number
          is_active: boolean | null
          location: string | null
          metadata: Json | null
          organizer: string | null
          region: string | null
          region_codes: string[] | null
          start_date: string | null
          status: string | null
          time_range: string | null
          title: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          color?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: number
          is_active?: boolean | null
          location?: string | null
          metadata?: Json | null
          organizer?: string | null
          region?: string | null
          region_codes?: string[] | null
          start_date?: string | null
          status?: string | null
          time_range?: string | null
          title?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          color?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          end_date?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: number
          is_active?: boolean | null
          location?: string | null
          metadata?: Json | null
          organizer?: string | null
          region?: string | null
          region_codes?: string[] | null
          start_date?: string | null
          status?: string | null
          time_range?: string | null
          title?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      company_form: {
        Row: {
          category: string | null
          created_date: string | null
          description: string | null
          file_size: string | null
          file_url: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          region_codes: string[] | null
          sort_order: number | null
          title: string | null
        }
        Insert: {
          category?: string | null
          created_date?: string | null
          description?: string | null
          file_size?: string | null
          file_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          region_codes?: string[] | null
          sort_order?: number | null
          title?: string | null
        }
        Update: {
          category?: string | null
          created_date?: string | null
          description?: string | null
          file_size?: string | null
          file_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          region_codes?: string[] | null
          sort_order?: number | null
          title?: string | null
        }
        Relationships: []
      }
      company_news: {
        Row: {
          author: string | null
          category: string | null
          created_date: string | null
          id: number
          image: string | null
          is_active: boolean | null
          is_featured: boolean | null
          region_code: string | null
          sort_order: number | null
          time_label: string | null
          title: string
          urgent: boolean | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_date?: string | null
          id?: number
          image?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          region_code?: string | null
          sort_order?: number | null
          time_label?: string | null
          title: string
          urgent?: boolean | null
        }
        Update: {
          author?: string | null
          category?: string | null
          created_date?: string | null
          id?: number
          image?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          region_code?: string | null
          sort_order?: number | null
          time_label?: string | null
          title?: string
          urgent?: boolean | null
        }
        Relationships: []
      }
      contribution_type: {
        Row: {
          base44_id: string | null
          created_by_id: string | null
          created_date: string | null
          description: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          name: string | null
          sort_order: number | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          icon?: string | null
          id?: never
          is_active?: boolean | null
          name?: string | null
          sort_order?: number | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          icon?: string | null
          id?: never
          is_active?: boolean | null
          name?: string | null
          sort_order?: number | null
          updated_date?: string | null
        }
        Relationships: []
      }
      course: {
        Row: {
          base44_id: string | null
          category_id: string | null
          category_name: string | null
          code: string | null
          cover_image: string | null
          created_by_id: string | null
          created_by_name: string | null
          created_date: string | null
          description: string | null
          difficulty: number | null
          duration_hours: number | null
          has_assessment: boolean | null
          id: number
          instructors: Json | null
          learning_method: string | null
          objectives: Json | null
          passing_score: number | null
          prerequisites: string | null
          service_units: Json | null
          status: string | null
          tags: Json | null
          target_audience: string | null
          title: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          category_id?: string | null
          category_name?: string | null
          code?: string | null
          cover_image?: string | null
          created_by_id?: string | null
          created_by_name?: string | null
          created_date?: string | null
          description?: string | null
          difficulty?: number | null
          duration_hours?: number | null
          has_assessment?: boolean | null
          id?: never
          instructors?: Json | null
          learning_method?: string | null
          objectives?: Json | null
          passing_score?: number | null
          prerequisites?: string | null
          service_units?: Json | null
          status?: string | null
          tags?: Json | null
          target_audience?: string | null
          title?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          category_id?: string | null
          category_name?: string | null
          code?: string | null
          cover_image?: string | null
          created_by_id?: string | null
          created_by_name?: string | null
          created_date?: string | null
          description?: string | null
          difficulty?: number | null
          duration_hours?: number | null
          has_assessment?: boolean | null
          id?: never
          instructors?: Json | null
          learning_method?: string | null
          objectives?: Json | null
          passing_score?: number | null
          prerequisites?: string | null
          service_units?: Json | null
          status?: string | null
          tags?: Json | null
          target_audience?: string | null
          title?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      course_category: {
        Row: {
          base44_id: string | null
          color: string | null
          created_by_id: string | null
          created_date: string | null
          description: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          name: string | null
          service_units: Json | null
          sort_order: number | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          color?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          icon?: string | null
          id?: never
          is_active?: boolean | null
          name?: string | null
          service_units?: Json | null
          sort_order?: number | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          color?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          icon?: string | null
          id?: never
          is_active?: boolean | null
          name?: string | null
          service_units?: Json | null
          sort_order?: number | null
          updated_date?: string | null
        }
        Relationships: []
      }
      course_resource: {
        Row: {
          base44_id: string | null
          category: string | null
          content_text: string | null
          course_id: string | null
          course_name: string | null
          created_by_id: string | null
          created_date: string | null
          description: string | null
          difficulty: number | null
          duration_minutes: number | null
          file_url: string | null
          format: string | null
          id: number
          learning_method: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tags: Json | null
          target_dept: Json | null
          target_role: string | null
          title: string | null
          updated_date: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          base44_id?: string | null
          category?: string | null
          content_text?: string | null
          course_id?: string | null
          course_name?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          difficulty?: number | null
          duration_minutes?: number | null
          file_url?: string | null
          format?: string | null
          id?: never
          learning_method?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tags?: Json | null
          target_dept?: Json | null
          target_role?: string | null
          title?: string | null
          updated_date?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          base44_id?: string | null
          category?: string | null
          content_text?: string | null
          course_id?: string | null
          course_name?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          difficulty?: number | null
          duration_minutes?: number | null
          file_url?: string | null
          format?: string | null
          id?: never
          learning_method?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tags?: Json | null
          target_dept?: Json | null
          target_role?: string | null
          title?: string | null
          updated_date?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: []
      }
      event_materials: {
        Row: {
          attachment_url: string | null
          budget: number | null
          created_at: string | null
          event_id: string | null
          id: string
          name: string
          notes: string | null
          quantity: number | null
          responsible_person: string | null
          section_id: string | null
          section_ids: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_url?: string | null
          budget?: number | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          name: string
          notes?: string | null
          quantity?: number | null
          responsible_person?: string | null
          section_id?: string | null
          section_ids?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_url?: string | null
          budget?: number | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          quantity?: number | null
          responsible_person?: string | null
          section_id?: string | null
          section_ids?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_materials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_materials_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "event_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string | null
          followed_by: string | null
          form_data: Json | null
          form_id: string | null
          guest_count: number | null
          guest_names: Json | null
          id: string
          invited_by_staff_id: string | null
          registered_at: string | null
          registration_source: string | null
          registration_status: string | null
          section_id: string | null
          staff_id: string | null
          status: string | null
        }
        Insert: {
          event_id?: string | null
          followed_by?: string | null
          form_data?: Json | null
          form_id?: string | null
          guest_count?: number | null
          guest_names?: Json | null
          id?: string
          invited_by_staff_id?: string | null
          registered_at?: string | null
          registration_source?: string | null
          registration_status?: string | null
          section_id?: string | null
          staff_id?: string | null
          status?: string | null
        }
        Update: {
          event_id?: string | null
          followed_by?: string | null
          form_data?: Json | null
          form_id?: string | null
          guest_count?: number | null
          guest_names?: Json | null
          id?: string
          invited_by_staff_id?: string | null
          registered_at?: string | null
          registration_source?: string | null
          registration_status?: string | null
          section_id?: string | null
          staff_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "registration_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "event_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvp_templates: {
        Row: {
          body: string
          created_at: string | null
          event_id: string | null
          id: string
          is_active: boolean | null
          send_via_email: boolean | null
          send_via_notification: boolean | null
          subject: string | null
          template_type: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          send_via_email?: boolean | null
          send_via_notification?: boolean | null
          subject?: string | null
          template_type: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          send_via_email?: boolean | null
          send_via_notification?: boolean | null
          subject?: string | null
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvp_templates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sections: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          event_id: string | null
          id: string
          location: string | null
          max_capacity: number | null
          name: string
          sort_order: number | null
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_id?: string | null
          id?: string
          location?: string | null
          max_capacity?: number | null
          name: string
          sort_order?: number | null
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_id?: string | null
          id?: string
          location?: string | null
          max_capacity?: number | null
          name?: string
          sort_order?: number | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_duplicate_registration: boolean | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_datetime: string | null
          event_type: string | null
          id: string
          location: string | null
          max_capacity: number | null
          registration_mode: string | null
          requires_seating: boolean | null
          start_datetime: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          allow_duplicate_registration?: boolean | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_datetime?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          max_capacity?: number | null
          registration_mode?: string | null
          requires_seating?: boolean | null
          start_datetime?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          allow_duplicate_registration?: boolean | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_datetime?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          max_capacity?: number | null
          registration_mode?: string | null
          requires_seating?: boolean | null
          start_datetime?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_record: {
        Row: {
          amount: number | null
          category: string | null
          created_date: string | null
          currency: string | null
          expense_date: string | null
          id: string
          notes: string | null
          receipt_url: string | null
          region_code: string | null
          status: string | null
          title: string | null
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_date?: string | null
          currency?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          receipt_url?: string | null
          region_code?: string | null
          status?: string | null
          title?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_date?: string | null
          currency?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          receipt_url?: string | null
          region_code?: string | null
          status?: string | null
          title?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      faq_item: {
        Row: {
          answer: string | null
          category: string | null
          created_date: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          question: string | null
          region_codes: string[] | null
          sort_order: number | null
          tags: string[] | null
        }
        Insert: {
          answer?: string | null
          category?: string | null
          created_date?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          question?: string | null
          region_codes?: string[] | null
          sort_order?: number | null
          tags?: string[] | null
        }
        Update: {
          answer?: string | null
          category?: string | null
          created_date?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          question?: string | null
          region_codes?: string[] | null
          sort_order?: number | null
          tags?: string[] | null
        }
        Relationships: []
      }
      knowledge_item: {
        Row: {
          author_email: string | null
          author_name: string | null
          category: string | null
          content: string | null
          created_date: string | null
          id: string
          image_url: string | null
          region: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewer_email: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          user_email: string | null
          user_name: string | null
          week_start: string | null
        }
        Insert: {
          author_email?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_date?: string | null
          id?: string
          image_url?: string | null
          region?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewer_email?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          user_email?: string | null
          user_name?: string | null
          week_start?: string | null
        }
        Update: {
          author_email?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_date?: string | null
          id?: string
          image_url?: string | null
          region?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewer_email?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          user_email?: string | null
          user_name?: string | null
          week_start?: string | null
        }
        Relationships: []
      }
      leave_balance: {
        Row: {
          created_date: string | null
          dept: string | null
          entitlement: number | null
          id: string
          leave_type_code: string | null
          leave_type_name: string | null
          remaining: number | null
          used: number | null
          user_email: string | null
          user_name: string | null
          year: number | null
        }
        Insert: {
          created_date?: string | null
          dept?: string | null
          entitlement?: number | null
          id?: string
          leave_type_code?: string | null
          leave_type_name?: string | null
          remaining?: number | null
          used?: number | null
          user_email?: string | null
          user_name?: string | null
          year?: number | null
        }
        Update: {
          created_date?: string | null
          dept?: string | null
          entitlement?: number | null
          id?: string
          leave_type_code?: string | null
          leave_type_name?: string | null
          remaining?: number | null
          used?: number | null
          user_email?: string | null
          user_name?: string | null
          year?: number | null
        }
        Relationships: []
      }
      leave_period: {
        Row: {
          bubble_id: string | null
          code: string
          created_date: string | null
          display: string
          eng_display: string
          id: string
          is_active: boolean
          limited_leave_types: string | null
        }
        Insert: {
          bubble_id?: string | null
          code: string
          created_date?: string | null
          display: string
          eng_display: string
          id?: string
          is_active?: boolean
          limited_leave_types?: string | null
        }
        Update: {
          bubble_id?: string | null
          code?: string
          created_date?: string | null
          display?: string
          eng_display?: string
          id?: string
          is_active?: boolean
          limited_leave_types?: string | null
        }
        Relationships: []
      }
      leave_type: {
        Row: {
          base44_id: string | null
          bubble_id: string | null
          code: string | null
          created_by_id: string | null
          created_date: string | null
          default_entitlement: number | null
          full_label: string | null
          id: number
          is_active: boolean | null
          is_paid: boolean | null
          name: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_id?: string | null
          code?: string | null
          created_by_id?: string | null
          created_date?: string | null
          default_entitlement?: number | null
          full_label?: string | null
          id?: never
          is_active?: boolean | null
          is_paid?: boolean | null
          name?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_id?: string | null
          code?: string | null
          created_by_id?: string | null
          created_date?: string | null
          default_entitlement?: number | null
          full_label?: string | null
          id?: never
          is_active?: boolean | null
          is_paid?: boolean | null
          name?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      merit_demerit_type: {
        Row: {
          base44_id: string | null
          category: string | null
          created_by_id: string | null
          created_date: string | null
          id: number
          is_active: boolean | null
          name: string | null
          score_adjustment: number | null
          sort_order: number | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          category?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          name?: string | null
          score_adjustment?: number | null
          sort_order?: number | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          category?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          name?: string | null
          score_adjustment?: number | null
          sort_order?: number | null
          updated_date?: string | null
        }
        Relationships: []
      }
      nosbu: {
        Row: {
          base44_id: string | null
          bubble_id: string | null
          created_by_id: string | null
          created_date: string | null
          description: string | null
          display: string | null
          id: number
          is_active: boolean | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          display?: string | null
          id?: never
          is_active?: boolean | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          display?: string | null
          id?: never
          is_active?: boolean | null
          updated_date?: string | null
        }
        Relationships: []
      }
      nosdistrict: {
        Row: {
          area: string | null
          base44_id: string | null
          bubble_id: string | null
          created_by_id: string | null
          created_date: string | null
          district: string | null
          eng_sub_district: string | null
          id: number
          is_active: boolean | null
          short_form: string | null
          sub_district: string | null
          updated_date: string | null
        }
        Insert: {
          area?: string | null
          base44_id?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          district?: string | null
          eng_sub_district?: string | null
          id?: never
          is_active?: boolean | null
          short_form?: string | null
          sub_district?: string | null
          updated_date?: string | null
        }
        Update: {
          area?: string | null
          base44_id?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          district?: string | null
          eng_sub_district?: string | null
          id?: never
          is_active?: boolean | null
          short_form?: string | null
          sub_district?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      nostask: {
        Row: {
          base44_id: string | null
          bubble_id: string | null
          created_by_id: string | null
          created_date: string | null
          display: string | null
          eng_display: string | null
          id: number
          is_active: boolean | null
          sorting: number | null
          task_type_ids: Json | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          display?: string | null
          eng_display?: string | null
          id?: never
          is_active?: boolean | null
          sorting?: number | null
          task_type_ids?: Json | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          display?: string | null
          eng_display?: string | null
          id?: never
          is_active?: boolean | null
          sorting?: number | null
          task_type_ids?: Json | null
          updated_date?: string | null
        }
        Relationships: []
      }
      nostask_type: {
        Row: {
          base44_id: string | null
          brands: Json | null
          bubble_id: string | null
          created_by_id: string | null
          created_date: string | null
          display: string | null
          eng_display: string | null
          id: number
          is_active: boolean | null
          teams: Json | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          brands?: Json | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          display?: string | null
          eng_display?: string | null
          id?: never
          is_active?: boolean | null
          teams?: Json | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          brands?: Json | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          display?: string | null
          eng_display?: string | null
          id?: never
          is_active?: boolean | null
          teams?: Json | null
          updated_date?: string | null
        }
        Relationships: []
      }
      nosteam: {
        Row: {
          base44_id: string | null
          bu_id: string | null
          bu_name: string | null
          bubble_id: string | null
          created_by_id: string | null
          created_date: string | null
          description: string | null
          display: string | null
          id: number
          is_active: boolean | null
          team_group: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bu_id?: string | null
          bu_name?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          display?: string | null
          id?: never
          is_active?: boolean | null
          team_group?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bu_id?: string | null
          bu_name?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          display?: string | null
          id?: never
          is_active?: boolean | null
          team_group?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      nosteam_role: {
        Row: {
          base44_id: string | null
          bubble_id: string | null
          created_by_id: string | null
          created_date: string | null
          description: string | null
          display: string | null
          id: number
          is_active: boolean | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          display?: string | null
          id?: never
          is_active?: boolean | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          display?: string | null
          id?: never
          is_active?: boolean | null
          updated_date?: string | null
        }
        Relationships: []
      }
      notification: {
        Row: {
          action_taken: string | null
          base44_id: string | null
          created_date: string | null
          days_remaining: number | null
          id: number
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          recipient_email: string | null
          recipient_staff_id: string | null
          ref_id: string | null
          ref_name: string | null
          staff_id: string | null
          title: string | null
          type: string | null
          updated_date: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          base44_id?: string | null
          created_date?: string | null
          days_remaining?: number | null
          id?: number
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          recipient_staff_id?: string | null
          ref_id?: string | null
          ref_name?: string | null
          staff_id?: string | null
          title?: string | null
          type?: string | null
          updated_date?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          base44_id?: string | null
          created_date?: string | null
          days_remaining?: number | null
          id?: number
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          recipient_staff_id?: string | null
          ref_id?: string | null
          ref_name?: string | null
          staff_id?: string | null
          title?: string | null
          type?: string | null
          updated_date?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      page_permissions: {
        Row: {
          allowed: boolean | null
          created_at: string | null
          id: number
          page_path: string
          role: string
          updated_at: string | null
        }
        Insert: {
          allowed?: boolean | null
          created_at?: string | null
          id?: never
          page_path: string
          role: string
          updated_at?: string | null
        }
        Update: {
          allowed?: boolean | null
          created_at?: string | null
          id?: never
          page_path?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      peer_review: {
        Row: {
          base44_id: string | null
          comment: string | null
          created_by_id: string | null
          created_date: string | null
          fiscal_year: string | null
          id: number
          no_collab_approved: string | null
          no_collaboration: boolean | null
          private_note: string | null
          reviewee_name: string | null
          reviewee_staff_id: string | null
          reviewee_team_group: string | null
          reviewer_name: string | null
          reviewer_staff_id: string | null
          reviewer_team_group: string | null
          score_attitude: number | null
          score_company_contribution: number | null
          score_problem_solving: number | null
          score_professionalism: number | null
          score_teamwork: number | null
          status: string | null
          submitted_at: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          comment?: string | null
          created_by_id?: string | null
          created_date?: string | null
          fiscal_year?: string | null
          id?: never
          no_collab_approved?: string | null
          no_collaboration?: boolean | null
          private_note?: string | null
          reviewee_name?: string | null
          reviewee_staff_id?: string | null
          reviewee_team_group?: string | null
          reviewer_name?: string | null
          reviewer_staff_id?: string | null
          reviewer_team_group?: string | null
          score_attitude?: number | null
          score_company_contribution?: number | null
          score_problem_solving?: number | null
          score_professionalism?: number | null
          score_teamwork?: number | null
          status?: string | null
          submitted_at?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          comment?: string | null
          created_by_id?: string | null
          created_date?: string | null
          fiscal_year?: string | null
          id?: never
          no_collab_approved?: string | null
          no_collaboration?: boolean | null
          private_note?: string | null
          reviewee_name?: string | null
          reviewee_staff_id?: string | null
          reviewee_team_group?: string | null
          reviewer_name?: string | null
          reviewer_staff_id?: string | null
          reviewer_team_group?: string | null
          score_attitude?: number | null
          score_company_contribution?: number | null
          score_problem_solving?: number | null
          score_professionalism?: number | null
          score_teamwork?: number | null
          status?: string | null
          submitted_at?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      profile_update_request: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          base44_id: string | null
          created_by_id: string | null
          created_date: string | null
          field_name: string | null
          id: number
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          reason: string | null
          request_status: string | null
          request_type: string | null
          requested_by_email: string | null
          requested_by_name: string | null
          staff_id: string | null
          staff_name: string | null
          status: string | null
          updated_date: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          base44_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          field_name?: string | null
          id?: number
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
          request_status?: string | null
          request_type?: string | null
          requested_by_email?: string | null
          requested_by_name?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string | null
          updated_date?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          base44_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          field_name?: string | null
          id?: number
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
          request_status?: string | null
          request_type?: string | null
          requested_by_email?: string | null
          requested_by_name?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      region: {
        Row: {
          base_locations: Json | null
          base44_id: string | null
          code: string | null
          color: string | null
          created_by_id: string | null
          created_date: string | null
          currency: string | null
          full_name: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          lunch_end: string | null
          lunch_start: string | null
          name: string | null
          office_address: string | null
          sat_training_end: string | null
          sort_order: number | null
          timezone: string | null
          updated_date: string | null
          work_end: string | null
          work_start: string | null
        }
        Insert: {
          base_locations?: Json | null
          base44_id?: string | null
          code?: string | null
          color?: string | null
          created_by_id?: string | null
          created_date?: string | null
          currency?: string | null
          full_name?: string | null
          icon?: string | null
          id?: never
          is_active?: boolean | null
          lunch_end?: string | null
          lunch_start?: string | null
          name?: string | null
          office_address?: string | null
          sat_training_end?: string | null
          sort_order?: number | null
          timezone?: string | null
          updated_date?: string | null
          work_end?: string | null
          work_start?: string | null
        }
        Update: {
          base_locations?: Json | null
          base44_id?: string | null
          code?: string | null
          color?: string | null
          created_by_id?: string | null
          created_date?: string | null
          currency?: string | null
          full_name?: string | null
          icon?: string | null
          id?: never
          is_active?: boolean | null
          lunch_end?: string | null
          lunch_start?: string | null
          name?: string | null
          office_address?: string | null
          sat_training_end?: string | null
          sort_order?: number | null
          timezone?: string | null
          updated_date?: string | null
          work_end?: string | null
          work_start?: string | null
        }
        Relationships: []
      }
      registration_forms: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string | null
          fields_config: Json | null
          id: string
          is_active: boolean | null
          max_guests_per_registration: number | null
          section_ids: Json | null
          section_selection_mode: string | null
          show_inviter_field: boolean | null
          slug: string | null
          staff_filter_teams: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          fields_config?: Json | null
          id?: string
          is_active?: boolean | null
          max_guests_per_registration?: number | null
          section_ids?: Json | null
          section_selection_mode?: string | null
          show_inviter_field?: boolean | null
          slug?: string | null
          staff_filter_teams?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          fields_config?: Json | null
          id?: string
          is_active?: boolean | null
          max_guests_per_registration?: number | null
          section_ids?: Json | null
          section_selection_mode?: string | null
          show_inviter_field?: boolean | null
          slug?: string | null
          staff_filter_teams?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_forms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_item: {
        Row: {
          borrow_method: string | null
          category: string | null
          created_date: string | null
          id: number
          image: string | null
          is_active: boolean | null
          location: string | null
          name: string
          region_code: string | null
          return_method: string | null
          sort_order: number | null
          stock: number | null
          usage_type: string | null
          user_scope: string | null
          value: string | null
        }
        Insert: {
          borrow_method?: string | null
          category?: string | null
          created_date?: string | null
          id?: number
          image?: string | null
          is_active?: boolean | null
          location?: string | null
          name: string
          region_code?: string | null
          return_method?: string | null
          sort_order?: number | null
          stock?: number | null
          usage_type?: string | null
          user_scope?: string | null
          value?: string | null
        }
        Update: {
          borrow_method?: string | null
          category?: string | null
          created_date?: string | null
          id?: number
          image?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string
          region_code?: string | null
          return_method?: string | null
          sort_order?: number | null
          stock?: number | null
          usage_type?: string | null
          user_scope?: string | null
          value?: string | null
        }
        Relationships: []
      }
      review_preset: {
        Row: {
          base44_id: string | null
          category: string | null
          created_by_id: string | null
          created_date: string | null
          id: number
          is_active: boolean | null
          label: string | null
          sort_order: number | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          category?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          label?: string | null
          sort_order?: number | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          category?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          label?: string | null
          sort_order?: number | null
          updated_date?: string | null
        }
        Relationships: []
      }
      score_level: {
        Row: {
          base44_id: string | null
          created_by_id: string | null
          created_date: string | null
          description: string | null
          id: number
          is_active: boolean | null
          label: string | null
          score: number | null
          sort_order: number | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          id?: never
          is_active?: boolean | null
          label?: string | null
          score?: number | null
          sort_order?: number | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          description?: string | null
          id?: never
          is_active?: boolean | null
          label?: string | null
          score?: number | null
          sort_order?: number | null
          updated_date?: string | null
        }
        Relationships: []
      }
      seating_arrangements: {
        Row: {
          created_at: string | null
          event_id: string | null
          guest_index: number | null
          id: string
          registration_id: string | null
          seat_number: string | null
          section_id: string | null
          table_number: string | null
          updated_at: string | null
          zone: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          guest_index?: number | null
          id?: string
          registration_id?: string | null
          seat_number?: string | null
          section_id?: string | null
          table_number?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          guest_index?: number | null
          id?: string
          registration_id?: string | null
          seat_number?: string | null
          section_id?: string | null
          table_number?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seating_arrangements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_arrangements_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seating_arrangements_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "event_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          al_quota: number | null
          base_location: string | null
          base44_id: string | null
          birthday: string | null
          brands: Json | null
          bu_name: string | null
          bubble_created_date: string | null
          bubble_id: string | null
          bubble_modified_date: string | null
          business_email: string | null
          chinese_name: string | null
          clock_in_face: string | null
          clock_in_face_amazon_id: string | null
          clock_in_face_amazon_id_2: string | null
          created_by_id: string | null
          created_date: string | null
          dingding_dept_id: string | null
          dingding_user_id: string | null
          direct_phone: number | null
          display_name: string | null
          entry_date: string | null
          full_name: string | null
          hotline: string | null
          id: number
          leave_quota_remain: number | null
          linked_user_email: string | null
          login_mobile: string | null
          login_password: string | null
          n_bu: string | null
          n_team: string | null
          n_team_role: string | null
          new_direct_phone: Json | null
          new_work_phone: string | null
          no_clockin: boolean | null
          no_man_hour_task: boolean | null
          o_base_location: string | null
          o_probation: string | null
          o_status: string | null
          o_status_text: string | null
          o_user_role: string | null
          other_phone: Json | null
          position: string | null
          private_email: string | null
          private_phone: number | null
          profile_pic: string | null
          staff_region: string | null
          team_group: string | null
          team_leader: string | null
          team_leader_name: string | null
          team_name: string | null
          team_role_name: string | null
          termination_date: string | null
          updated_date: string | null
          voov_id: number | null
          work_email: string | null
          work_phone: number | null
        }
        Insert: {
          al_quota?: number | null
          base_location?: string | null
          base44_id?: string | null
          birthday?: string | null
          brands?: Json | null
          bu_name?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          business_email?: string | null
          chinese_name?: string | null
          clock_in_face?: string | null
          clock_in_face_amazon_id?: string | null
          clock_in_face_amazon_id_2?: string | null
          created_by_id?: string | null
          created_date?: string | null
          dingding_dept_id?: string | null
          dingding_user_id?: string | null
          direct_phone?: number | null
          display_name?: string | null
          entry_date?: string | null
          full_name?: string | null
          hotline?: string | null
          id?: never
          leave_quota_remain?: number | null
          linked_user_email?: string | null
          login_mobile?: string | null
          login_password?: string | null
          n_bu?: string | null
          n_team?: string | null
          n_team_role?: string | null
          new_direct_phone?: Json | null
          new_work_phone?: string | null
          no_clockin?: boolean | null
          no_man_hour_task?: boolean | null
          o_base_location?: string | null
          o_probation?: string | null
          o_status?: string | null
          o_status_text?: string | null
          o_user_role?: string | null
          other_phone?: Json | null
          position?: string | null
          private_email?: string | null
          private_phone?: number | null
          profile_pic?: string | null
          staff_region?: string | null
          team_group?: string | null
          team_leader?: string | null
          team_leader_name?: string | null
          team_name?: string | null
          team_role_name?: string | null
          termination_date?: string | null
          updated_date?: string | null
          voov_id?: number | null
          work_email?: string | null
          work_phone?: number | null
        }
        Update: {
          al_quota?: number | null
          base_location?: string | null
          base44_id?: string | null
          birthday?: string | null
          brands?: Json | null
          bu_name?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          business_email?: string | null
          chinese_name?: string | null
          clock_in_face?: string | null
          clock_in_face_amazon_id?: string | null
          clock_in_face_amazon_id_2?: string | null
          created_by_id?: string | null
          created_date?: string | null
          dingding_dept_id?: string | null
          dingding_user_id?: string | null
          direct_phone?: number | null
          display_name?: string | null
          entry_date?: string | null
          full_name?: string | null
          hotline?: string | null
          id?: never
          leave_quota_remain?: number | null
          linked_user_email?: string | null
          login_mobile?: string | null
          login_password?: string | null
          n_bu?: string | null
          n_team?: string | null
          n_team_role?: string | null
          new_direct_phone?: Json | null
          new_work_phone?: string | null
          no_clockin?: boolean | null
          no_man_hour_task?: boolean | null
          o_base_location?: string | null
          o_probation?: string | null
          o_status?: string | null
          o_status_text?: string | null
          o_user_role?: string | null
          other_phone?: Json | null
          position?: string | null
          private_email?: string | null
          private_phone?: number | null
          profile_pic?: string | null
          staff_region?: string | null
          team_group?: string | null
          team_leader?: string | null
          team_leader_name?: string | null
          team_name?: string | null
          team_role_name?: string | null
          termination_date?: string | null
          updated_date?: string | null
          voov_id?: number | null
          work_email?: string | null
          work_phone?: number | null
        }
        Relationships: []
      }
      staff_contact_person: {
        Row: {
          base44_id: string | null
          bubble_created_date: string | null
          bubble_id: string | null
          bubble_modified_date: string | null
          created_by_id: string | null
          created_date: string | null
          id: number
          is_active: boolean | null
          person_name: string | null
          phone: string | null
          relationship: string | null
          staff_bubble_id: string | null
          staff_information_id: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          person_name?: string | null
          phone?: string | null
          relationship?: string | null
          staff_bubble_id?: string | null
          staff_information_id?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          person_name?: string | null
          phone?: string | null
          relationship?: string | null
          staff_bubble_id?: string | null
          staff_information_id?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      staff_education: {
        Row: {
          base44_id: string | null
          bubble_created_date: string | null
          bubble_id: string | null
          bubble_modified_date: string | null
          created_by_id: string | null
          created_date: string | null
          education_background: string | null
          graduation_end_date: string | null
          graduation_major: string | null
          graduation_school: string | null
          graduation_start_date: string | null
          id: number
          is_active: boolean | null
          is_arts: boolean | null
          is_business: boolean | null
          is_other: boolean | null
          is_part_time: boolean | null
          is_science: boolean | null
          is_unfinished: boolean | null
          other_subjects: string | null
          prove_url: string | null
          staff_bubble_id: string | null
          staff_information_id: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          created_by_id?: string | null
          created_date?: string | null
          education_background?: string | null
          graduation_end_date?: string | null
          graduation_major?: string | null
          graduation_school?: string | null
          graduation_start_date?: string | null
          id?: never
          is_active?: boolean | null
          is_arts?: boolean | null
          is_business?: boolean | null
          is_other?: boolean | null
          is_part_time?: boolean | null
          is_science?: boolean | null
          is_unfinished?: boolean | null
          other_subjects?: string | null
          prove_url?: string | null
          staff_bubble_id?: string | null
          staff_information_id?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          created_by_id?: string | null
          created_date?: string | null
          education_background?: string | null
          graduation_end_date?: string | null
          graduation_major?: string | null
          graduation_school?: string | null
          graduation_start_date?: string | null
          id?: never
          is_active?: boolean | null
          is_arts?: boolean | null
          is_business?: boolean | null
          is_other?: boolean | null
          is_part_time?: boolean | null
          is_science?: boolean | null
          is_unfinished?: boolean | null
          other_subjects?: string | null
          prove_url?: string | null
          staff_bubble_id?: string | null
          staff_information_id?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      staff_information: {
        Row: {
          bank_card_name: string | null
          bank_card_owner: string | null
          base44_id: string | null
          birthday: string | null
          bubble_created_date: string | null
          bubble_id: string | null
          bubble_modified_date: string | null
          chinese_mailing_address: string | null
          chinese_name: string | null
          commuting_time: string | null
          created_by_id: string | null
          created_date: string | null
          email1: string | null
          email2: string | null
          english_mailing_address: string | null
          english_name: string | null
          id: number
          identity_card_number: string | null
          is_active: boolean | null
          is_smoking: boolean | null
          mainland_travel_permit_number: string | null
          marital_status: string | null
          native_place: string | null
          new_bank_card_number: string | null
          nickname: string | null
          no_working_experience: boolean | null
          phone: string | null
          residential_area: string | null
          residential_telephone: string | null
          staff_id: string | null
          staff_name: string | null
          staff_record_id: string | null
          updated_date: string | null
        }
        Insert: {
          bank_card_name?: string | null
          bank_card_owner?: string | null
          base44_id?: string | null
          birthday?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          chinese_mailing_address?: string | null
          chinese_name?: string | null
          commuting_time?: string | null
          created_by_id?: string | null
          created_date?: string | null
          email1?: string | null
          email2?: string | null
          english_mailing_address?: string | null
          english_name?: string | null
          id?: never
          identity_card_number?: string | null
          is_active?: boolean | null
          is_smoking?: boolean | null
          mainland_travel_permit_number?: string | null
          marital_status?: string | null
          native_place?: string | null
          new_bank_card_number?: string | null
          nickname?: string | null
          no_working_experience?: boolean | null
          phone?: string | null
          residential_area?: string | null
          residential_telephone?: string | null
          staff_id?: string | null
          staff_name?: string | null
          staff_record_id?: string | null
          updated_date?: string | null
        }
        Update: {
          bank_card_name?: string | null
          bank_card_owner?: string | null
          base44_id?: string | null
          birthday?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          chinese_mailing_address?: string | null
          chinese_name?: string | null
          commuting_time?: string | null
          created_by_id?: string | null
          created_date?: string | null
          email1?: string | null
          email2?: string | null
          english_mailing_address?: string | null
          english_name?: string | null
          id?: never
          identity_card_number?: string | null
          is_active?: boolean | null
          is_smoking?: boolean | null
          mainland_travel_permit_number?: string | null
          marital_status?: string | null
          native_place?: string | null
          new_bank_card_number?: string | null
          nickname?: string | null
          no_working_experience?: boolean | null
          phone?: string | null
          residential_area?: string | null
          residential_telephone?: string | null
          staff_id?: string | null
          staff_name?: string | null
          staff_record_id?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      staff_qaanswer: {
        Row: {
          answer_text: string | null
          base44_id: string | null
          bubble_created_by: string | null
          bubble_created_date: string | null
          bubble_id: string | null
          bubble_modified_date: string | null
          created_by_id: string | null
          created_date: string | null
          id: number
          is_active: boolean | null
          option_point: number | null
          question_id: string | null
          staff_id: string | null
          updated_date: string | null
        }
        Insert: {
          answer_text?: string | null
          base44_id?: string | null
          bubble_created_by?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          option_point?: number | null
          question_id?: string | null
          staff_id?: string | null
          updated_date?: string | null
        }
        Update: {
          answer_text?: string | null
          base44_id?: string | null
          bubble_created_by?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          option_point?: number | null
          question_id?: string | null
          staff_id?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      staff_qacategory: {
        Row: {
          base44_id: string | null
          bubble_created_by: string | null
          bubble_created_date: string | null
          bubble_id: string | null
          bubble_modified_date: string | null
          bubble_modifier: string | null
          created_by_id: string | null
          created_date: string | null
          display: string | null
          id: number
          is_active: boolean | null
          type: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_created_by?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          bubble_modifier?: string | null
          created_by_id?: string | null
          created_date?: string | null
          display?: string | null
          id?: never
          is_active?: boolean | null
          type?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_created_by?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          bubble_modifier?: string | null
          created_by_id?: string | null
          created_date?: string | null
          display?: string | null
          id?: never
          is_active?: boolean | null
          type?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      staff_qaquestion: {
        Row: {
          base44_id: string | null
          bubble_created_by: string | null
          bubble_created_date: string | null
          bubble_id: string | null
          bubble_modified_date: string | null
          bubble_modifier: string | null
          category_id: string | null
          created_by_id: string | null
          created_date: string | null
          id: number
          is_active: boolean | null
          is_option: boolean | null
          is_required: boolean | null
          option_1: string | null
          option_2: string | null
          option_3: string | null
          option_4: string | null
          placeholder: string | null
          question: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_created_by?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          bubble_modifier?: string | null
          category_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          is_option?: boolean | null
          is_required?: boolean | null
          option_1?: string | null
          option_2?: string | null
          option_3?: string | null
          option_4?: string | null
          placeholder?: string | null
          question?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_created_by?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          bubble_modifier?: string | null
          category_id?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          is_option?: boolean | null
          is_required?: boolean | null
          option_1?: string | null
          option_2?: string | null
          option_3?: string | null
          option_4?: string | null
          placeholder?: string | null
          question?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      staff_work_experience: {
        Row: {
          base44_id: string | null
          bubble_created_date: string | null
          bubble_id: string | null
          bubble_modified_date: string | null
          company_name: string | null
          created_by_id: string | null
          created_date: string | null
          id: number
          is_active: boolean | null
          job_end_date: string | null
          job_start_date: string | null
          job_title: string | null
          prove_url: string | null
          staff_bubble_id: string | null
          staff_information_id: string | null
          updated_date: string | null
        }
        Insert: {
          base44_id?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          company_name?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          job_end_date?: string | null
          job_start_date?: string | null
          job_title?: string | null
          prove_url?: string | null
          staff_bubble_id?: string | null
          staff_information_id?: string | null
          updated_date?: string | null
        }
        Update: {
          base44_id?: string | null
          bubble_created_date?: string | null
          bubble_id?: string | null
          bubble_modified_date?: string | null
          company_name?: string | null
          created_by_id?: string | null
          created_date?: string | null
          id?: never
          is_active?: boolean | null
          job_end_date?: string | null
          job_start_date?: string | null
          job_title?: string | null
          prove_url?: string | null
          staff_bubble_id?: string | null
          staff_information_id?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      sync_progress: {
        Row: {
          created_at: string | null
          entity_name: string
          id: string
          last_synced_at: string | null
          status: string | null
          table_name: string | null
          total_errors: number | null
          total_fetched: number | null
          total_upserted: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_name: string
          id?: string
          last_synced_at?: string | null
          status?: string | null
          table_name?: string | null
          total_errors?: number | null
          total_fetched?: number | null
          total_upserted?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_name?: string
          id?: string
          last_synced_at?: string | null
          status?: string | null
          table_name?: string | null
          total_errors?: number | null
          total_fetched?: number | null
          total_upserted?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tech_news: {
        Row: {
          category: string | null
          created_date: string | null
          hot: boolean | null
          id: number
          image: string | null
          is_active: boolean | null
          is_featured: boolean | null
          sort_order: number | null
          source: string | null
          time_label: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_date?: string | null
          hot?: boolean | null
          id?: number
          image?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          sort_order?: number | null
          source?: string | null
          time_label?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_date?: string | null
          hot?: boolean | null
          id?: number
          image?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          sort_order?: number | null
          source?: string | null
          time_label?: string | null
          title?: string
        }
        Relationships: []
      }
      tender_registration: {
        Row: {
          amount: number | null
          base44_id: string | null
          client: string | null
          created_by_id: string | null
          created_date: string | null
          deadline: string | null
          id: number
          metadata: Json | null
          notes: string | null
          project_name: string | null
          project_number: string | null
          region: string | null
          staff_id: string | null
          staff_name: string | null
          status: string | null
          tender_date: string | null
          updated_date: string | null
        }
        Insert: {
          amount?: number | null
          base44_id?: string | null
          client?: string | null
          created_by_id?: string | null
          created_date?: string | null
          deadline?: string | null
          id?: number
          metadata?: Json | null
          notes?: string | null
          project_name?: string | null
          project_number?: string | null
          region?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string | null
          tender_date?: string | null
          updated_date?: string | null
        }
        Update: {
          amount?: number | null
          base44_id?: string | null
          client?: string | null
          created_by_id?: string | null
          created_date?: string | null
          deadline?: string | null
          id?: number
          metadata?: Json | null
          notes?: string | null
          project_name?: string | null
          project_number?: string | null
          region?: string | null
          staff_id?: string | null
          staff_name?: string | null
          status?: string | null
          tender_date?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      user: {
        Row: {
          account_status: string | null
          created_date: string | null
          department: string | null
          email: string | null
          employment_status: string | null
          full_name: string | null
          id: number
          linked_staff_id: string | null
          password_hint: string | null
          role: string | null
        }
        Insert: {
          account_status?: string | null
          created_date?: string | null
          department?: string | null
          email?: string | null
          employment_status?: string | null
          full_name?: string | null
          id?: never
          linked_staff_id?: string | null
          password_hint?: string | null
          role?: string | null
        }
        Update: {
          account_status?: string | null
          created_date?: string | null
          department?: string | null
          email?: string | null
          employment_status?: string | null
          full_name?: string | null
          id?: never
          linked_staff_id?: string | null
          password_hint?: string | null
          role?: string | null
        }
        Relationships: []
      }
      user_page_overrides: {
        Row: {
          allowed: boolean | null
          created_at: string | null
          id: number
          page_path: string
          updated_at: string | null
          user_email: string | null
          user_id: number
        }
        Insert: {
          allowed?: boolean | null
          created_at?: string | null
          id?: never
          page_path: string
          updated_at?: string | null
          user_email?: string | null
          user_id: number
        }
        Update: {
          allowed?: boolean | null
          created_at?: string | null
          id?: never
          page_path?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      exec_sql: { Args: { query: string }; Returns: Json }
      import_bubble_leaves: { Args: { records: Json }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
