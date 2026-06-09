import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Bubble entity → Bubble type name mapping
const BUBBLE_TYPE_MAP: Record<string, string> = {
  Staff: "Staff",
  StaffInformation: "Staff Information",
  BubbleOT: "OT",
  BubbleLeave: "Leave",
  BubbleLeaveQuota: "leavequota",
  BubbleClockin: "Clock-in",
  BubbleManHourDate: "Man Hour Date",
  BubbleManHourTask: "Man Hour Task",
  BubbleProject: "Project",
  BubbleStaffKPI: "Staff KPI",
  BubbleStaffKPIMonth: "Staff KPI Month",
};

// Entity → Supabase table name
const TABLE_MAP: Record<string, string> = {
  Staff: "staff",
  StaffInformation: "staff_information",
  BubbleOT: "bubble_ot",
  BubbleLeave: "bubble_leave",
  BubbleLeaveQuota: "bubble_leave_quota",
  BubbleClockin: "bubble_clockin",
  BubbleManHourDate: "bubble_man_hour_date",
  BubbleManHourTask: "bubble_man_hour_task",
  BubbleProject: "bubble_project",
  BubbleStaffKPI: "bubble_staff_kpi",
  BubbleStaffKPIMonth: "bubble_staff_kpimonth",
};

// Field mapping: Bubble API key → DB column name (per entity)
const IMPORT_FIELD_MAPS: Record<string, Record<string, string>> = {
  Staff: {
    "_id": "bubble_id",
    "al_quota_number": "al_quota", "AL Quota": "al_quota",
    "birthday_date": "birthday", "Birthday": "birthday",
    "brands_list_text": "brands", "Brands": "brands", "brands": "brands",
    "business_email_text": "business_email", "Business Email": "business_email",
    "clock_in_face_image": "clock_in_face", "Clock In Face": "clock_in_face",
    "clock_in_face_amazon_id_text": "clock_in_face_amazon_id", "Clock In Face amazon ID": "clock_in_face_amazon_id",
    "clock_in_face_amazon_id_2_text": "clock_in_face_amazon_id_2", "Clock In Face amazon ID 2": "clock_in_face_amazon_id_2",
    "dingding_dept_id_text": "dingding_dept_id", "DingDing Dept Id": "dingding_dept_id",
    "dingding_user_id_text": "dingding_user_id", "DingDing User Id": "dingding_user_id",
    "direct_phone_text": "direct_phone", "Direct Phone": "direct_phone",
    "display_text": "display_name", "Display Name": "display_name",
    "entry_date_date": "entry_date", "Entry Date": "entry_date",
    "full_name_text": "full_name", "Full Name": "full_name",
    "hotline_text": "hotline", "Hotline": "hotline",
    "new_direct_phone_text": "new_direct_phone", "New Direct Phone": "new_direct_phone",
    "new_work_phone_text": "new_work_phone", "New Work Phone": "new_work_phone",
    "no_clockin_boolean": "no_clockin", "No Clockin": "no_clockin",
    "no_man_hour_task_boolean": "no_man_hour_task", "No Man Hour Task": "no_man_hour_task",
    "position_text": "position", "Position": "position",
    "private_email_text": "private_email", "Private Email": "private_email",
    "private_phone_text": "private_phone", "Private Phone": "private_phone",
    "profile_pic_image": "profile_pic", "Profile Pic": "profile_pic",
    "termination_date_date": "termination_date", "Termination Date": "termination_date",
    "voov_id_text": "voov_id", "Voov ID": "voov_id",
    "work_email_text": "work_email", "Work Email": "work_email",
    "work_phone_text": "work_phone", "Work Phone": "work_phone",
    "o_base_location_option_o_base_location": "base_location", "O_Base Location": "base_location",
    "o_probation_option_o_probation": "o_probation", "O_Probation": "o_probation",
    "o_status_option_o_staff_status": "o_status", "O_Status": "o_status",
    "o_status_text_text": "o_status_text", "O_Status_Text": "o_status_text", "O_Status Text": "o_status_text",
    "o_user_role_option_os_user_role": "o_user_role", "O_User Role": "o_user_role",
    "n_bu_custom_nos_bu": "n_bu", "N_BU": "n_bu",
    "n_team_custom_nos_team": "n_team", "N_Team": "n_team",
    "n_team_role_custom_nos_team_role": "n_team_role", "N_Team Role": "n_team_role",
    "team_leader_custom_staff": "team_leader", "Team Leader": "team_leader",
    "chinese_name_text": "chinese_name", "Chinese Name": "chinese_name",
  },
  BubbleOT: {
    "_id": "bubble_id",
    "remarks_text": "remarks", "Remarks": "remarks",
    "ot_hour_number": "ot_hour", "OT Hour": "ot_hour",
    "event_name_text": "event_name", "Event Name": "event_name",
    "reject_reason_text": "reject_reason", "Reject Reason": "reject_reason",
    "staff_custom_staff": "staff_id", "Staff": "staff_id",
    "end_date__time_date": "end_date_time", "End Date& Time": "end_date_time",
    "is_interview_boolean": "is_interview", "Is Interview": "is_interview",
    "start_date__time_date": "start_date_time", "Start Date& Time": "start_date_time",
    "r_clcok_in_custom_clockin": "clockin_id", "R_Clcok-in": "clockin_id",
    "n_ot_type_custom_nos_ot_type": "ot_type", "N_OT Type": "ot_type",
    "status_option_os_approval_status": "status", "Status": "status",
  },
  BubbleLeave: {
    "_id": "bubble_id",
    "prove_image": "prove_url", "Prove": "prove_url", "prove": "prove_url",
    "remarks_text": "remarks", "Remarks": "remarks",
    "_quota_number": "quota", "-Quota": "quota", "quota_number": "quota",
    "count_year_date": "count_year", "Count Year": "count_year",
    "info_tech_image": "info_tech_url", "info-tech_image": "info_tech_url", "Info-Tech": "info_tech_url", "Info Tech": "info_tech_url",
    "info_tech": "info_tech_url", "info-tech": "info_tech_url", "Info-tech": "info_tech_url",
    "info_tech_file": "info_tech_url", "info-tech_file": "info_tech_url",
    "approved_boolean": "approved", "Approved": "approved",
    "display_text": "display_name", "Display Name": "display_name",
    "reject_reason_text": "reject_reason", "Reject Reason": "reject_reason", "Reject reason": "reject_reason",
    "reject reason_text": "reject_reason", "reject_reason": "reject_reason",
    "staff_custom_staff": "staff_id", "Staff": "staff_id",
    "end_date___time_date": "end_date_time", "End Date & Time": "end_date_time",
    "approver_custom_staff": "approver_id", "Approver": "approver_id", "approver_custom_Staff": "approver_id", "approver": "approver_id",
    "rejecter_custom_staff": "rejecter_id", "Rejecter": "rejecter_id", "rejecter_custom_Staff": "rejecter_id",
    "rejecter": "rejecter_id", "Rejecter_custom_staff": "rejecter_id",
    "start_date___time_date": "start_date_time", "Start Date & Time": "start_date_time",
    "application_reason_text": "application_reason", "Application Reason": "application_reason", "Reason for Apply": "application_reason", "reason_for_apply_text": "application_reason",
    "n_leave_type_custom_nos_leave_type": "leave_type", "N_Leave Type": "leave_type",
    "n_leave_period_option_os_leave_period": "leave_period", "N_Leave Period": "leave_period",
  },
  BubbleClockin: {
    "_id": "bubble_id",
    "prove___out_image": "prove_out_url", "Prove - Out": "prove_out_url",
    "remarks_text": "remarks_in", "Remarks": "remarks_in", "Remarks - In": "remarks_in",
    "face_image___in_image": "face_image_in_url", "Face Image - In": "face_image_in_url",
    "prove___in_image": "prove_in_url", "Prove - In": "prove_in_url",
    "clock_in_time_date": "clockin_time", "Clock In Time": "clockin_time",
    "ot_minutes_approved_number": "ot_minutes", "OT Minutes Approved": "ot_minutes", "OT minutes approved": "ot_minutes", "ot_minutes_number": "ot_minutes",
    "remarks___out_text": "remarks_out", "Remarks - Out": "remarks_out",
    "staff_custom_staff": "staff_id", "Staff": "staff_id",
    "clock_out_time_date": "clock_out_time", "Clock Out Time": "clock_out_time",
    "late_minutes_number": "late_minutes", "Late Minutes": "late_minutes", "Late minutes": "late_minutes",
    "accuracy___in_number": "accuracy_in", "Accuracy - In": "accuracy_in",
    "accuracy___out_number": "accuracy_out", "Accuracy - Out": "accuracy_out",
    "face_image___out_image": "face_image_out_url", "Face Image - Out": "face_image_out_url",
    "face_image_file_url___in_text": "face_image_file_url_in", "Face Image File URL - In": "face_image_file_url_in",
    "reason_for_no_clock_text": "reason_for_no_clock", "Reason for No Clock": "reason_for_no_clock",
    "request_update_end_time_date": "request_update_end_time", "Request Update End Time": "request_update_end_time",
    "face_image_file_url___out_text": "face_image_file_url_out", "Face Image File URL - Out": "face_image_file_url_out",
    "request_update_start_time_date": "request_update_start_time", "Request Update Start Time": "request_update_start_time",
    "geo_location___in_geographic_address": "geo_location_in", "Geo Location - In": "geo_location_in",
    "geo_location___out_geographic_address": "geo_location_out", "Geo Location - Out": "geo_location_out",
    "google_location___in_text": "google_location_in", "Google Location - In": "google_location_in",
    "google_location___out_text": "google_location_out", "Google Location - Out": "google_location_out",
    "o_status___in_option_o_clockin_status": "status_in", "O_Status - In": "status_in",
    "o_status___out_option_o_clockin_status": "status_out", "O_Status - Out": "status_out",
    "tag___in_list_text": "tags_in", "tags___in_list_text": "tags_in", "Tags - in": "tags_in", "Tag - In": "tags_in", "Tags - In": "tags_in",
    "tag___out_list_text": "tags_out", "tags___out_list_text": "tags_out", "Tags - out": "tags_out", "Tag - Out": "tags_out", "Tags - Out": "tags_out",
    "n_work_location_custom_nos_work_location": "work_location_in", "N_Work Location": "work_location_in", "N_Work Location - In": "work_location_in",
    "n_work_location___out_custom_nos_work_location": "work_location_out", "N_Work Location - Out": "work_location_out",
    "o_photo_approval___in_option_o_photo_approval": "photo_approval_in", "O_Photo Approval - In": "photo_approval_in",
    "o_photo_approval___out_option_o_photo_approval": "photo_approval_out", "O_Photo Approval - Out": "photo_approval_out",
    "request_update_end_location_text": "request_update_end_location", "Request Update End Location": "request_update_end_location",
    "request_update_start_location_text": "request_update_start_location", "Request Update Start Location": "request_update_start_location",
    "ding_ding_in_attendance_id_text": "dingding_in_attendance_id", "Ding Ding In Attendance Id": "dingding_in_attendance_id",
    "ding_ding_out_attendance_id_text": "dingding_out_attendance_id", "Ding Ding Out Attendance Id": "dingding_out_attendance_id",
  },
  BubbleManHourDate: {
    "_id": "bubble_id",
    "report_date_date": "report_date", "Report Date": "report_date",
    "staff_custom_staff": "staff_id", "Staff": "staff_id",
    "total_work_hour_number": "total_work_hour", "Total Work Hour": "total_work_hour",
  },
  BubbleManHourTask: {
    "_id": "bubble_id",
    "asana_link_text": "asana_link", "Asana Link": "asana_link",
    "work_hour_number": "work_hour", "Work Hour": "work_hour",
    "images_list_image": "images", "Images": "images",
    "keywords_text": "keywords", "Keywords": "keywords",
    "meeting_topic_text": "meeting_topic", "Meeting Topic": "meeting_topic",
    "output_count_number": "output_count", "Output Count": "output_count",
    "task_description_text": "task_description", "Task Description": "task_description",
    "n_task_custom_nos_task": "task_id", "N_Task": "task_id",
    "project_custom_project": "project_id", "Project": "project_id",
    "n_brand_custom_nos_brand": "brand_id", "N_Brand": "brand_id",
    "meeting_invite_sent_boolean": "meeting_invite_sent",
    "projects_list_custom_project": "projects", "Projects": "projects",
    "n_task_type_custom_nos_task_type": "task_type_id", "N_Task Type": "task_type_id",
    "man_hour_date_custom_man_hour_date": "man_hour_date_id", "Man Hour Date": "man_hour_date_id",
    "meeting_participant_list_custom_staff": "meeting_participants", "Meeting Participant": "meeting_participants",
    "o_meeting_method_option_os_meeting_method": "meeting_method", "O_Meeting Method": "meeting_method",
    "n_output___unit_custom_nos_output___unit": "output_unit", "N_Output & Unit": "output_unit",
    "n_work_location_custom_nos_work_location": "work_location", "N_Work Location": "work_location",
    "o_meeting_duration_option_os_meeting_duration": "meeting_duration", "O_Meeting Duration": "meeting_duration",
    "o_meeting_request_date_option_o_meeting_request_date": "meeting_request_date", "O_Meeting Request Date": "meeting_request_date",
  },
  BubbleProject: {
    "_id": "bubble_id",
    "outcome_text": "outcome", "Outcome": "outcome",
    "asana_link_text": "asana_link", "Asana Link": "asana_link",
    "pic_custom_staff": "pic_id", "PIC": "pic_id",
    "display_text": "display_name", "Display Name": "display_name",
    "start_date_date": "started_date", "Start Date": "started_date",
    "bubble_api_id_text": "bubble_api_id", "Bubble API ID": "bubble_api_id",
    "is_key_project_boolean": "is_key_project", "Is Key Project": "is_key_project",
    "estimated_income_number": "estimated_income", "Estimated Income": "estimated_income",
    "estimated_expense_number": "estimated_expense", "Estimated Expense": "estimated_expense",
    "estimated_man_hour_number": "estimated_man_hour", "Estimated Man Hour": "estimated_man_hour",
    "n_brands_list_custom_nos_brand": "brands", "N_Brands": "brands",
    "collaborator_list_custom_staff": "collaborators", "Collaborator": "collaborators",
    "o_status_option_os_project_status": "status", "O_Status": "status",
    "n_teams_list_custom_nos_team": "teams", "N_Teams": "teams",
    "o_location_list_option_o_base_location": "locations", "O_Location": "locations",
    "limited_to_role_list_custom_nos_team_role": "roles", "Limited to Role": "roles",
    "sub_projects_list_custom_project": "sub_projects", "Sub-Projects": "sub_projects",
    "n_task_types_list_custom_nos_task_type": "task_types", "N_Task Types": "task_types",
    "n_project_timeline_option_os_project_timeline": "project_timeline", "N_Project Timeline": "project_timeline",
  },
  BubbleStaffKPI: {
    "_id": "bubble_id",
    "score_number": "score", "Score": "score",
    "asana_link_text": "asana_link", "Asana Link": "asana_link",
    "kpi_sales_number": "kpi_sales", "KPI Sales": "kpi_sales",
    "related_file_file": "related_file_url", "Related File": "related_file_url",
    "self_point_number": "self_score", "Self Point": "self_score",
    "leader_comment_text": "leader_comment", "Leader Comment": "leader_comment",
    "working_folder_text": "box_folder", "Working Folder": "box_folder",
    "key_achievement_text": "key_achievement", "Key Achievement": "key_achievement",
    "project_custom_project": "project_id", "Project": "project_id",
    "improve_description_text": "improve_description", "Improve Description": "improve_description",
    "leader_suggest_point_number": "leader_suggest_score", "Leader Suggest Point": "leader_suggest_score",
    "breakthrough_description_text": "breakthrough_description", "Breakthrough Description": "breakthrough_description",
    "staff_kpi_month_custom_staff_kpi_month": "staff_kpi_month_id", "Staff KPI Month": "staff_kpi_month_id",
  },
  BubbleStaffKPIMonth: {
    "_id": "bubble_id",
    "report_month_date": "report_month", "Report Month": "report_month",
    "staff_custom_staff": "staff_id", "Staff": "staff_id",
    "company_comment_text": "company_comment", "Company Comment": "company_comment",
    "company_point_number": "company_point", "Company Point": "company_point",
  },
  StaffInformation: {
    "_id": "bubble_id",
    "staff_custom_staff": "staff_id", "Staff": "staff_id",
    "chinese_name_text": "chinese_name", "Chinese Name": "chinese_name",
    "english_name_text": "english_name", "English Name": "english_name",
    "nickname_text": "nickname", "Nickname": "nickname",
    "birthday_date": "birthday", "Birthday": "birthday",
    "phone_text": "phone", "Phone": "phone",
    "residential_telephone_text": "residential_telephone", "Residential Telephone": "residential_telephone",
    "email1_text": "email1", "Email1": "email1",
    "email2_text": "email2", "Email2": "email2",
    "identity_card_number_text": "identity_card_number", "Identity Card Number": "identity_card_number",
    "mainland_travel_permit_number_text": "mainland_travel_permit_number", "Mainland Travel Permit Number": "mainland_travel_permit_number",
    "new_bank_card_number_text": "new_bank_card_number", "New Bank Card Number": "new_bank_card_number",
    "bank_card_name_text": "bank_card_name", "Bank Card Name": "bank_card_name",
    "bank_card_owner_text": "bank_card_owner", "Bank Card Owner": "bank_card_owner",
    "chinese_mailing_address_text": "chinese_mailing_address", "Chinese Mailing Address": "chinese_mailing_address",
    "english_mailing_address_text": "english_mailing_address", "English Mailing Address": "english_mailing_address",
    "native_place_text": "native_place", "Native Place": "native_place",
    "residential_area_text": "residential_area", "Residential Area": "residential_area",
    "marital_status_text": "marital_status", "Marital Status": "marital_status",
    "commuting_time_text": "commuting_time", "Commuting Time": "commuting_time",
    "is_active_boolean": "is_active", "Is Active": "is_active",
    "is_smoking_boolean": "is_smoking", "Is Smoking": "is_smoking",
    "no_working_experience_boolean": "no_working_experience", "No Working Experience": "no_working_experience",
  },
  BubbleLeaveQuota: {
    "_id": "bubble_id",
    "+/- Quota": "plus_minus_quota", "+/_quota_number": "plus_minus_quota", "___quota_number": "plus_minus_quota",
    "____quota_number": "plus_minus_quota", "_____quota_number": "plus_minus_quota",
    "+/-_quota_number": "plus_minus_quota", "quota_number": "plus_minus_quota",
    "Calculation Date": "calculation_date", "calculation_date_date": "calculation_date",
    "Count Year": "count_year", "count_year_date": "count_year",
    "Operator (text)": "operator_text", "operator__text__text": "operator_text", "operator_text_text": "operator_text",
    "operator_(text)_text": "operator_text", "operator___text__text": "operator_text",
    "Reason": "reason", "reason_text": "reason",
    "Staff": "staff_id", "staff_custom_staff": "staff_id",
    "Created Date": "created_date", "Created_Date": "created_date",
    "Modified Date": "modified_date", "Modified_Date": "modified_date",
    "Created By": "created_by", "created_by_custom_user": "created_by",
    "Slug": "slug", "slug_text": "slug",
  },
};

const PAGE_SIZE = 100; // Bubble API max per page
const UPSERT_BATCH = 50;

// Define columns that are NOT TEXT type (NUMERIC, JSONB, etc.) per table
// Values should be kept in their native type for these columns
const NON_TEXT_COLUMNS: Record<string, Set<string>> = {
  bubble_clockin: new Set(["late_minutes", "ot_minutes", "accuracy_in", "accuracy_out", "tags_in", "tags_out"]),
  bubble_man_hour_date: new Set(["total_work_hour"]),
  bubble_man_hour_task: new Set(["work_hour", "output_count", "meeting_invite_sent", "images", "meeting_participants", "projects"]),
  bubble_staff_kpi: new Set(["score", "kpi_sales", "self_score", "leader_suggest_score"]),
  bubble_staff_kpimonth: new Set(["company_point"]),
  bubble_project: new Set(["estimated_expense", "estimated_income", "estimated_man_hour", "is_key_project", "brands", "collaborators", "locations", "roles", "sub_projects", "task_types", "teams"]),
};

// Columns that store a Bubble reference ID (custom_staff, custom_project etc.)
// When Bubble returns an object for these, we should extract _id
const REFERENCE_ID_COLUMNS: Set<string> = new Set([
  "staff_id", "approver_id", "rejecter_id", "clockin_id", "project_id",
  "pic_id", "staff_kpi_month_id", "team_leader", "n_bu", "n_team", "n_team_role",
  "leave_type", "leave_period", "ot_type",
]);

// Serialize a value for DB insertion
// For non-text columns: keep native types (number, array/object for JSONB)
// For text columns: convert everything to string
// For reference ID columns: extract _id from object if Bubble returns object
function serializeValue(val: unknown, dbCol: string, tableName: string): unknown {
  if (val === null || val === undefined) return null;
  
  const isNonText = NON_TEXT_COLUMNS[tableName]?.has(dbCol);
  
  if (typeof val === "string") return val === "" ? null : val;
  if (typeof val === "number") {
    return isNonText ? val : String(val);
  }
  if (typeof val === "boolean") return isNonText ? val : String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    return isNonText ? val : JSON.stringify(val);
  }
  if (typeof val === "object") {
    // For reference ID columns, extract _id from Bubble object
    if (REFERENCE_ID_COLUMNS.has(dbCol)) {
      const obj = val as Record<string, unknown>;
      if (obj._id) return String(obj._id);
      if (obj.unique_id) return String(obj.unique_id);
      // Fallback: stringify
      return JSON.stringify(val);
    }
    return isNonText ? val : JSON.stringify(val);
  }
  return String(val);
}

// Normalize a key: lowercase + replace special chars (hyphens, spaces, +, /, (), &, etc.) with underscores
// Then collapse consecutive underscores into single underscore and trim leading/trailing underscores
// This allows matching Bubble record keys regardless of case, separator style, and special chars
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_") // Replace any non-alphanumeric char(s) with underscore
    .replace(/_+/g, "_")          // Collapse consecutive underscores
    .replace(/^_|_$/g, "");       // Trim leading/trailing underscores
}

// Build a normalized lookup: normalized key → original key in fieldMap
// This allows matching Bubble record keys case-insensitively AND separator-agnostically
function buildNormalizedLookup(fieldMap: Record<string, string>): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const key of Object.keys(fieldMap)) {
    // Store both simple lowercase and fully normalized versions
    lookup.set(key.toLowerCase(), key);
    const normalized = normalizeKey(key);
    if (!lookup.has(normalized)) {
      lookup.set(normalized, key);
    }
  }
  return lookup;
}

// Map a single Bubble record to a DB row
// Sets explicit null for fields in fieldMap that are missing in Bubble record
// This ensures upsert clears stale values
function mapRecord(record: Record<string, unknown>, fieldMap: Record<string, string>, normalizedLookup: Map<string, string>, tableName: string): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  
  // Always map _id to bubble_id
  if (record["_id"]) {
    row["bubble_id"] = String(record["_id"]);
  }

  // Collect all unique DB columns from fieldMap (skip bubble_id)
  const allDbCols = new Set<string>();
  for (const [, dbCol] of Object.entries(fieldMap)) {
    if (dbCol === "bubble_id") continue;
    allDbCols.add(dbCol);
  }

  // Strategy 1: Match fieldMap keys against record (exact match)
  // Prefer non-null values: if a key maps to null but another key maps to a real value, keep the real value
  for (const [bubbleKey, dbCol] of Object.entries(fieldMap)) {
    if (bubbleKey === "_id") continue;
    if (dbCol === "bubble_id") continue;
    if (record[bubbleKey] !== undefined) {
      const serialized = serializeValue(record[bubbleKey], dbCol, tableName);
      // Only overwrite if we don't have a value yet, or if new value is non-null
      if (!(dbCol in row) || (serialized !== null && row[dbCol] === null)) {
        row[dbCol] = serialized;
      }
    }
  }

  // Strategy 2: For record keys NOT yet matched, try normalized lookup in fieldMap
  // This handles cases where Bubble returns keys in different casing or separator style
  for (const [recordKey, recordVal] of Object.entries(record)) {
    if (recordKey.startsWith("_")) continue;
    // Try simple lowercase first
    const lowerKey = recordKey.toLowerCase();
    let matchedFieldMapKey = normalizedLookup.get(lowerKey);
    // If not found, try full normalization (replace hyphens/spaces with underscores)
    if (!matchedFieldMapKey) {
      const normalizedRecordKey = normalizeKey(recordKey);
      matchedFieldMapKey = normalizedLookup.get(normalizedRecordKey);
    }
    if (matchedFieldMapKey) {
      const dbCol = fieldMap[matchedFieldMapKey];
      if (dbCol && dbCol !== "bubble_id") {
        const serialized = serializeValue(recordVal, dbCol, tableName);
        // Allow overriding null values from Strategy 1
        if (!(dbCol in row) || (serialized !== null && row[dbCol] === null)) {
          row[dbCol] = serialized;
        }
      }
    }
  }

  // For any DB column defined in fieldMap but NOT set from the record, explicitly set null
  // This ensures stale values get cleared on upsert
  for (const dbCol of allDbCols) {
    if (!(dbCol in row)) {
      row[dbCol] = null;
    }
  }

  return row;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
    const bubbleApiKey = Deno.env.get("BUBBLE_API_KEY")!;
    const bubbleAppName = Deno.env.get("BUBBLE_APP_NAME")!;

    if (!bubbleApiKey || !bubbleAppName) {
      return new Response(
        JSON.stringify({ error: "Missing BUBBLE_API_KEY or BUBBLE_APP_NAME env vars" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { entityName } = await req.json();

    if (!entityName || !BUBBLE_TYPE_MAP[entityName]) {
      return new Response(
        JSON.stringify({ error: `Unknown entity: ${entityName}. Valid: ${Object.keys(BUBBLE_TYPE_MAP).join(", ")}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const bubbleType = BUBBLE_TYPE_MAP[entityName];
    const tableName = TABLE_MAP[entityName];
    const fieldMap = IMPORT_FIELD_MAPS[entityName];

    if (!tableName || !fieldMap) {
      return new Response(
        JSON.stringify({ error: `No table or field mapping for entity: ${entityName}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const normalizedLookup = buildNormalizedLookup(fieldMap);
    console.log(`[syncBubbleTable] Starting sync for ${entityName} → ${tableName}`);

    // Use streaming response to prevent idle timeout
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (msg: string) => {
          controller.enqueue(encoder.encode(msg + "\n"));
        };

        let cursor = 0;
        let totalFetched = 0;
        let totalUpserted = 0;
        let totalErrors = 0;
        let totalDeleted = 0;
        const errors: string[] = [];
        const allBubbleIds: Set<string> = new Set();

        try {
          while (true) {
            const url = `https://${bubbleAppName}.bubbleapps.io/api/1.1/obj/${encodeURIComponent(bubbleType)}?limit=${PAGE_SIZE}&cursor=${cursor}`;
            console.log(`[syncBubbleTable] Fetching cursor=${cursor}...`);
            send(JSON.stringify({ type: "progress", message: `Fetching page at cursor=${cursor}...` }));

            const resp = await fetch(url, {
              headers: { Authorization: `Bearer ${bubbleApiKey}` },
            });

            if (!resp.ok) {
              const errText = await resp.text();
              send(JSON.stringify({ type: "error", message: `Bubble API error: ${resp.status} - ${errText}` }));
              controller.close();
              return;
            }

            const data = await resp.json();
            const results = data.response?.results || [];
            const remaining = data.response?.remaining || 0;

            if (results.length === 0) break;

            // Collect all bubble IDs for orphan deletion later
            for (const record of results) {
              if (record["_id"]) allBubbleIds.add(String(record["_id"]));
            }

            totalFetched += results.length;
            send(JSON.stringify({ type: "progress", message: `Fetched ${results.length} records (total: ${totalFetched}, remaining: ${remaining})` }));

            // On first page, log debug info about field matching
            if (cursor === 0 && results.length > 0) {
              const firstRecord = results[0];
              const bubbleKeys = Object.keys(firstRecord).filter(k => !k.startsWith("_"));
              const fieldMapKeys = Object.keys(fieldMap).filter(k => k !== "_id");
              const matchedKeys = fieldMapKeys.filter(k => firstRecord[k] !== undefined);
              const unmatchedMapKeys = fieldMapKeys.filter(k => firstRecord[k] === undefined);
              const unmatchedBubbleKeys = bubbleKeys.filter(k => !fieldMap[k]);
              
              // Also check case-insensitive matching
              const recordKeysLower = new Map<string, string>();
              for (const k of bubbleKeys) recordKeysLower.set(k.toLowerCase(), k);
              const caseInsensitiveMatched = unmatchedMapKeys.filter(k => recordKeysLower.has(k.toLowerCase()));

              // Show sample of first record values for problematic fields
              const sampleValues: Record<string, unknown> = {};
              const targetFields = ["brands_list_text", "o_status_text_text", "no_man_hour_task_boolean", "new_work_phone_text", "clock_in_face_image"];
              // BubbleLeave specific: check reject/rejecter/info-tech fields
              const leaveTargetFields = ["reject_reason_text", "Reject Reason", "rejecter_custom_staff", "Rejecter", "rejecter_custom_Staff", "info_tech_image", "info-tech_image", "Info-Tech", "info-tech", "info_tech"];
              for (const tf of [...targetFields, ...leaveTargetFields]) {
                if (firstRecord[tf] !== undefined) sampleValues[tf] = firstRecord[tf];
              }
              // Also look for unmatched bubble keys that might contain these
              for (const bk of unmatchedBubbleKeys) {
                const bkLower = bk.toLowerCase();
                if (bkLower.includes("brand") || bkLower.includes("status_text") || bkLower.includes("man_hour") || bkLower.includes("work_phone") || bkLower.includes("clock_in_face") || bkLower.includes("reject") || bkLower.includes("rejecter") || bkLower.includes("info") || bkLower.includes("tech")) {
                  sampleValues[`unmatched:${bk}`] = firstRecord[bk];
                }
              }

              // Also check normalized matching (our Strategy 2)
              const normalizedMatches: Record<string, string> = {};
              for (const bk of unmatchedBubbleKeys) {
                const nk = normalizeKey(bk);
                const matchedKey = normalizedLookup.get(nk);
                if (matchedKey) {
                  normalizedMatches[bk] = `→ ${matchedKey} → ${fieldMap[matchedKey]}`;
                }
              }

              const debugInfo = {
                type: "debug",
                message: `Field matching: ${matchedKeys.length}/${fieldMapKeys.length} map keys found in record. Case-insensitive extra matches: ${caseInsensitiveMatched.length}. Normalized matches: ${Object.keys(normalizedMatches).length}. Unmatched map keys: [${unmatchedMapKeys.slice(0, 30).join(", ")}]. Bubble keys not in map: [${unmatchedBubbleKeys.slice(0, 30).join(", ")}]`,
                sampleBubbleKeys: bubbleKeys,
                matchedCount: matchedKeys.length,
                totalMapKeys: fieldMapKeys.length,
                caseInsensitiveMatched,
                normalizedMatches,
                sampleValues,
                firstRecordSample: Object.fromEntries(Object.entries(firstRecord).filter(([k]) => !k.startsWith("_")).slice(0, 20)),
              };
              console.log(`[syncBubbleTable] Debug:`, JSON.stringify(debugInfo));
              send(JSON.stringify(debugInfo));

              // For BubbleLeave: find a record with reject/rejecter/info-tech data and log all its keys + values
              if (entityName === "BubbleLeave") {
                const allRecordKeys = Object.keys(firstRecord);
                const leaveDebug: Record<string, unknown> = { allKeys: allRecordKeys };
                // Find a record that has rejecter/reject_reason/info-tech value
                for (const rec of results.slice(0, 20)) {
                  const recKeys = Object.keys(rec);
                  const hasRejectData = recKeys.some(k => {
                    const kl = k.toLowerCase();
                    return (kl.includes("reject") || kl.includes("info") || kl.includes("tech")) && rec[k] !== null && rec[k] !== undefined && rec[k] !== "";
                  });
                  if (hasRejectData) {
                    leaveDebug["sampleRecordWithRejectData"] = {};
                    for (const [k, v] of Object.entries(rec)) {
                      const kl = k.toLowerCase();
                      if (kl.includes("reject") || kl.includes("info") || kl.includes("tech") || kl.includes("rejecter")) {
                        (leaveDebug["sampleRecordWithRejectData"] as Record<string, unknown>)[k] = v;
                      }
                    }
                    break;
                  }
                }
                send(JSON.stringify({ type: "debug", message: "[BubbleLeave] Key analysis for reject/rejecter/info-tech fields", ...leaveDebug }));
                console.log(`[syncBubbleTable] BubbleLeave key analysis:`, JSON.stringify(leaveDebug));
              }
            }

            // Map records
            const rows = results.map((record: Record<string, unknown>) => mapRecord(record, fieldMap, normalizedLookup, tableName));
            const validRows = rows.filter((r: Record<string, unknown>) => r.bubble_id);

            if (validRows.length > 0) {
              for (let i = 0; i < validRows.length; i += UPSERT_BATCH) {
                const batch = validRows.slice(i, i + UPSERT_BATCH);
                const { error: upsertErr } = await supabase
                  .from(tableName)
                  .upsert(batch, { onConflict: "bubble_id", ignoreDuplicates: false });

                if (upsertErr) {
                  console.error(`[syncBubbleTable] Upsert error batch ${i}:`, upsertErr.message);
                  totalErrors += batch.length;
                  if (errors.length < 5) {
                    errors.push(`Batch at ${i}: ${upsertErr.message}`);
                  }
                  send(JSON.stringify({ type: "warning", message: `Batch error: ${upsertErr.message}` }));
                } else {
                  totalUpserted += batch.length;
                }
              }
            }

            send(JSON.stringify({ type: "progress", message: `Upserted so far: ${totalUpserted}, errors: ${totalErrors}` }));

            // Check if there are more pages
            if (remaining <= 0) break;
            cursor += results.length;
          }

          console.log(`[syncBubbleTable] Done. Fetched=${totalFetched}, Upserted=${totalUpserted}, Errors=${totalErrors}`);

          // Delete orphan records: DB records whose bubble_id is NOT in Bubble anymore
          if (allBubbleIds.size > 0 && totalErrors === 0) {
            send(JSON.stringify({ type: "progress", message: `Checking for orphan records to delete... (Bubble has ${allBubbleIds.size} records)` }));
            try {
              // Fetch all bubble_ids from DB
              const DB_FETCH_BATCH = 1000;
              let dbBubbleIds: string[] = [];
              let from = 0;
              while (true) {
                const { data: rows, error: fetchErr } = await supabase
                  .from(tableName)
                  .select("bubble_id")
                  .range(from, from + DB_FETCH_BATCH - 1);
                if (fetchErr) {
                  send(JSON.stringify({ type: "warning", message: `Error fetching DB IDs: ${fetchErr.message}` }));
                  break;
                }
                if (!rows || rows.length === 0) break;
                dbBubbleIds = dbBubbleIds.concat(rows.map((r: { bubble_id: string }) => r.bubble_id));
                if (rows.length < DB_FETCH_BATCH) break;
                from += DB_FETCH_BATCH;
              }

              // Find orphans: in DB but not in Bubble
              const orphanIds = dbBubbleIds.filter(id => !allBubbleIds.has(id));
              
              if (orphanIds.length > 0) {
                send(JSON.stringify({ type: "progress", message: `Found ${orphanIds.length} orphan records to delete (DB: ${dbBubbleIds.length}, Bubble: ${allBubbleIds.size})` }));
                
                // Delete in batches
                const DELETE_BATCH = 100;
                for (let i = 0; i < orphanIds.length; i += DELETE_BATCH) {
                  const batch = orphanIds.slice(i, i + DELETE_BATCH);
                  const { error: delErr } = await supabase
                    .from(tableName)
                    .delete()
                    .in("bubble_id", batch);
                  if (delErr) {
                    send(JSON.stringify({ type: "warning", message: `Delete batch error: ${delErr.message}` }));
                    if (errors.length < 5) errors.push(`Delete batch at ${i}: ${delErr.message}`);
                  } else {
                    totalDeleted += batch.length;
                  }
                }
                send(JSON.stringify({ type: "progress", message: `Deleted ${totalDeleted} orphan records successfully.` }));
              } else {
                send(JSON.stringify({ type: "progress", message: `No orphan records found. DB and Bubble are in sync (${dbBubbleIds.length} records).` }));
              }
            } catch (delError) {
              console.error("[syncBubbleTable] Orphan deletion error:", delError);
              send(JSON.stringify({ type: "warning", message: `Orphan deletion error: ${delError.message}` }));
            }
          } else if (totalErrors > 0) {
            send(JSON.stringify({ type: "warning", message: "Skipping orphan deletion because there were sync errors." }));
          }

          // Post-sync: resolve data lookups for BubbleLeave
          if (entityName === "BubbleLeave") {
            send(JSON.stringify({ type: "progress", message: "Resolving data lookups (staff_name, leave_type, leave_period, status)..." }));
            try {
              // 1. Resolve staff_name from staff table
              await supabase.rpc("exec_sql", { query: `
                UPDATE bubble_leave bl SET staff_name = s.display_name
                FROM staff s WHERE bl.staff_id = s.bubble_id
                AND (bl.staff_name IS NULL OR bl.staff_name = '')
              `});

              // 2. Resolve leave_type: if it stores a Bubble ID, map to full_label
              await supabase.rpc("exec_sql", { query: `
                UPDATE bubble_leave bl SET leave_type = lt.full_label
                FROM leave_type lt WHERE bl.leave_type = lt.bubble_id
                AND lt.full_label IS NOT NULL
              `});

              // 3. Resolve leave_type_id (code) from leave_type table
              await supabase.rpc("exec_sql", { query: `
                UPDATE bubble_leave bl SET leave_type_id = lt.code
                FROM leave_type lt WHERE bl.leave_type = lt.full_label
                AND lt.code IS NOT NULL AND (bl.leave_type_id IS NULL OR bl.leave_type_id LIKE '17%')
              `});

              // 4. Resolve leave_period_code from leave_period table
              await supabase.rpc("exec_sql", { query: `
                UPDATE bubble_leave bl SET leave_period_code = lp.code, leave_period = lp.display
                FROM leave_period lp WHERE bl.leave_period = lp.bubble_id AND lp.code IS NOT NULL
              `});

              // 5. Fix records where leave_period stores the code directly
              await supabase.rpc("exec_sql", { query: `
                UPDATE bubble_leave SET leave_period_code = leave_period
                WHERE leave_period IN ('AM', 'PM', 'FD', 'NA', 'CL')
                AND (leave_period_code IS NULL OR leave_period_code = '')
              `});

              // 6. Derive status from approved field
              await supabase.rpc("exec_sql", { query: `
                UPDATE bubble_leave SET status = CASE
                  WHEN approved = 'true' THEN '已批核'
                  WHEN approved = 'false' THEN '不批核'
                  ELSE '審查中'
                END
                WHERE (status IS NULL OR status = '') AND approved IS NOT NULL
              `});

              // 7. Resolve approver_name from staff table
              await supabase.rpc("exec_sql", { query: `
                UPDATE bubble_leave bl SET approver_name = s.display_name
                FROM staff s WHERE bl.approver_id = s.bubble_id
                AND (bl.approver_name IS NULL OR bl.approver_name = '')
              `});

              send(JSON.stringify({ type: "progress", message: "Data lookups resolved successfully." }));
            } catch (lookupErr) {
              console.warn("[syncBubbleTable] Lookup resolution error:", lookupErr);
              send(JSON.stringify({ type: "warning", message: `Lookup resolution error: ${lookupErr.message}` }));
            }
          }

          // Post-sync: resolve data lookups for BubbleLeaveQuota
          if (entityName === "BubbleLeaveQuota") {
            send(JSON.stringify({ type: "progress", message: "Resolving data lookups (staff_name)..." }));
            try {
              await supabase.rpc("exec_sql", { query: `
                UPDATE bubble_leave_quota blq SET staff_name = s.display_name
                FROM staff s WHERE blq.staff_id = s.bubble_id
                AND (blq.staff_name IS NULL OR blq.staff_name = '')
              `});
              send(JSON.stringify({ type: "progress", message: "Data lookups resolved successfully." }));
            } catch (lookupErr) {
              console.warn("[syncBubbleTable] LeaveQuota lookup error:", lookupErr);
              send(JSON.stringify({ type: "warning", message: `Lookup resolution error: ${lookupErr.message}` }));
            }
          }

          // Update sync_progress table
          try {
            await supabase.from("sync_progress").upsert({
              entity_name: entityName,
              table_name: tableName,
              last_synced_at: new Date().toISOString(),
              total_fetched: totalFetched,
              total_upserted: totalUpserted,
              total_deleted: totalDeleted,
              total_errors: totalErrors,
              status: totalErrors === 0 ? "success" : "partial",
            }, { onConflict: "entity_name" });
          } catch (e) {
            console.warn("[syncBubbleTable] Failed to update sync_progress:", e);
          }

          send(JSON.stringify({
            type: "done",
            data: {
              entityName,
              tableName,
              totalFetched,
              totalUpserted,
              totalDeleted,
              totalErrors,
              errors: errors.slice(0, 5),
            },
          }));
        } catch (err) {
          console.error("[syncBubbleTable] Stream error:", err);
          send(JSON.stringify({ type: "error", message: err.message }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
      status: 200,
    });
  } catch (error) {
    console.error("[syncBubbleTable] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
