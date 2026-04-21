import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchBubbleWithConstraints(typeName, constraints, maxRecords = 5000) {
  const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
  const all = [];
  let cursor = 0;
  while (all.length < maxRecords) {
    const params = new URLSearchParams({ limit: "100", cursor: String(cursor) });
    if (constraints.length > 0) {
      params.set("constraints", JSON.stringify(constraints));
    }
    const url = `${baseUrl}/${typeName}?${params}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Bubble API ${res.status}: ${txt.substring(0, 200)}`);
    }
    const json = await res.json();
    const results = json.response?.results || [];
    all.push(...results);
    const remaining = json.response?.remaining || 0;
    if (remaining === 0 || results.length === 0) break;
    cursor += results.length;
    await sleep(200);
  }
  return all;
}

// Mapping functions
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
    application_reason: r["Application Reason"] || r["Reason for Apply"] || r["Reason for apply"] || "",
    interview_email: r["Interview Email"] || false,
    send_approval_email: r["Send Approval Email"] || false,
    leave_type: r["N_Leave Type"] || "",
    leave_period: r["N_Leave Period"] || "",
  };
}

function mapClockin(r) {
  const geoIn = r["Geo Location - In"];
  const geoOut = r["Geo Location - Out"];
  return {
    bubble_id: r._id,
    prove_out_url: r["Prove - Out"] || "",
    remarks_in: r["Remarks"] || r["Remarks - In"] || "",
    face_image_in_url: r["Face Image - In"] || "",
    prove_in_url: r["Prove - In"] || "",
    clockin_time: r["Clock In Time"] || "",
    ot_minutes: r["OT minutes approved"] || r["OT Minutes Approved"] || 0,
    remarks_out: r["Remarks - Out"] || "",
    staff_id: r["Staff"] || "",
    clock_out_time: r["Clock Out Time"] || "",
    late_minutes: r["Late minutes"] || r["Late Minutes"] || 0,
    accuracy_in: r["Accuracy - In"] || 0,
    accuracy_out: r["Accuracy - Out"] || 0,
    face_image_out_url: r["Face Image - Out"] || "",
    face_image_file_url_in: r["Face Image File URL - In"] || r["Face Image File Url - In"] || "",
    reason_for_no_clock: r["Reason for No Clock"] || r["Reason For No Clock"] || "",
    request_update_end_time: r["Request Update End Time"] || "",
    face_image_file_url_out: r["Face Image File URL - Out"] || r["Face Image File Url - Out"] || "",
    request_update_start_time: r["Request Update Start Time"] || "",
    geo_location_in: geoIn ? (typeof geoIn === "object" ? (geoIn.address || `${geoIn.lat},${geoIn.lng}`) : geoIn) : "",
    geo_location_out: geoOut ? (typeof geoOut === "object" ? (geoOut.address || `${geoOut.lat},${geoOut.lng}`) : geoOut) : "",
    google_location_in: r["Google Location - In"] || "",
    google_location_out: r["Google Location - Out"] || "",
    status_in: r["O_Status - In"] || "",
    status_out: r["O_Status - Out"] || "",
    tags_in: r["Tags - in"] || r["Tag - In"] || [],
    tags_out: r["Tags - out"] || r["Tag - Out"] || [],
    work_location_in: r["N_Work Location"] || r["N_Work Location - In"] || "",
    work_location_out: r["N_Work Location - Out"] || "",
    photo_approval_in: r["O_Photo Approval"] || r["O_Photo Approval - In"] || "",
    photo_approval_out: r["O_Photo Approval Out"] || r["O_Photo Approval - Out"] || "",
    request_update_end_location: r["Request Update End Location"] || "",
    request_update_start_location: r["Request Update Start Location"] || "",
    dingding_in_attendance_id: r["Ding Ding In Attendance Id"] || r["DingDing In Attendance Id"] || "",
    dingding_out_attendance_id: r["Ding Ding Out Attendance Id"] || r["DingDing Out Attendance Id"] || "",
  };
}

async function syncEntity(base44, entityName, bubbleType, mapFn, constraints) {
  console.log(`--- Syncing ${entityName} ---`);
  
  // 1. Fetch Bubble records matching constraints
  const bubbleRecords = await fetchBubbleWithConstraints(bubbleType, constraints);
  console.log(`Fetched ${bubbleRecords.length} from Bubble`);
  
  if (bubbleRecords.length === 0) {
    return { fetched: 0, created: 0, alreadyExists: 0 };
  }

  // 2. Load existing bubble_ids from DB
  const existingIds = new Set();
  const pageSize = 5000;
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const batch = await base44.asServiceRole.entities[entityName].filter({}, 'id', pageSize, offset);
    for (const rec of batch) {
      if (rec.bubble_id) existingIds.add(rec.bubble_id);
    }
    offset += batch.length;
    if (batch.length < pageSize) hasMore = false;
    else await sleep(300);
  }
  console.log(`Existing DB records: ${existingIds.size}`);

  // 3. Filter to only new records
  const toCreate = [];
  let alreadyExists = 0;
  for (const raw of bubbleRecords) {
    if (!raw._id) continue;
    if (existingIds.has(raw._id)) { alreadyExists++; continue; }
    toCreate.push(mapFn(raw));
  }
  console.log(`New: ${toCreate.length}, Already exists: ${alreadyExists}`);

  // 4. Insert
  let created = 0;
  let errors = 0;
  for (let i = 0; i < toCreate.length; i += 20) {
    const batch = toCreate.slice(i, i + 20);
    try {
      await base44.asServiceRole.entities[entityName].bulkCreate(batch);
      created += batch.length;
    } catch (e) {
      // Try one-by-one
      for (const rec of batch) {
        try {
          await base44.asServiceRole.entities[entityName].create(rec);
          created++;
        } catch (e2) {
          errors++;
          if (errors <= 3) console.log(`Insert error: ${e2.message}`);
        }
        await sleep(50);
      }
    }
    await sleep(200);
  }

  console.log(`Created: ${created}, Errors: ${errors}`);
  return { fetched: bubbleRecords.length, created, alreadyExists, errors };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    // Default: sync records modified since yesterday 5pm HKT (= 9am UTC)
    const sinceISO = body.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const types = body.types || ["leave", "clockin"]; // which types to sync

    const dateConstraint = [{ key: "Modified Date", constraint_type: "greater than", value: sinceISO }];
    const results = {};

    if (types.includes("leave")) {
      results.BubbleLeave = await syncEntity(
        base44, "BubbleLeave", "leave", mapLeave, dateConstraint
      );
    }

    if (types.includes("clockin")) {
      results.BubbleClockin = await syncEntity(
        base44, "BubbleClockin", "clock-in", mapClockin, dateConstraint
      );
    }

    return Response.json({ success: true, since: sinceISO, results });
  } catch (error) {
    console.error("syncRecentBubble error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});