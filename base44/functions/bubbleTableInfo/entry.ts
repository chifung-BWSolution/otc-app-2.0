import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

// Map of entity names to Bubble type names
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const entityName = body.entityName; // optional: fetch one specific entity

    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
    const results = {};

    const typesToCheck = entityName
      ? { [entityName]: BUBBLE_TYPE_MAP[entityName] }
      : BUBBLE_TYPE_MAP;

    for (const [entity, bubbleType] of Object.entries(typesToCheck)) {
      if (!bubbleType) {
        results[entity] = { error: `No Bubble type mapping for ${entity}` };
        continue;
      }

      // Fetch just 1 record to get total count + all field names
      const url = `${baseUrl}/${bubbleType}?limit=1&cursor=0`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` }
      });

      if (!res.ok) {
        const txt = await res.text();
        results[entity] = { error: `${res.status}: ${txt.substring(0, 200)}` };
        continue;
      }

      const json = await res.json();
      const items = json.response?.results || [];
      const remaining = json.response?.remaining || 0;
      const totalRows = items.length + remaining;

      // Collect field names from this single record (may not have all fields)
      // To get more fields, fetch a few more records from different cursors
      const fieldSet = new Set();
      
      // Fetch a few samples from different parts of the dataset for better field coverage
      const cursors = [0];
      if (totalRows > 100) cursors.push(Math.floor(totalRows / 2));
      if (totalRows > 500) cursors.push(Math.floor(totalRows * 0.8));

      for (const c of cursors) {
        const sampleUrl = `${baseUrl}/${bubbleType}?limit=20&cursor=${c}`;
        const sampleRes = await fetch(sampleUrl, {
          headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` }
        });
        if (sampleRes.ok) {
          const sampleJson = await sampleRes.json();
          const sampleItems = sampleJson.response?.results || [];
          for (const item of sampleItems) {
            for (const key of Object.keys(item)) {
              fieldSet.add(key);
            }
          }
        }
      }

      // Remove built-in Bubble meta fields
      const builtIn = new Set(["_id", "_type", "Created By", "Created Date", "Modified Date"]);
      const userFields = [...fieldSet].filter(f => !builtIn.has(f)).sort();

      results[entity] = {
        bubbleType,
        bubbleTotalRows: totalRows,
        bubbleFields: userFields,
        bubbleFieldCount: userFields.length,
      };
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});