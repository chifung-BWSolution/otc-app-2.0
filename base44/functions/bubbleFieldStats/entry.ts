import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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
};

// Check if a value is truly empty (null, undefined, empty string, empty array)
// IMPORTANT: 0 and false are valid values, NOT empty
function isEmpty(val) {
  if (val === null || val === undefined || val === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const entityName = body.entityName;
    if (!entityName || !BUBBLE_TYPE_MAP[entityName]) {
      return Response.json({ error: 'entityName is required and must be a valid Bubble entity' }, { status: 400 });
    }

    const bubbleType = BUBBLE_TYPE_MAP[entityName];
    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');

    // Step 1: Get total count
    const countRes = await fetch(`${baseUrl}/${bubbleType}?limit=1&cursor=0`, {
      headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` }
    });
    if (!countRes.ok) throw new Error(`Bubble API error: ${countRes.status}`);
    const countJson = await countRes.json();
    const totalRows = (countJson.response?.results?.length || 0) + (countJson.response?.remaining || 0);

    // Step 2: Sample records - use larger sample for better accuracy
    // For tables <2000 read all, otherwise sample ~2000 records spread evenly
    const targetSample = Math.min(totalRows, 2000);
    const batchSize = 100;
    const numBatches = Math.ceil(targetSample / batchSize);
    const step = totalRows > targetSample ? Math.floor(totalRows / numBatches) : 0;

    const allSamples = [];
    for (let i = 0; i < numBatches; i++) {
      const cursor = step > 0 ? i * step : i * batchSize;
      if (cursor >= totalRows) break;
      const limit = Math.min(batchSize, totalRows - cursor);
      const url = `${baseUrl}/${bubbleType}?limit=${limit}&cursor=${cursor}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
      if (res.ok) {
        const json = await res.json();
        allSamples.push(...(json.response?.results || []));
      }
      await sleep(200);
    }

    // Step 3: Analyze each field
    const builtIn = new Set(["_id", "_type", "Created By", "Created Date", "Modified Date"]);
    const allKeys = new Set();
    for (const r of allSamples) {
      for (const k of Object.keys(r)) {
        if (!builtIn.has(k)) allKeys.add(k);
      }
    }

    const sampleCount = allSamples.length;
    const fieldStats = {};

    for (const key of allKeys) {
      let filled = 0;
      for (const r of allSamples) {
        const val = r[key];
        if (!isEmpty(val)) filled++;
      }

      // Extrapolate to total rows
      const fillRate = sampleCount > 0 ? filled / sampleCount : 0;
      const estimatedFilled = Math.round(fillRate * totalRows);

      fieldStats[key] = {
        sampleFilled: filled,
        sampleTotal: sampleCount,
        estimatedFilled,
        estimatedTotal: totalRows,
        percentage: Math.round(fillRate * 100),
      };
    }

    return Response.json({
      entityName,
      bubbleType,
      totalRows,
      sampleSize: sampleCount,
      fieldCount: allKeys.size,
      fields: fieldStats,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});