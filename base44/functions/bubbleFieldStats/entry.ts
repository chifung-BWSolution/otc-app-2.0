import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const BUBBLE_TYPE_MAP = {
  "Staff": "staff",
  "BubbleOT": "ot",
  "BubbleLeave": "leave",
  "BubbleClockin": "clock-in",
  "BubbleManHourDate": "man_hour_date",
  "BubbleManHourTask": "man_hour_report",
  "BubbleProject": "project",
  "BubbleStaffKPI": "man_hour_month",
  "BubbleStaffKPIMonth": "staff_kpi_month",
  "StaffInformation": "Staff Information",
};

const KNOWN_FIELDS = {
  "BubbleManHourTask": [
    "Asana Link", "Work Hour", "Images", "Keywords", "Meeting Topic",
    "Output Count", "Task Description", "N_Task", "Project", "N_Brand",
    "Meeting Invite Sent", "Projects", "N_Task Type", "Man Hour Date",
    "Meeting Participant", "O_Meeting Method", "N_Output & Unit",
    "N_Work Location", "O_Meeting Duration", "O_Meeting Request Date",
  ],
  "BubbleClockin": [
    "Prove - Out", "Remarks", "Remarks - In", "Face Image - In", "Prove - In",
    "Clock In Time", "OT Minutes Approved", "Remarks - Out", "Staff",
    "Clock Out Time", "Late Minutes", "Accuracy - In", "Accuracy - Out",
    "Face Image - Out", "Face Image File URL - In", "Reason for No Clock",
    "Request Update End Time", "Face Image File URL - Out",
    "Request Update Start Time", "Geo Location - In", "Geo Location - Out",
    "Google Location - In", "Google Location - Out", "O_Status - In",
    "O_Status - Out", "Tags - in", "Tags - out", "N_Work Location",
    "N_Work Location - Out", "O_Photo Approval - In", "O_Photo Approval - Out",
    "Request Update End Location", "Request Update Start Location",
    "Ding Ding In Attendance Id", "Ding Ding Out Attendance Id",
  ],
};

Deno.serve(async (req) => {
  try {
    const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
    const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const entityName = body.entityName;

    console.log(`bubbleFieldStats called for entity: "${entityName}"`);

    if (!entityName || !BUBBLE_TYPE_MAP[entityName]) {
      console.log(`Invalid entity: "${entityName}", valid entities: ${Object.keys(BUBBLE_TYPE_MAP).join(', ')}`);
      return Response.json({ error: `entityName "${entityName}" is not valid. Valid: ${Object.keys(BUBBLE_TYPE_MAP).join(', ')}` }, { status: 400 });
    }

    const bubbleType = BUBBLE_TYPE_MAP[entityName];
    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');

    // Step 1: Get total count
    const countUrl = `${baseUrl}/${encodeURIComponent(bubbleType)}?limit=1&cursor=0`;
    const countRes = await fetch(countUrl, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
    if (!countRes.ok) throw new Error(`Bubble API error: ${countRes.status}`);
    const countJson = await countRes.json();
    const countResults = countJson.response?.results || [];
    const totalRows = countResults.length + (countJson.response?.remaining || 0);
    console.log(`Total rows: ${totalRows}`);

    // Step 2: For small entities (<5000), do full scan
    // For large entities, use constraint-based counting per field
    const FULL_SCAN_LIMIT = 5000;

    if (totalRows <= FULL_SCAN_LIMIT) {
      const allRecords = [];
      let cursor = 0;
      while (true) {
        const url = `${baseUrl}/${encodeURIComponent(bubbleType)}?limit=100&cursor=${cursor}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
        if (!res.ok) throw new Error(`Bubble API error: ${res.status}`);
        const json = await res.json();
        const results = json.response?.results || [];
        allRecords.push(...results);
        const remaining = json.response?.remaining || 0;
        if (remaining === 0 || results.length === 0) break;
        cursor += results.length;
        await sleep(200);
      }

      const builtIn = new Set(["_id", "_type", "Created By", "Created Date", "Modified Date"]);
      const allKeys = new Set();
      for (const r of allRecords) {
        for (const k of Object.keys(r)) {
          if (!builtIn.has(k)) allKeys.add(k);
        }
      }

      const fieldStats = {};
      for (const key of allKeys) {
        let filled = 0;
        for (const r of allRecords) {
          if (r[key] !== null && r[key] !== undefined && r[key] !== "" && 
              !(Array.isArray(r[key]) && r[key].length === 0)) {
            filled++;
          }
        }
        fieldStats[key] = {
          sampleFilled: filled, sampleTotal: allRecords.length,
          estimatedFilled: filled, estimatedTotal: totalRows,
          percentage: totalRows > 0 ? Math.round((filled / totalRows) * 100) : 0,
        };
      }

      return Response.json({ entityName, bubbleType, totalRows, sampleSize: allRecords.length, fieldCount: allKeys.size, fields: fieldStats });
    }

    // Step 3: Large entity — discover fields from samples, then count each via constraints
    console.log("Large entity mode: constraint-based counting");

    const fieldSet = new Set();
    const samplePositions = [0, Math.floor(totalRows / 3), Math.floor(totalRows * 2 / 3)];
    for (const pos of samplePositions) {
      const url = `${baseUrl}/${encodeURIComponent(bubbleType)}?limit=30&cursor=${pos}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
      if (res.ok) {
        const json = await res.json();
        for (const r of (json.response?.results || [])) {
          for (const k of Object.keys(r)) fieldSet.add(k);
        }
      }
      await sleep(100);
    }

    if (KNOWN_FIELDS[entityName]) {
      for (const f of KNOWN_FIELDS[entityName]) fieldSet.add(f);
    }

    const builtIn = new Set(["_id", "_type", "Created By", "Created Date", "Modified Date"]);
    const fields = [...fieldSet].filter(f => !builtIn.has(f)).sort();
    console.log(`Discovered ${fields.length} fields, counting each...`);

    const fieldStats = {};
    for (const field of fields) {
      const constraints = JSON.stringify([{ key: field, constraint_type: "is_not_empty" }]);
      const url = `${baseUrl}/${encodeURIComponent(bubbleType)}?limit=1&cursor=0&constraints=${encodeURIComponent(constraints)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
      if (!res.ok) {
        console.log(`Failed to count field "${field}": ${res.status}`);
        fieldStats[field] = {
          sampleFilled: 0, sampleTotal: totalRows,
          estimatedFilled: 0, estimatedTotal: totalRows, percentage: 0,
        };
        await sleep(100);
        continue;
      }
      const json = await res.json();
      const results = json.response?.results || [];
      const remaining = json.response?.remaining || 0;
      const filled = results.length + remaining;

      fieldStats[field] = {
        sampleFilled: filled, sampleTotal: totalRows,
        estimatedFilled: filled, estimatedTotal: totalRows,
        percentage: totalRows > 0 ? Math.round((filled / totalRows) * 100) : 0,
      };
      await sleep(150);
    }

    console.log(`Done counting ${fields.length} fields`);

    return Response.json({
      entityName, bubbleType, totalRows,
      sampleSize: totalRows,
      fieldCount: fields.length,
      fields: fieldStats,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});