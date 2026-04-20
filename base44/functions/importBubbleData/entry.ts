import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Mapping from Bubble API field keys to our DB field names
const FIELD_MAPS = {
  Staff: {
    "_id": "bubble_id",
    "al_quota_number": "al_quota",
    "birthday_date": "birthday",
    "brands_list_text": "brands",
    "business_email_text": "business_email",
    "clock_in_face_image": "clock_in_face",
    "clock_in_face_amazon_id_text": "clock_in_face_amazon_id",
    "clock_in_face_amazon_id_2_text": "clock_in_face_amazon_id_2",
    "dingding_dept_id_text": "dingding_dept_id",
    "dingding_user_id_text": "dingding_user_id",
    "direct_phone_text": "direct_phone",
    "display_text": "display_name",
    "entry_date_date": "entry_date",
    "full_name_text": "full_name",
    "hotline_text": "hotline",
    "new_direct_phone_text": "new_direct_phone",
    "new_work_phone_text": "new_work_phone",
    "no_clockin_boolean": "no_clockin",
    "no_man_hour_task_boolean": "no_man_hour_task",
    "position_text": "position",
    "private_email_text": "private_email",
    "private_phone_text": "private_phone",
    "profile_pic_image": "profile_pic",
    "termination_date_date": "termination_date",
    "voov_id_text": "voov_id",
    "work_email_text": "work_email",
    "work_phone_text": "work_phone",
    "o_base_location_option_o_base_location": "base_location",
    "o_probation_option_o_probation": "o_probation",
    "o_status_option_o_staff_status": "o_status",
    "o_status_text_text": "o_status_text",
    "o_user_role_option_os_user_role": "o_user_role",
    "n_bu_custom_nos_bu": "n_bu",
    "n_team_custom_nos_team": "n_team",
    "n_team_role_custom_nos_team_role": "n_team_role",
    "team_leader_custom_staff": "team_leader",
    "chinese_name_text": "chinese_name",
  },
  BubbleOT: {
    "_id": "bubble_id",
    "remarks_text": "remarks",
    "ot_hour_number": "ot_hour",
    "event_name_text": "event_name",
    "reject_reason_text": "reject_reason",
    "staff_custom_staff": "staff_id",
    "end_date__time_date": "end_date_time",
    "is_interview_boolean": "is_interview",
    "start_date__time_date": "start_date_time",
    "r_clcok_in_custom_clockin": "clockin_id",
    "n_ot_type_custom_nos_ot_type": "ot_type",
    "status_option_os_approval_status": "status",
  },
  BubbleLeave: {
    "_id": "bubble_id",
    "prove_image": "prove_url",
    "remarks_text": "remarks",
    "_quota_number": "quota",
    "count_year_date": "count_year",
    "info_tech_image": "info_tech_url",
    "approved_boolean": "approved",
    "display_text": "display_name",
    "reject_reason_text": "reject_reason",
    "send_email_boolean": "send_email",
    "staff_custom_staff": "staff_id",
    "end_date___time_date": "end_date_time",
    "google_event_id_text": "google_event_id",
    "approver_custom_staff": "approver_id",
    "rejecter_custom_staff": "rejecter_id",
    "start_date___time_date": "start_date_time",
    "application_reason_text": "application_reason",
    "interview_email_boolean": "interview_email",
    "send_approval_email_boolean": "send_approval_email",
    "n_leave_type_custom_nos_leave_type": "leave_type",
    "n_leave_period_option_os_leave_period": "leave_period",
  },
  BubbleClockin: {
    "_id": "bubble_id",
    "prove___out_image": "prove_out_url",
    "remarks_text": "remarks_in",
    "face_image___in_image": "face_image_in_url",
    "prove___in_image": "prove_in_url",
    "clock_in_time_date": "clockin_time",
    "ot_minutes_approved_number": "ot_minutes",
    "remarks___out_text": "remarks_out",
    "staff_custom_staff": "staff_id",
    "clock_out_time_date": "clock_out_time",
    "late_minutes_number": "late_minutes",
    "accuracy___in_number": "accuracy_in",
    "accuracy___out_number": "accuracy_out",
    "face_image___out_image": "face_image_out_url",
    "face_image_file_url___in_text": "face_image_file_url_in",
    "reason_for_no_clock_text": "reason_for_no_clock",
    "request_update_end_time_date": "request_update_end_time",
    "face_image_file_url___out_text": "face_image_file_url_out",
    "request_update_start_time_date": "request_update_start_time",
    "geo_location___in_geographic_address": "geo_location_in",
    "geo_location___out_geographic_address": "geo_location_out",
    "google_location___in_text": "google_location_in",
    "google_location___out_text": "google_location_out",
    "o_status___in_option_o_clockin_status": "status_in",
    "o_status___out_option_o_clockin_status": "status_out",
    "tag___in_list_text": "tags_in",
    "tag___out_list_text": "tags_out",
    "n_work_location_custom_nos_work_location": "work_location_in",
    "n_work_location___in_custom_nos_work_location": "work_location_in",
    "n_work_location___out_custom_nos_work_location": "work_location_out",
    "o_photo_approval___in_option_o_photo_approval": "photo_approval_in",
    "o_photo_approval___out_option_o_photo_approval": "photo_approval_out",
    "request_update_end_location_text": "request_update_end_location",
    "request_update_start_location_text": "request_update_start_location",
    "ding_ding_in_attendance_id_text": "dingding_in_attendance_id",
    "ding_ding_out_attendance_id_text": "dingding_out_attendance_id",
  },
  BubbleManHourDate: {
    "_id": "bubble_id",
    "report_date_date": "report_date",
    "staff_custom_staff": "staff_id",
    "total_work_hour_number": "total_work_hour",
  },
  BubbleManHourTask: {
    "_id": "bubble_id",
    "asana_link_text": "asana_link",
    "work_hour_number": "work_hour",
    "images_list_image": "images",
    "keywords_text": "keywords",
    "meeting_topic_text": "meeting_topic",
    "output_count_number": "output_count",
    "task_description_text": "task_description",
    "n_task_custom_nos_task": "task_id",
    "project_custom_project": "project_id",
    "n_brand_custom_nos_brand": "brand_id",
    "meeting_invite_sent_boolean": "meeting_invite_sent",
    "projects_list_custom_project": "projects",
    "n_task_type_custom_nos_task_type": "task_type_id",
    "man_hour_date_custom_man_hour_date": "man_hour_date_id",
    "meeting_participant_list_custom_staff": "meeting_participants",
    "o_meeting_method_option_os_meeting_method": "meeting_method",
    "n_output___unit_custom_nos_output___unit": "output_unit",
    "n_work_location_custom_nos_work_location": "work_location",
    "o_meeting_duration_option_os_meeting_duration": "meeting_duration",
    "o_meeting_request_date_option_o_meeting_request_date": "meeting_request_date",
  },
  BubbleProject: {
    "_id": "bubble_id",
    "outcome_text": "outcome",
    "asana_link_text": "asana_link",
    "pic_custom_staff": "pic_id",
    "display_text": "display_name",
    "start_date_date": "started_date",
    "bubble_api_id_text": "bubble_api_id",
    "is_key_project_boolean": "is_key_project",
    "estimated_income_number": "estimated_income",
    "estimated_expense_number": "estimated_expense",
    "estimated_man_hour_number": "estimated_man_hour",
    "n_brands_list_custom_nos_brand": "brands",
    "collaborator_list_custom_staff": "collaborators",
    "o_status_option_os_project_status": "status",
    "n_teams_list_custom_nos_team": "teams",
    "o_location_list_option_o_base_location": "locations",
    "limited_to_role_list_custom_nos_team_role": "roles",
    "sub_projects_list_custom_project": "sub_projects",
    "n_task_types_list_custom_nos_task_type": "task_types",
    "n_suggested_task_types_list_custom_nos_task_type": "task_types",
    "n_project_timeline_option_os_project_timeline": "project_timeline",
  },
  BubbleStaffKPI: {
    "_id": "bubble_id",
    "score_number": "score",
    "asana_link_text": "asana_link",
    "kpi_sales_number": "kpi_sales",
    "related_file_file": "related_file_url",
    "self_point_number": "self_score",
    "leader_comment_text": "leader_comment",
    "working_folder_text": "box_folder",
    "key_achievement_text": "key_achievement",
    "project_custom_project": "project_id",
    "improve_description_text": "improve_description",
    "leader_suggest_point_number": "leader_suggest_score",
    "breakthrough_description_text": "breakthrough_description",
    "staff_kpi_month_custom_staff_kpi_month": "staff_kpi_month_id",
  },
  BubbleStaffKPIMonth: {
    "_id": "bubble_id",
    "report_month_date": "report_month",
    "staff_custom_staff": "staff_id",
    "company_comment_text": "company_comment",
    "company_point_number": "company_point",
  },
};

// Fields that hold Bubble Display values (option/custom type references displayed as text)
// We store these as-is since they are display strings
const DISPLAY_FIELDS = new Set([
  "staff_name", "staff_id", "approver_name", "approver_id", "rejecter_name", "rejecter_id",
  "leave_type", "leave_period", "ot_type", "status", "clockin_id",
  "task_id", "project_id", "brand_id", "task_type_id", "man_hour_date_id",
  "pic_id", "staff_kpi_month_id",
  "n_bu", "n_team", "n_team_role", "team_leader",
  "work_location_in", "work_location_out", "work_location",
  "photo_approval_in", "photo_approval_out", "status_in", "status_out",
  "meeting_method", "meeting_duration", "meeting_request_date",
  "output_unit", "o_probation", "o_status", "o_user_role", "base_location",
  "project_timeline",
]);

function transformRow(entityName, bubbleRow) {
  const fieldMap = FIELD_MAPS[entityName];
  if (!fieldMap) return null;

  const result = {};
  for (const [bubbleKey, dbKey] of Object.entries(fieldMap)) {
    if (bubbleKey === "_id") {
      result.bubble_id = bubbleRow._id || "";
      continue;
    }
    let val = bubbleRow[bubbleKey];
    if (val === undefined || val === null) continue;

    // Handle Bubble image fields (they return URL strings)
    if (typeof val === "string" && val.startsWith("//")) {
      val = "https:" + val;
    }

    // Handle geographic_address type (Bubble returns {address, lat, lng})
    if (val && typeof val === "object" && "address" in val) {
      val = val.address || "";
    }

    result[dbKey] = val;
  }

  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { entityName, fileUrl } = await req.json();
    if (!entityName || !fileUrl) {
      return Response.json({ error: 'entityName and fileUrl are required' }, { status: 400 });
    }

    const fieldMap = FIELD_MAPS[entityName];
    if (!fieldMap) {
      return Response.json({ error: `No field mapping for entity: ${entityName}` }, { status: 400 });
    }

    // 1. Fetch and parse the uploaded file
    const fileResp = await fetch(fileUrl);
    const text = await fileResp.text();
    let rawData;
    try {
      rawData = JSON.parse(text);
    } catch {
      return Response.json({ error: 'Failed to parse file as JSON' }, { status: 400 });
    }

    // Support both array and { results: [...] } format
    const rows = Array.isArray(rawData) ? rawData : (rawData.results || rawData.response?.results || []);
    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: 'No data rows found in file' }, { status: 400 });
    }

    // 2. Transform rows
    const transformed = [];
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const t = transformRow(entityName, rows[i]);
        if (t) transformed.push(t);
        else errors.push({ row: i, error: "transform returned null" });
      } catch (e) {
        errors.push({ row: i, error: e.message });
      }
    }

    // 3. Delete all existing records (overwrite mode)
    const entity = base44.asServiceRole.entities[entityName];
    if (!entity) {
      return Response.json({ error: `Entity ${entityName} not found in SDK` }, { status: 400 });
    }

    // Fetch all existing records and delete in batches
    let existingIds = [];
    let offset = 0;
    const batchSize = 100;
    while (true) {
      const batch = await entity.filter({}, 'created_date', batchSize, offset);
      if (!batch || batch.length === 0) break;
      existingIds.push(...batch.map(r => r.id));
      if (batch.length < batchSize) break;
      offset += batchSize;
    }

    let deleted = 0;
    for (const id of existingIds) {
      await entity.delete(id);
      deleted++;
    }

    // 4. Insert new records in batches
    let created = 0;
    const insertBatch = 50;
    for (let i = 0; i < transformed.length; i += insertBatch) {
      const batch = transformed.slice(i, i + insertBatch);
      await entity.bulkCreate(batch);
      created += batch.length;
    }

    return Response.json({
      success: true,
      deleted,
      created,
      totalInFile: rows.length,
      transformErrors: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("importBubbleData error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});