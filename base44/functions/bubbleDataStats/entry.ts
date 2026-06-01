import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if a value is truly empty (null, undefined, empty string, empty array)
// Note: 0 and false are valid values, not empty
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

    if (!entityName) {
      return Response.json({ error: 'entityName is required' }, { status: 400 });
    }

    // Paginate through ALL records
    const allRecords = [];
    const pageSize = 5000;
    let hasMore = true;

    while (hasMore) {
      const batch = await base44.asServiceRole.entities[entityName].filter({}, 'id', pageSize, allRecords.length);
      allRecords.push(...batch);
      if (batch.length < pageSize) {
        hasMore = false;
      } else {
        await sleep(500);
      }
    }

    const totalCount = allRecords.length;

    if (totalCount === 0) {
      return Response.json({ entityName, totalCount: 0, fields: {} });
    }

    // Analyze field coverage using ALL records (exact count, no sampling needed)
    const allKeys = new Set();
    for (const rec of allRecords) {
      for (const key of Object.keys(rec)) {
        allKeys.add(key);
      }
    }

    const fieldStats = {};
    for (const key of allKeys) {
      if (['id', 'created_date', 'updated_date', 'created_by'].includes(key)) continue;

      let filledCount = 0;
      for (const rec of allRecords) {
        const val = rec[key];
        if (!isEmpty(val)) filledCount++;
      }

      fieldStats[key] = {
        filled: filledCount,
        empty: totalCount - filledCount,
        percentage: Math.round((filledCount / totalCount) * 100),
      };
    }

    return Response.json({ entityName, totalCount, fields: fieldStats });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});