import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    // Fetch up to 50000 records to count and analyze fields
    const records = await base44.asServiceRole.entities[entityName].filter({}, '-created_date', 50000);
    const totalCount = records.length;

    if (totalCount === 0) {
      return Response.json({ entityName, totalCount: 0, fields: {} });
    }

    // Analyze field coverage
    const fieldStats = {};
    const sampleRecord = records[0];
    const allKeys = new Set();

    // Collect all keys from all records
    for (const rec of records) {
      for (const key of Object.keys(rec)) {
        allKeys.add(key);
      }
    }

    for (const key of allKeys) {
      // Skip built-in fields
      if (['id', 'created_date', 'updated_date', 'created_by'].includes(key)) continue;

      let filledCount = 0;
      for (const rec of records) {
        const val = rec[key];
        if (val !== null && val !== undefined && val !== '' && val !== 0 && val !== false) {
          if (Array.isArray(val) && val.length === 0) continue;
          filledCount++;
        }
      }

      fieldStats[key] = {
        filled: filledCount,
        empty: totalCount - filledCount,
        percentage: Math.round((filledCount / totalCount) * 100)
      };
    }

    return Response.json({ entityName, totalCount, fields: fieldStats });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});