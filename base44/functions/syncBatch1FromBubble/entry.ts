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
// Bubble Data API returns display names as keys (e.g. "Clock In Time", "Staff")
function mapOT(r) {
  return {
    bubble_id: r._id,
    remarks: r["Remarks"] || "",
    ot_hour: r["OT Hour"] || 0,
    event_name: r["Event Name"] || "",
    reject_reason: r["Reject Reason"] || "",
    staff_id: r["Staff"] || "",
    end_date_time: r["End Date& Time"] || "",
    is_interview: r["Is Interview"] || false,
    start_date_time: r["Start Date& Time"] || "",
    clockin_id: r["R_Clcok-in"] || "",
    ot_type: r["N_OT Type"] || "",
    status: r["Status"] || ""
  };
}

function mapLeave(r) {
  return {
    bubble_id: r._id,
    prove_url: r["Prove"] || "",
    remarks: r["Remarks"] || "",
    quota: r["-Quota"] || 0,
    count_year: r["Count Year"] || "",
    info_tech_url: r["Info-Tech"] || "",
    approved: r["Approved"] || false,
    display_name: r["Display Name"] || "",
    reject_reason: r["Reject Reason"] || "",
    send_email: r["Send Email"] || false,
    staff_id: r["Staff"] || "",
    end_date_time: r["End Date & Time"] || "",
    google_event_id: r["Google Event ID"] || "",
    approver_id: r["Approver"] || "",
    rejecter_id: r["Rejecter"] || "",
    start_date_time: r["Start Date & Time"] || "",
    application_reason: r["Application Reason"] || r["Reason for Apply"] || "",
    interview_email: r["Interview Email"] || false,
    send_approval_email: r["Send Approval Email"] || false,
    leave_type: r["N_Leave Type"] || "",
    leave_period: r["N_Leave Period"] || ""
  };
}

function mapClockin(r) {
  const geoIn = r["Geo Location - In"];
  const geoOut = r["Geo Location - Out"];
  return {
    bubble_id: r._id,
    prove_out_url: r["Prove - Out"] || r["Prove"] || "",
    remarks_in: r["Remarks"] || r["Remarks - In"] || "",
    face_image_in_url: r["Face Image - In"] || "",
    prove_in_url: r["Prove - In"] || "",
    clockin_time: r["Clock In Time"] || "",
    ot_minutes: r["OT minutes approved"] || r["OT Minutes Approved"] || r["OT Minutes"] || 0,
    remarks_out: r["Remarks - Out"] || "",
    staff_id: r["Staff"] || "",
    clock_out_time: r["Clock Out Time"] || "",
    late_minutes: r["Late minutes"] || r["Late Minutes"] || 0,
    accuracy_in: r["Accuracy - In"] || 0,
    accuracy_out: r["Accuracy - Out"] || 0,
    face_image_out_url: r["Face Image - Out"] || "",
    face_image_file_url_in: r["Face Image File URL - In"] || "",
    reason_for_no_clock: r["Reason for No Clock"] || r["Reason for Late Clock"] || "",
    request_update_end_time: r["Request Update End Time"] || "",
    face_image_file_url_out: r["Face Image File URL - Out"] || "",
    request_update_start_time: r["Request Update Start Time"] || "",
    geo_location_in: geoIn ? (geoIn.address || `${geoIn.lat},${geoIn.lng}`) : "",
    geo_location_out: geoOut ? (geoOut.address || `${geoOut.lat},${geoOut.lng}`) : "",
    status_in: r["O_Status - In"] || "",
    status_out: r["O_Status - Out"] || "",
    tags_in: r["Tags - in"] || r["Tag - In"] || [],
    tags_out: r["Tags - out"] || r["Tag - Out"] || [],
    work_location_in: r["N_Work Location - In"] || r["N_Work Location"] || "",
    work_location_out: r["N_Work Location - Out"] || "",
    photo_approval_in: r["O_Photo Approval"] || "",
    photo_approval_out: r["O_Photo Approval Out"] || "",
    request_update_end_location: r["Request Update End Location"] || "",
    request_update_start_location: r["Request Update Start Location"] || ""
  };
}

function mapManHourDate(r) {
  return {
    bubble_id: r._id,
    report_date: r["Report Date"] || "",
    staff_id: r["Staff"] || "",
    total_work_hour: r["Total Work Hour"] || 0
  };
}

function mapManHourTask(r) {
  return {
    bubble_id: r._id,
    asana_link: r["Asana Link"] || "",
    work_hour: r["Work Hour"] || 0,
    images: r["Images"] || [],
    keywords: r["Keywords"] || r["Project Name"] || "",
    meeting_topic: r["Meeting Topic"] || "",
    output_count: r["Output Count"] || 0,
    task_description: r["Task Description"] || "",
    task_id: r["N_Task"] || "",
    project_id: r["Project"] || "",
    brand_id: r["N_Brand"] || "",
    meeting_invite_sent: r["Meeting Invite Sent"] || false,
    projects: r["Projects"] || [],
    task_type_id: r["N_Task Type"] || "",
    man_hour_date_id: r["Man Hour Date"] || "",
    meeting_participants: r["Meeting Participant"] || [],
    meeting_method: r["O_Meeting Method"] || "",
    output_unit: r["N_Output & Unit"] || "",
    work_location: r["N_Work Location"] || "",
    meeting_duration: r["O_Meeting Duration"] || "",
    meeting_request_date: r["O_Meeting Request Date"] || ""
  };
}

function mapProject(r) {
  return {
    bubble_id: r._id,
    outcome: r["Outcome"] || "",
    asana_link: r["Asana Link"] || "",
    pic_id: r["PIC"] || "",
    display_name: r["Display Name"] || "",
    started_date: r["Start Date"] || "",
    bubble_api_id: r["Bubble API ID"] || "",
    is_key_project: r["Is Key Project"] || false,
    estimated_income: r["Estimated Income"] || 0,
    estimated_expense: r["Estimated Expense"] || 0,
    estimated_man_hour: r["Estimated Man Hour"] || 0,
    brands: r["N_Brands"] || [],
    collaborators: r["Collaborator"] || [],
    status: r["O_Status"] || "",
    teams: r["N_Teams"] || [],
    locations: r["O_Location"] || [],
    roles: r["Limited to Role"] || [],
    sub_projects: r["Sub-Projects"] || [],
    task_types: r["N_Task Types"] || r["N_Suggested Task Types"] || [],
    project_timeline: r["N_Project Timeline"] || ""
  };
}

function mapStaffKPI(r) {
  return {
    bubble_id: r._id,
    score: r["Score"] || 0,
    asana_link: r["Asana Link"] || r["Asana Line"] || "",
    kpi_sales: r["KPI Sales"] || 0,
    related_file_url: r["Related File"] || "",
    self_score: r["Self Point"] || 0,
    leader_comment: r["Leader Comment"] || "",
    box_folder: r["Working Folder"] || "",
    key_achievement: r["Key Achievement"] || "",
    project_id: r["Project"] || "",
    improve_description: r["Improve Description"] || "",
    leader_suggest_score: r["Leader Suggest Point"] || 0,
    breakthrough_description: r["Breakthrough Description"] || "",
    staff_kpi_month_id: r["Staff KPI Month"] || ""
  };
}

function mapStaffKPIMonth(r) {
  return {
    bubble_id: r._id,
    report_month: r["Report Month"] || "",
    staff_id: r["Staff"] || "",
    company_comment: r["Company Comment"] || "",
    company_point: r["Company Point"] || 0
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