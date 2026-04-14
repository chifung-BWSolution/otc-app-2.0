import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function formatGeo(geo) {
  if (!geo) return "";
  if (typeof geo === "string") return geo;
  return geo.address || `${geo.lat},${geo.lng}`;
}

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
    staff_name: "",
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batchSize || 100;
    const startCursor = body.cursor || 0;

    // Step 1: Load all existing bubble_ids from DB
    console.log("Loading existing DB bubble_ids...");
    const existingIds = new Set();
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.BubbleClockin.filter({}, 'bubble_id', 5000, offset);
      for (const r of batch) {
        if (r.bubble_id) existingIds.add(r.bubble_id);
      }
      offset += batch.length;
      if (batch.length < 5000) hasMore = false;
      else await sleep(500);
    }
    console.log(`DB has ${existingIds.size} records`);

    // Step 2: Scan Bubble in batches, find missing ones
    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
    const missing = [];
    let cursor = startCursor;
    let totalScanned = 0;
    let bubbleRemaining = 0;

    // Scan up to 2000 Bubble records per invocation to avoid timeout
    while (totalScanned < 2000) {
      const url = `${baseUrl}/clock-in?limit=${batchSize}&cursor=${cursor}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
      if (!res.ok) {
        const txt = await res.text();
        console.log(`Bubble error at cursor ${cursor}: ${res.status}`);
        break;
      }
      const json = await res.json();
      const results = json.response?.results || [];
      bubbleRemaining = json.response?.remaining || 0;

      for (const r of results) {
        if (!existingIds.has(r._id)) {
          missing.push(mapClockin(r));
        }
      }

      totalScanned += results.length;
      if (results.length < batchSize || bubbleRemaining === 0) break;
      cursor += results.length;
      await sleep(200);
    }

    console.log(`Scanned ${totalScanned} Bubble records from cursor ${startCursor}, found ${missing.length} missing`);

    // Step 3: Create missing records
    let created = 0;
    for (let i = 0; i < missing.length; i += 20) {
      const batch = missing.slice(i, i + 20);
      try {
        await base44.asServiceRole.entities.BubbleClockin.bulkCreate(batch);
        created += batch.length;
      } catch (err) {
        if (err.message?.includes('Rate limit') || err.message?.includes('429')) {
          console.log(`Rate limited, waiting 10s...`);
          await sleep(10000);
          try {
            await base44.asServiceRole.entities.BubbleClockin.bulkCreate(batch);
            created += batch.length;
          } catch (err2) {
            console.log(`Error after retry: ${err2.message}`);
          }
        } else {
          console.log(`Error: ${err.message}`);
        }
      }
      await sleep(1000);
    }

    const nextCursor = totalScanned < 2000 ? null : startCursor + totalScanned;

    return Response.json({
      success: true,
      dbExisting: existingIds.size,
      scanned: totalScanned,
      startCursor,
      missingFound: missing.length,
      created,
      nextCursor,
      bubbleRemaining,
      done: nextCursor === null,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});