import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFromBubble(typeName, startCursor = 0, maxRecords = 99999) {
  const results = [];
  let cursor = startCursor;
  const limit = 100;
  const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
  while (results.length < maxRecords) {
    const url = `${baseUrl}/${typeName}?limit=${limit}&cursor=${cursor}`;
    console.log(`Fetching: ${url}`);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` }
    });
    if (!res.ok) {
      const txt = await res.text();
      if (txt.includes('<!doctype') || txt.includes('<html')) {
        throw new Error(`Bubble API returned HTML for ${typeName}. URL may be wrong: ${url}`);
      }
      throw new Error(`Bubble API error for ${typeName}: ${res.status} - ${txt.substring(0, 200)}`);
    }
    const json = await res.json();
    const items = json.response?.results || [];
    results.push(...items);
    const remaining = json.response?.remaining || 0;
    if (items.length < limit || remaining === 0) {
      return { results, nextCursor: null, total: json.response?.count || results.length };
    }
    cursor += limit;
    await sleep(200);
  }
  return { results, nextCursor: cursor, total: null };
}

// Mapping functions for each type
function mapOT(r) {
  return {
    bubble_id: r._id,
    remarks: r.remarks_text || "",
    ot_hour: r.ot_hour_number || 0,
    event_name: r.event_name_text || "",
    reject_reason: r.reject_reason_text || "",
    staff_id: r.staff_custom_staff || "",
    end_date_time: r.end_date__time_date || "",
    is_interview: r.is_interview_boolean || false,
    start_date_time: r.start_date__time_date || "",
    clockin_id: r.r_clcok_in_custom_clockin || "",
    ot_type: r.n_ot_type_custom_nos_ot_type || "",
    status: r.status_option_os_approval_status || ""
  };
}

function mapLeave(r) {
  return {
    bubble_id: r._id,
    prove_url: r.prove || "",
    remarks: r.remarks_text || "",
    quota: r._quota_number || 0,
    count_year: r.count_year_date || "",
    info_tech_url: r.info_tech || "",
    approved: r.approved_boolean || false,
    display_name: r.display_name_text || "",
    reject_reason: r.reject_reason_text || "",
    send_email: r.send_email_boolean || false,
    staff_id: r.staff_custom_staff || "",
    end_date_time: r.end_date___time_date || "",
    google_event_id: r.google_event_id_text || "",
    approver_id: r.approver_custom_staff || "",
    rejecter_id: r.rejecter_custom_staff || "",
    start_date_time: r.start_date___time_date || "",
    application_reason: r.application_reason_text || "",
    interview_email: r.interview_email_boolean || false,
    send_approval_email: r.send_approval_email_boolean || false,
    leave_type: r.n_leave_type_custom_nos_leave_type || "",
    leave_period: r.n_leave_period_custom_nos_leave_period || ""
  };
}

function mapClockin(r) {
  return {
    bubble_id: r._id,
    prove_out_url: r.prove || "",
    remarks_in: r.remarks_text || "",
    face_image_in_url: r.face_image || "",
    prove_in_url: r.prove___in || "",
    clockin_time: r.clockin_time_date || "",
    ot_minutes: r.ot_minutes_number || 0,
    remarks_out: r.remarks___out_text || "",
    staff_id: r.staff_custom_staff || "",
    clock_out_time: r.clock_out_time_date || "",
    late_minutes: r.late_minutes_number || 0,
    accuracy_in: r.accuracy___in_number || 0,
    accuracy_out: r.accuracy___out_number || 0,
    face_image_out_url: r.face_image___out || "",
    face_image_file_url_in: r.face_image_file_url_text || "",
    reason_for_no_clock: r.reason_for_late_clock_text || "",
    request_update_end_time: r.request_update_end_time_date || "",
    face_image_file_url_out: r.face_image_file_url___out_text || "",
    request_update_start_time: r.request_update_start_time_date || "",
    geo_location_in: r.geo_location_geographic_address || "",
    geo_location_out: r.geo_location___out_geographic_address || "",
    status_in: r.o_status_option_os_clockin_status || "",
    status_out: r.o_status___out_option_os_clockin_status || "",
    tags_in: r["tag___in_list_custom_nos_clock_in_tag"] || [],
    tags_out: r["tag___out_list_custom_nos_clock_in_tag"] || [],
    work_location_in: r.n_work_location_custom_nos_work_location || "",
    work_location_out: r.n_work_location___out_custom_nos_work_location || "",
    photo_approval_in: r.o_photo_approval_option_os_photo_approval || "",
    photo_approval_out: r.o_photo_approval_out_option_os_photo_approval || "",
    request_update_end_location: r.request_update_end_location_custom_nos_work_location || "",
    request_update_start_location: r.request_update_start_location_custom_nos_work_location || ""
  };
}

function mapManHourDate(r) {
  return {
    bubble_id: r._id,
    report_date: r.report_date_date || "",
    staff_id: r.staff_custom_staff || "",
    total_work_hour: r.total_work_hour_number || 0
  };
}

function mapManHourTask(r) {
  return {
    bubble_id: r._id,
    asana_link: r.asana_link_text || "",
    work_hour: r.work_hour_number || 0,
    images: r.images_list_image || [],
    keywords: r.project_name_text || "",
    meeting_topic: r.meeting_topic_text || "",
    output_count: r.output_count_number || 0,
    task_description: r.task_description_text || "",
    task_id: r.n_task_custom_nos_task || "",
    project_id: r.project_custom_project || "",
    brand_id: r.n_brand_custom_nos_brand || "",
    meeting_invite_sent: r.meeting_invite_sent_boolean || false,
    projects: r.projects_list_custom_project || [],
    task_type_id: r.n_task_type_custom_nos_task_type || "",
    man_hour_date_id: r.man_hour_date_custom_man_hour_date || "",
    meeting_participants: r.meeting_participant_list_custom_staff || [],
    meeting_method: r.o_meeting_method_option_meeting_method || "",
    output_unit: r.n_output___unit_custom_nos_output___unit || "",
    work_location: r.n_work_location_custom_nos_work_location || "",
    meeting_duration: r.o_meeting_duration_option_meeting_duration || "",
    meeting_request_date: r.o_meeting_request_date_option_meeting_request_date || ""
  };
}

function mapProject(r) {
  return {
    bubble_id: r._id,
    outcome: r.outcome_text || "",
    asana_link: r.asana_link_text || "",
    pic_id: r.pic_custom_staff || "",
    display_name: r.display_name_text || "",
    started_date: r.started_date_date || "",
    bubble_api_id: r.bubble_api_id_text || "",
    is_key_project: r.is_key_project_boolean || false,
    estimated_income: r.estimated_income_number || 0,
    estimated_expense: r.estimated_expense_number || 0,
    estimated_man_hour: r.estimated_man_hour_number || 0,
    brands: r.n_brand_list_custom_nos_brand || [],
    collaborators: r.collaborator_list_custom_staff || [],
    status: r.status_option_os_project_status || "",
    teams: r.limited_to_team_list_custom_nos_team || [],
    locations: r.o_location_list_option_os_base_location || [],
    roles: r.limited_to_role_list_custom_nos_team_role || [],
    sub_projects: r.sub_projects_list_custom_project || [],
    task_types: r.n_suggested_task_types_list_custom_nos_task_type || [],
    project_timeline: r.n_project_timeline_custom_nos_project_timeline || ""
  };
}

function mapStaffKPI(r) {
  return {
    bubble_id: r._id,
    score: r.score_number || 0,
    asana_link: r.asana_line_text || "",
    kpi_sales: r.kpi_sales_number || 0,
    related_file_url: r.related_file_file || "",
    self_score: r.self_point_number || 0,
    leader_comment: r.leader_comment_text || "",
    box_folder: r.working_folder_text || "",
    key_achievement: r.key_achievement_text || "",
    project_id: r.project_custom_project || "",
    improve_description: r.improve_description_text || "",
    leader_suggest_score: r.leader_suggest_point_number || 0,
    breakthrough_description: r.breakthrough_description_text || "",
    staff_kpi_month_id: r.staff_kpi_month_custom_staff_kpi_month || ""
  };
}

function mapStaffKPIMonth(r) {
  return {
    bubble_id: r._id,
    report_month: r.report_month_date || "",
    staff_id: r.staff_custom_staff || "",
    company_comment: r.company_comment_text || "",
    company_point: r.company_point_number || 0
  };
}

async function syncType(base44, entityName, bubbleTypeName, mapFn, log, startCursor = 0, maxRecords = 1500, skipExistingCheck = false) {
  log.push(`--- Syncing ${entityName} (cursor=${startCursor}, max=${maxRecords}) ---`);
  
  let fetchResult;
  try {
    fetchResult = await fetchFromBubble(bubbleTypeName, startCursor, maxRecords);
  } catch (err) {
    log.push(`ERROR fetching: ${err.message}`);
    return { fetched: 0, created: 0, error: err.message };
  }
  const bubbleData = fetchResult.results;
  log.push(`Fetched ${bubbleData.length} from Bubble (total: ${fetchResult.total || '?'})`);

  let existingSet = new Set();
  if (!skipExistingCheck) {
    try {
      const existing = await base44.asServiceRole.entities[entityName].filter({}, 'bubble_id', 50000);
      for (const e of existing) {
        if (e.bubble_id) existingSet.add(e.bubble_id);
      }
      log.push(`Existing in DB: ${existingSet.size}`);
    } catch (err) {
      log.push(`WARN: could not check existing: ${err.message}`);
    }
  }

  const toCreate = [];
  for (const raw of bubbleData) {
    const mapped = mapFn(raw);
    if (!mapped.bubble_id) continue;
    if (skipExistingCheck || !existingSet.has(mapped.bubble_id)) {
      toCreate.push(mapped);
    }
  }
  log.push(`To create: ${toCreate.length}`);

  let created = 0;
  for (let i = 0; i < toCreate.length; i += 20) {
    const batch = toCreate.slice(i, i + 20);
    try {
      await base44.asServiceRole.entities[entityName].bulkCreate(batch);
      created += batch.length;
    } catch (err) {
      if (err.message?.includes('Rate limit') || err.message?.includes('429')) {
        log.push(`Rate limited, waiting 5s...`);
        await sleep(5000);
        try {
          await base44.asServiceRole.entities[entityName].bulkCreate(batch);
          created += batch.length;
        } catch (err2) {
          log.push(`ERROR after retry: ${err2.message}`);
        }
      } else {
        log.push(`ERROR: ${err.message}`);
      }
    }
    await sleep(1000);
  }

  log.push(`Created: ${created}`);
  return { fetched: bubbleData.length, created, nextCursor: fetchResult.nextCursor };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const typesToSync = body.types || "all";
    const startCursor = body.startCursor || 0;
    const maxRecords = body.maxRecords || 1500;
    const skipExistingCheck = body.skipExistingCheck || false;

    const log = [];
    const results = {};

    const syncConfigs = [
      { entity: "BubbleOT", bubble: "ot", map: mapOT },
      { entity: "BubbleLeave", bubble: "leave", map: mapLeave },
      { entity: "BubbleClockin", bubble: "clockin", map: mapClockin },
      { entity: "BubbleManHourDate", bubble: "man_hour_date", map: mapManHourDate },
      { entity: "BubbleManHourTask", bubble: "man_hour_report", map: mapManHourTask },
      { entity: "BubbleProject", bubble: "project", map: mapProject },
      { entity: "BubbleStaffKPI", bubble: "man_hour_month", map: mapStaffKPI },
      { entity: "BubbleStaffKPIMonth", bubble: "staff_kpi_month", map: mapStaffKPIMonth },
    ];

    for (const cfg of syncConfigs) {
      if (typesToSync !== "all" && !typesToSync.includes(cfg.entity)) continue;
      const result = await syncType(base44, cfg.entity, cfg.bubble, cfg.map, log, startCursor, maxRecords, skipExistingCheck);
      results[cfg.entity] = result;
    }

    return Response.json({ success: true, results, log });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});