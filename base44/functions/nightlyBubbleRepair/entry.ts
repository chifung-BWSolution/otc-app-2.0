import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function formatGeo(geo) {
  if (!geo) return "";
  if (typeof geo === "string") return geo;
  return geo.address || `${geo.lat},${geo.lng}`;
}

const SKIP_FIELDS = new Set(["bubble_id", "staff_name"]);

function valuesMatch(dbVal, bubbleVal) {
  const dbEmpty = dbVal === null || dbVal === undefined || dbVal === "" || dbVal === 0 || dbVal === false;
  const bEmpty = bubbleVal === null || bubbleVal === undefined || bubbleVal === "" || bubbleVal === 0 || bubbleVal === false;
  if (dbEmpty && bEmpty) return true;
  if (Array.isArray(dbVal) && Array.isArray(bubbleVal)) {
    if (dbVal.length === 0 && bubbleVal.length === 0) return true;
    return JSON.stringify(dbVal) === JSON.stringify(bubbleVal);
  }
  return dbVal === bubbleVal;
}

// ============ MAPPING FUNCTIONS ============

function mapClockin(r) {
  return {
    bubble_id: r._id,
    prove_out_url: r["Prove - Out"] || "",
    remarks_in: r["Remarks - In"] || r["Remarks"] || "",
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
    reason_for_no_clock: r["Reason for No Clock"] || "",
    request_update_end_time: r["Request Update End Time"] || "",
    face_image_file_url_out: r["Face Image File URL - Out"] || "",
    request_update_start_time: r["Request Update Start Time"] || "",
    geo_location_in: formatGeo(r["Geo Location - In"]),
    geo_location_out: formatGeo(r["Geo Location - Out"]),
    google_location_in: formatGeo(r["Google Location - In"]),
    google_location_out: formatGeo(r["Google Location - Out"]),
    status_in: r["O_Status - In"] || "",
    status_out: r["O_Status - Out"] || "",
    tags_in: r["Tags - in"] || r["Tag - In"] || [],
    tags_out: r["Tags - out"] || r["Tag - Out"] || [],
    work_location_in: r["N_Work Location - In"] || r["N_Work Location"] || "",
    work_location_out: r["N_Work Location - Out"] || "",
    photo_approval_in: r["O_Photo Approval - In"] || r["O_Photo Approval"] || "",
    photo_approval_out: r["O_Photo Approval - Out"] || r["O_Photo Approval Out"] || "",
    request_update_end_location: r["Request Update End Location"] || "",
    request_update_start_location: r["Request Update Start Location"] || "",
    dingding_in_attendance_id: r["Ding Ding In Attendance Id"] || "",
    dingding_out_attendance_id: r["Ding Ding Out Attendance Id"] || "",
  };
}

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

function mapStaff(r) {
  return {
    bubble_id: r._id,
    al_quota: r["AL Quota"] || 0,
    birthday: r["Birthday"] || "",
    brands: r["Brands"] || [],
    business_email: r["Business Email"] || "",
    clock_in_face: r["Clock In Face"] || "",
    clock_in_face_amazon_id: r["Clock In Face amazon ID"] || "",
    clock_in_face_amazon_id_2: r["Clock In Face amazon ID 2"] || "",
    dingding_dept_id: r["DingDing Dept Id"] || "",
    dingding_user_id: r["DingDing User Id"] || "",
    direct_phone: r["Direct Phone"] || 0,
    display_name: r["Display Name"] || "",
    entry_date: r["Entry Date"] || "",
    full_name: r["Full Name"] || "",
    hotline: r["Hotline"] || "",
    n_bu: r["N_BU"] || "",
    n_team: r["N_Team"] || "",
    n_team_role: r["N_Team Role"] || "",
    new_direct_phone: r["New Direct Phone"] || [],
    new_work_phone: r["New Work Phone"] || "",
    no_clockin: r["No Clockin"] || false,
    no_man_hour_task: r["No Man Hour Task"] || false,
    o_base_location: r["O_Base Location"] || "",
    o_probation: r["O_Probation"] || "",
    o_status: r["O_Status"] || "",
    o_status_text: r["O_Status_Text"] || "",
    o_user_role: r["O_User Role"] || "",
    position: r["Position"] || "",
    private_email: r["Private Email"] || "",
    private_phone: r["Private Phone"] || 0,
    profile_pic: r["Profile Pic"] || "",
    team_leader: r["Team Leader"] || "",
    termination_date: r["Termination Date"] || "",
    voov_id: r["Voov ID"] || 0,
    work_email: r["Work Email"] || "",
    work_phone: r["Work Phone"] || 0,
  };
}

// ============ ENTITY CONFIGS ============

const ENTITY_PIPELINE = [
  { entity: "BubbleClockin", bubbleType: "clock-in", mapFn: mapClockin },
  { entity: "BubbleOT", bubbleType: "ot", mapFn: mapOT },
  { entity: "BubbleLeave", bubbleType: "leave", mapFn: mapLeave },
  { entity: "BubbleManHourDate", bubbleType: "man_hour_date", mapFn: mapManHourDate },
  { entity: "BubbleManHourTask", bubbleType: "man_hour_report", mapFn: mapManHourTask },
  { entity: "BubbleProject", bubbleType: "project", mapFn: mapProject },
  { entity: "BubbleStaffKPI", bubbleType: "man_hour_month", mapFn: mapStaffKPI },
  { entity: "BubbleStaffKPIMonth", bubbleType: "staff_kpi_month", mapFn: mapStaffKPIMonth },
  { entity: "Staff", bubbleType: "staff", mapFn: mapStaff },
];

// ============ CORE REPAIR LOGIC ============

async function loadDbMap(base44, entityName) {
  const dbMap = {};
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const batch = await base44.asServiceRole.entities[entityName].filter({}, 'id', 5000, offset);
    for (const r of batch) {
      if (r.bubble_id) dbMap[r.bubble_id] = r;
    }
    offset += batch.length;
    if (batch.length < 5000) hasMore = false;
    else await sleep(500);
  }
  return dbMap;
}

async function repairBatch(base44, entityConfig, dbMap, cursor, maxScan, maxUpdates) {
  const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
  const updates = [];
  let totalScanned = 0;
  let bubbleRemaining = 0;
  let currentCursor = cursor;

  while (totalScanned < maxScan) {
    const url = `${baseUrl}/${entityConfig.bubbleType}?limit=100&cursor=${currentCursor}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
    if (!res.ok) {
      console.log(`Bubble API error: ${res.status}`);
      break;
    }
    const json = await res.json();
    const results = json.response?.results || [];
    bubbleRemaining = json.response?.remaining || 0;

    for (const r of results) {
      const dbRec = dbMap[r._id];
      if (!dbRec) continue;

      const mapped = entityConfig.mapFn(r);
      const diff = {};
      for (const [key, bubbleVal] of Object.entries(mapped)) {
        if (SKIP_FIELDS.has(key)) continue;
        if (!valuesMatch(dbRec[key], bubbleVal)) {
          diff[key] = bubbleVal;
        }
      }
      if (Object.keys(diff).length > 0) {
        updates.push({ dbId: dbRec.id, diff });
      }
    }

    totalScanned += results.length;
    if (results.length < 100 || bubbleRemaining === 0) break;
    currentCursor += results.length;
    await sleep(200);
  }

  // Apply updates
  const toApply = updates.slice(0, maxUpdates);
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < toApply.length; i++) {
    const u = toApply[i];
    try {
      await base44.asServiceRole.entities[entityConfig.entity].update(u.dbId, u.diff);
      updated++;
    } catch (err) {
      if (err.message?.includes('Rate limit') || err.message?.includes('429')) {
        console.log(`Rate limited, waiting 20s...`);
        await sleep(20000);
        try {
          await base44.asServiceRole.entities[entityConfig.entity].update(u.dbId, u.diff);
          updated++;
        } catch (err2) { errors++; }
      } else { errors++; }
    }
    if ((i + 1) % 3 === 0) await sleep(6000);
  }

  const skipped = updates.length - toApply.length;
  const nextCursor = (totalScanned < maxScan && skipped === 0) ? null : cursor + totalScanned;
  const entityDone = nextCursor === null && skipped === 0;

  return {
    scanned: totalScanned,
    needUpdate: updates.length,
    updated,
    errors,
    skipped,
    nextCursor: skipped > 0 ? cursor : nextCursor,
    entityDone,
  };
}

// ============ MAIN HANDLER ============

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);

    // Check time window: only run 21:00-08:00 HKT (13:00-00:00 UTC)
    const now = new Date();
    const hktHour = (now.getUTCHours() + 8) % 24;
    if (hktHour >= 8 && hktHour < 21) {
      console.log(`Outside window: HKT ${hktHour}:00, skipping`);
      return Response.json({ skipped: true, reason: `Outside 21:00-08:00 HKT window (current: ${hktHour}:00)` });
    }

    // Load or create progress record
    const JOB_NAME = "nightly_bubble_repair";
    let progressList = await base44.asServiceRole.entities.SyncProgress.filter({ job_name: JOB_NAME });
    let progress;

    if (progressList.length === 0) {
      // First run — start from BubbleClockin cursor 9500
      progress = await base44.asServiceRole.entities.SyncProgress.create({
        job_name: JOB_NAME,
        current_entity: "BubbleClockin",
        current_cursor: 9500,
        status: "running",
        total_updated: 0,
        total_errors: 0,
      });
    } else {
      progress = progressList[0];
    }

    if (progress.status === "completed") {
      console.log("All entities completed!");
      return Response.json({ status: "completed", message: "All repair jobs done" });
    }

    const entityName = progress.current_entity;
    const cursor = progress.current_cursor || 0;

    // Find current entity config
    const entityIdx = ENTITY_PIPELINE.findIndex(e => e.entity === entityName);
    if (entityIdx === -1) {
      return Response.json({ error: `Unknown entity: ${entityName}` });
    }
    const entityConfig = ENTITY_PIPELINE[entityIdx];

    console.log(`=== Processing ${entityName} cursor=${cursor} ===`);

    // Load DB map for current entity
    const dbMap = await loadDbMap(base44, entityName);
    console.log(`Loaded ${Object.keys(dbMap).length} DB records for ${entityName}`);

    // Check if we still have time (max 3 min for actual repair, reserve time for DB load)
    const elapsed = Date.now() - startTime;
    if (elapsed > 120000) {
      console.log("DB load took too long, will retry next run");
      return Response.json({ status: "retry", reason: "DB load slow", elapsed });
    }

    // Run repair batch — small scan (500 records) and small update batch (30) to avoid timeout
    const result = await repairBatch(base44, entityConfig, dbMap, cursor, 500, 30);

    console.log(`Result: scanned=${result.scanned}, updated=${result.updated}, errors=${result.errors}, done=${result.entityDone}`);

    // Update progress
    const updateData = {
      current_cursor: result.entityDone ? 0 : (result.nextCursor || cursor),
      total_updated: (progress.total_updated || 0) + result.updated,
      total_errors: (progress.total_errors || 0) + result.errors,
      last_result: {
        entity: entityName,
        ...result,
        timestamp: new Date().toISOString(),
      },
    };

    if (result.entityDone) {
      // Move to next entity
      const nextIdx = entityIdx + 1;
      if (nextIdx >= ENTITY_PIPELINE.length) {
        updateData.status = "completed";
        updateData.current_entity = "ALL_DONE";
        console.log("ALL ENTITIES COMPLETED!");
      } else {
        updateData.current_entity = ENTITY_PIPELINE[nextIdx].entity;
        updateData.current_cursor = 0;
        console.log(`Moving to next entity: ${ENTITY_PIPELINE[nextIdx].entity}`);
      }
    }

    await base44.asServiceRole.entities.SyncProgress.update(progress.id, updateData);

    return Response.json({
      success: true,
      entity: entityName,
      cursor,
      result,
      nextEntity: updateData.current_entity,
      nextCursor: updateData.current_cursor,
      totalUpdated: updateData.total_updated,
      elapsedMs: Date.now() - startTime,
    });

  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message, elapsedMs: Date.now() - startTime }, { status: 500 });
  }
});