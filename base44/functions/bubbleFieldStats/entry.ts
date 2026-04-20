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

function isEmpty(val) {
  if (val === null || val === undefined || val === "") return true;
  if (val === 0) return true;
  if (val === false) return true;
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

    // Read ALL records from Bubble API (paginate through everything)
    const allRecords = [];
    let cursor = 0;
    const batchSize = 100;

    while (true) {
      const url = `${baseUrl}/${bubbleType}?limit=${batchSize}&cursor=${cursor}`;
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

    const totalRows = allRecords.length;

    // Analyze each field with exact counts
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
        const val = r[key];
        if (!isEmpty(val)) filled++;
      }

      fieldStats[key] = {
        sampleFilled: filled,
        sampleTotal: totalRows,
        estimatedFilled: filled,
        estimatedTotal: totalRows,
        percentage: totalRows > 0 ? Math.round((filled / totalRows) * 100) : 0,
      };
    }

    return Response.json({
      entityName,
      bubbleType,
      totalRows,
      sampleSize: totalRows,
      fieldCount: allKeys.size,
      fields: fieldStats,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});