// Mapping: Bubble display field name → DB entity field name
// Used to pair Bubble fields with their DB counterparts for comparison

const FIELD_MAPS = {
  Staff: {
    "AL Quota": "al_quota",
    "Birthday": "birthday",
    "Brands": "brands",
    "Business Email": "business_email",
    "Clock In Face": "clock_in_face",
    "Clock In Face amazon ID": "clock_in_face_amazon_id",
    "Clock In Face amazon ID 2": "clock_in_face_amazon_id_2",
    "DingDing Dept Id": "dingding_dept_id",
    "DingDing User Id": "dingding_user_id",
    "Direct Phone": "direct_phone",
    "Display Name": "display_name",
    "Entry Date": "entry_date",
    "Full Name": "full_name",
    "Hotline": "hotline",
    "N_BU": "n_bu",
    "N_Team": "n_team",
    "N_Team Role": "n_team_role",
    "New Direct Phone": "new_direct_phone",
    "New Work Phone": "new_work_phone",
    "No Clockin": "no_clockin",
    "No Man Hour Task": "no_man_hour_task",
    "O_Base Location": "o_base_location",
    "O_Probation": "o_probation",
    "O_Status": "o_status",
    "O_Status_Text": "o_status_text",
    "O_User Role": "o_user_role",
    "Position": "position",
    "Private Email": "private_email",
    "Private Phone": "private_phone",
    "Profile Pic": "profile_pic",
    "Team Leader": "team_leader",
    "Termination Date": "termination_date",
    "Voov ID": "voov_id",
    "Work Email": "work_email",
    "Work Phone": "work_phone",
  },
  BubbleOT: {
    "End Date& Time": "end_date_time",
    "Event Name": "event_name",
    "N_OT Type": "ot_type",
    "OT Hour": "ot_hour",
    "R_Clcok-in": "clockin_id",
    "Remarks": "remarks",
    "Staff": "staff_id",
    "Start Date& Time": "start_date_time",
    "Status": "status",
    "Is Interview": "is_interview",
    "Reject Reason": "reject_reason",
  },
  BubbleLeave: {
    "-Quota": "quota",
    "Approved": "approved",
    "Approver": "approver_id",
    "Count Year": "count_year",
    "Display Name": "display_name",
    "End Date & Time": "end_date_time",
    "Google Event ID": "google_event_id",
    "Interview Email": "interview_email",
    "N_Leave Period": "leave_period",
    "N_Leave Type": "leave_type",
    "Prove": "prove_url",
    "Send Approval Email": "send_approval_email",
    "Send Email": "send_email",
    "Staff": "staff_id",
    "Start Date & Time": "start_date_time",
    "Reject Reason": "reject_reason",
    "Rejecter": "rejecter_id",
    "Remarks": "remarks",
    "Info-Tech": "info_tech_url",
    "Application Reason": "application_reason",
    "Reason for Apply": "application_reason",
  },
  BubbleClockin: {
    "Accuracy - In": "accuracy_in",
    "Accuracy - Out": "accuracy_out",
    "Clock In Time": "clockin_time",
    "Clock Out Time": "clock_out_time",
    "Ding Ding In Attendance Id": "dingding_in_attendance_id",
    "Ding Ding Out Attendance Id": "dingding_out_attendance_id",
    "Face Image - In": "face_image_in_url",
    "Face Image - Out": "face_image_out_url",
    "Face Image File URL - In": "face_image_file_url_in",
    "Face Image File Url - In": "face_image_file_url_in",
    "Face Image File URL - Out": "face_image_file_url_out",
    "Face Image File Url - Out": "face_image_file_url_out",
    "Geo Location - In": "geo_location_in",
    "Geo Location - Out": "geo_location_out",
    "Google Location - In": "google_location_in",
    "Google Location - Out": "google_location_out",
    "Late minutes": "late_minutes",
    "Late Minutes": "late_minutes",
    "N_Work Location": "work_location_in",
    "N_Work Location - In": "work_location_in",
    "N_Work Location - Out": "work_location_out",
    "O_Photo Approval - In": "photo_approval_in",
    "O_Photo Approval": "photo_approval_in",
    "O_Photo Approval - Out": "photo_approval_out",
    "O_Photo Approval Out": "photo_approval_out",
    "O_Status - In": "status_in",
    "O_Status - Out": "status_out",
    "OT minutes approved": "ot_minutes",
    "OT Minutes Approved": "ot_minutes",
    "Prove - In": "prove_in_url",
    "Prove - Out": "prove_out_url",
    "Reason for No Clock": "reason_for_no_clock",
    "Remarks": "remarks_in",
    "Remarks - In": "remarks_in",
    "Remarks - Out": "remarks_out",
    "Request Update End Location": "request_update_end_location",
    "Request Update End Time": "request_update_end_time",
    "Request Update Start Location": "request_update_start_location",
    "Request Update Start Time": "request_update_start_time",
    "Ding Ding In Attendance Id": "dingding_in_attendance_id",
    "DingDing In Attendance Id": "dingding_in_attendance_id",
    "Ding Ding Out Attendance Id": "dingding_out_attendance_id",
    "DingDing Out Attendance Id": "dingding_out_attendance_id",
    "Staff": "staff_id",
    "Tags - in": "tags_in",
    "Tag - In": "tags_in",
    "Tags - out": "tags_out",
    "Tag - Out": "tags_out",
  },
  BubbleManHourDate: {
    "Report Date": "report_date",
    "Staff": "staff_id",
    "Total Work Hour": "total_work_hour",
  },
  BubbleManHourTask: {
    "Asana Link": "asana_link",
    "Work Hour": "work_hour",
    "Images": "images",
    "Keywords": "keywords",
    "Meeting Topic": "meeting_topic",
    "Output Count": "output_count",
    "Task Description": "task_description",
    "N_Task": "task_id",
    "Project": "project_id",
    "N_Brand": "brand_id",
    "Meeting Invite Sent": "meeting_invite_sent",
    "Projects": "projects",
    "N_Task Type": "task_type_id",
    "Man Hour Date": "man_hour_date_id",
    "Meeting Participant": "meeting_participants",
    "O_Meeting Method": "meeting_method",
    "N_Output & Unit": "output_unit",
    "N_Work Location": "work_location",
    "O_Meeting Duration": "meeting_duration",
    "O_Meeting Request Date": "meeting_request_date",
    "Project Name": "keywords",
  },
  BubbleProject: {
    "Outcome": "outcome",
    "Asana Link": "asana_link",
    "PIC": "pic_id",
    "Display Name": "display_name",
    "Start Date": "started_date",
    "Bubble API ID": "bubble_api_id",
    "Is Key Project": "is_key_project",
    "Estimated Income": "estimated_income",
    "Estimated Expense": "estimated_expense",
    "Estimated Man Hour": "estimated_man_hour",
    "N_Brands": "brands",
    "Collaborator": "collaborators",
    "O_Status": "status",
    "N_Teams": "teams",
    "O_Location": "locations",
    "Limited to Role": "roles",
    "Sub-Projects": "sub_projects",
    "N_Task Types": "task_types",
    "N_Suggested Task Types": "task_types",
    "N_Project Timeline": "project_timeline",
  },
  BubbleStaffKPI: {
    "Score": "score",
    "Asana Link": "asana_link",
    "Asana Line": "asana_link",
    "KPI Sales": "kpi_sales",
    "Related File": "related_file_url",
    "Self Point": "self_score",
    "Leader Comment": "leader_comment",
    "Working Folder": "box_folder",
    "Key Achievement": "key_achievement",
    "Project": "project_id",
    "Improve Description": "improve_description",
    "Leader Suggest Point": "leader_suggest_score",
    "Breakthrough Description": "breakthrough_description",
    "Staff KPI Month": "staff_kpi_month_id",
  },
  BubbleStaffKPIMonth: {
    "Report Month": "report_month",
    "Staff": "staff_id",
    "Company Comment": "company_comment",
    "Company Point": "company_point",
  },
  StaffInformation: {
    "Staff": "staff_id",
    "Chinese Name": "chinese_name",
    "English Name": "english_name",
    "Nickname": "nickname",
    "Birthday": "birthday",
    "Phone": "phone",
    "Email1": "email1",
    "Email2": "email2",
    "Identity Card Number": "identity_card_number",
    "Bank Card Number": "bank_card_number",
    "New Bank Card Number": "new_bank_card_number",
    "Bank Card Name": "bank_card_name",
    "Bank Card Owner": "bank_card_owner",
    "Chinese Mailing Address": "chinese_mailing_address",
    "English Mailing Address": "english_mailing_address",
    "Native Place": "native_place",
    "Residential Area": "residential_area",
    "Marital Status": "marital_status",
    "Commuting Time": "commuting_time",
    "Is Active": "is_active",
  },
};

// Build merged field list: returns array of { bubbleName, dbName, bubbleStats, dbStats }
export function buildFieldComparison(entityName, bubbleFields, dbFields) {
  const map = FIELD_MAPS[entityName] || {};
  const result = [];
  const usedDbFields = new Set();

  // Go through Bubble fields, find matching DB field
  for (const [bubbleName, bStats] of Object.entries(bubbleFields)) {
    const dbName = map[bubbleName] || null;
    const dStats = dbName ? dbFields[dbName] || null : null;
    if (dbName) usedDbFields.add(dbName);
    result.push({ bubbleName, dbName, bubbleStats: bStats, dbStats: dStats });
  }

  // Add any DB fields not matched
  for (const [dbName, dStats] of Object.entries(dbFields)) {
    if (usedDbFields.has(dbName)) continue;
    // Skip bubble_id as it's our internal linking field
    if (dbName === "bubble_id") continue;
    result.push({ bubbleName: null, dbName, bubbleStats: null, dbStats: dStats });
  }

  // Sort: matched first (by bubble filled desc), then bubble-only, then db-only
  result.sort((a, b) => {
    const aMatched = a.bubbleName && a.dbName ? 1 : 0;
    const bMatched = b.bubbleName && b.dbName ? 1 : 0;
    if (aMatched !== bMatched) return bMatched - aMatched;
    const aFilled = a.bubbleStats?.estimatedFilled || a.dbStats?.filled || 0;
    const bFilled = b.bubbleStats?.estimatedFilled || b.dbStats?.filled || 0;
    return bFilled - aFilled;
  });

  return result;
}

export default FIELD_MAPS;