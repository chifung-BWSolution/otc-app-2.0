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

// Compare two values, treating empty-ish values as equal
function valuesMatch(dbVal, bubbleVal) {
  // Both empty
  const dbEmpty = dbVal === null || dbVal === undefined || dbVal === "" || dbVal === 0 || dbVal === false;
  const bEmpty = bubbleVal === null || bubbleVal === undefined || bubbleVal === "" || bubbleVal === 0 || bubbleVal === false;
  if (dbEmpty && bEmpty) return true;
  // Array comparison
  if (Array.isArray(dbVal) && Array.isArray(bubbleVal)) {
    if (dbVal.length === 0 && bubbleVal.length === 0) return true;
    return JSON.stringify(dbVal) === JSON.stringify(bubbleVal);
  }
  return dbVal === bubbleVal;
}

// Fields to skip in comparison (staff_name is derived, not from Bubble)
const SKIP_FIELDS = new Set(["bubble_id", "staff_name"]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const bubbleCursor = body.cursor || 0;
    const maxScan = body.maxScan || 500;
    const dryRun = body.dryRun || false;

    // Step 1: Load DB records into a map by bubble_id
    console.log("Loading DB records...");
    const dbMap = {}; // bubble_id -> full record
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.BubbleClockin.filter({}, 'id', 5000, offset);
      for (const r of batch) {
        if (r.bubble_id) dbMap[r.bubble_id] = r;
      }
      offset += batch.length;
      if (batch.length < 5000) hasMore = false;
      else await sleep(500);
    }
    console.log(`Loaded ${Object.keys(dbMap).length} DB records`);

    // Step 2: Fetch Bubble records in batches
    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
    const updates = []; // { dbId, data }
    let cursor = bubbleCursor;
    let totalScanned = 0;
    let bubbleRemaining = 0;

    while (totalScanned < maxScan) {
      const url = `${baseUrl}/clock-in?limit=100&cursor=${cursor}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
      if (!res.ok) break;
      const json = await res.json();
      const results = json.response?.results || [];
      bubbleRemaining = json.response?.remaining || 0;

      for (const r of results) {
        const dbRec = dbMap[r._id];
        if (!dbRec) continue; // missing record, handled by repairMissingClockins

        const mapped = mapClockin(r);
        const diff = {};

        for (const [key, bubbleVal] of Object.entries(mapped)) {
          if (SKIP_FIELDS.has(key)) continue;
          if (!valuesMatch(dbRec[key], bubbleVal)) {
            // Only update if bubble has a non-empty value, or DB has a wrong value
            diff[key] = bubbleVal;
          }
        }

        if (Object.keys(diff).length > 0) {
          updates.push({ dbId: dbRec.id, bubbleId: r._id, diff });
        }
      }

      totalScanned += results.length;
      if (results.length < 100 || bubbleRemaining === 0) break;
      cursor += results.length;
      await sleep(200);
    }

    console.log(`Scanned ${totalScanned}, found ${updates.length} records needing update`);

    if (dryRun) {
      // Show sample diffs
      const sample = updates.slice(0, 5).map(u => ({
        dbId: u.dbId,
        bubbleId: u.bubbleId,
        changedFields: Object.keys(u.diff),
        diff: u.diff,
      }));
      return Response.json({
        dryRun: true,
        scanned: totalScanned,
        needUpdate: updates.length,
        nextCursor: totalScanned < maxScan ? null : bubbleCursor + totalScanned,
        sample,
      });
    }

    // Step 3: Apply updates - max 40 per invocation to avoid timeout
    const maxUpdates = body.maxUpdates || 40;
    const toApply = updates.slice(0, maxUpdates);
    let updated = 0;
    let errors = 0;
    let skipped = updates.length - toApply.length;

    for (let i = 0; i < toApply.length; i++) {
      const u = toApply[i];
      try {
        await base44.asServiceRole.entities.BubbleClockin.update(u.dbId, u.diff);
        updated++;
      } catch (err) {
        if (err.message?.includes('Rate limit') || err.message?.includes('429')) {
          console.log(`Rate limited at ${updated}, waiting 30s...`);
          await sleep(30000);
          try {
            await base44.asServiceRole.entities.BubbleClockin.update(u.dbId, u.diff);
            updated++;
          } catch (err2) {
            errors++;
            console.log(`Error after retry: ${err2.message}`);
          }
        } else {
          errors++;
          console.log(`Error updating ${u.dbId}: ${err.message}`);
        }
      }
      // 3 updates then 8s pause
      if ((i + 1) % 3 === 0) await sleep(8000);
    }

    const nextCursor = totalScanned < maxScan ? null : bubbleCursor + totalScanned;

    return Response.json({
      success: true,
      scanned: totalScanned,
      needUpdate: updates.length,
      applied: toApply.length,
      updated,
      errors,
      skipped,
      nextCursor: skipped > 0 ? bubbleCursor : nextCursor,
      done: nextCursor === null && skipped === 0,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});