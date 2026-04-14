import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchFromBubble(typeName, cursor, limit) {
  const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
  const url = `${baseUrl}/${typeName}?limit=${limit}&cursor=${cursor}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
  if (!res.ok) throw new Error(`Bubble API error: ${res.status}`);
  const json = await res.json();
  return json.response;
}

// Corrected mapping based on actual Bubble API field names
function mapClockin(r) {
  const geoIn = r["Geo Location - In"];
  const geoOut = r["Geo Location - Out"];
  const googleIn = r["Google Location - In"];
  const googleOut = r["Google Location - Out"];

  const formatGeo = (geo) => {
    if (!geo) return "";
    if (typeof geo === "string") return geo;
    return geo.address || `${geo.lat},${geo.lng}`;
  };

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
    geo_location_in: formatGeo(geoIn),
    geo_location_out: formatGeo(geoOut),
    google_location_in: formatGeo(googleIn),
    google_location_out: formatGeo(googleOut),
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
    const mode = body.mode || "preview"; // "preview" or "write"
    const limit = body.limit || 100;
    const cursor = body.cursor || 0;

    // Fetch from Bubble
    const bubbleResp = await fetchFromBubble("clock-in", cursor, limit);
    const rawRecords = bubbleResp.results || [];
    const remaining = bubbleResp.remaining || 0;

    // Map records
    const mapped = rawRecords.map(mapClockin);

    // Collect all Bubble raw field names
    const allBubbleKeys = new Set();
    for (const r of rawRecords) {
      for (const k of Object.keys(r)) allBubbleKeys.add(k);
    }

    // Known built-in / meta fields we intentionally skip
    const skippedKeys = new Set(["Created By", "Created Date", "Modified Date", "_type"]);

    // All Bubble keys we handle in mapping
    const handledKeys = new Set([
      "_id", "Prove - Out", "Remarks - In", "Remarks", "Face Image - In", "Prove - In",
      "Clock In Time", "OT minutes approved", "OT Minutes Approved", "Remarks - Out", "Staff",
      "Clock Out Time", "Late minutes", "Late Minutes", "Accuracy - In", "Accuracy - Out",
      "Face Image - Out", "Face Image File URL - In", "Reason for No Clock",
      "Request Update End Time", "Face Image File URL - Out", "Request Update Start Time",
      "Geo Location - In", "Geo Location - Out", "Google Location - In", "Google Location - Out",
      "O_Status - In", "O_Status - Out",
      "Tags - in", "Tags - out", "Tag - In", "Tag - Out",
      "N_Work Location - In", "N_Work Location", "N_Work Location - Out",
      "O_Photo Approval - In", "O_Photo Approval", "O_Photo Approval - Out", "O_Photo Approval Out",
      "Request Update End Location", "Request Update Start Location",
      "Ding Ding In Attendance Id", "Ding Ding Out Attendance Id",
    ]);

    const unmappedKeys = [...allBubbleKeys].filter(k => !handledKeys.has(k) && !skippedKeys.has(k)).sort();

    if (mode === "write") {
      // Check existing bubble_ids to avoid duplicates
      const existingIds = new Set();
      let existCursor = 0;
      let hasMore = true;
      while (hasMore) {
        const batch = await base44.asServiceRole.entities.BubbleClockin.filter({}, 'bubble_id', 5000, existCursor);
        for (const e of batch) {
          if (e.bubble_id) existingIds.add(e.bubble_id);
        }
        if (batch.length < 5000) hasMore = false;
        else { existCursor += batch.length; await sleep(500); }
      }

      const toCreate = mapped.filter(m => !existingIds.has(m.bubble_id));
      let created = 0;
      for (let i = 0; i < toCreate.length; i += 20) {
        const batch = toCreate.slice(i, i + 20);
        await base44.asServiceRole.entities.BubbleClockin.bulkCreate(batch);
        created += batch.length;
        await sleep(1000);
      }

      return Response.json({
        mode: "write",
        fetched: rawRecords.length,
        remaining,
        alreadyExisted: mapped.length - toCreate.length,
        created,
        unmappedBubbleFields: unmappedKeys,
        sampleMapped: mapped.slice(0, 2),
      });
    }

    // Preview mode
    return Response.json({
      mode: "preview",
      fetched: rawRecords.length,
      remaining,
      totalBubbleFields: allBubbleKeys.size,
      allBubbleFields: [...allBubbleKeys].sort(),
      unmappedBubbleFields: unmappedKeys,
      sampleRaw: rawRecords.slice(0, 2),
      sampleMapped: mapped.slice(0, 2),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});