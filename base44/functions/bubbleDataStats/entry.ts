import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

    // Paginate through ALL records using list with sorting to get consistent pages
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

    // Analyze field coverage - sample up to 5000 evenly spread records for field analysis
    const sampleSize = Math.min(totalCount, 5000);
    const step = totalCount / sampleSize;
    const sample = [];
    for (let i = 0; i < sampleSize; i++) {
      sample.push(allRecords[Math.floor(i * step)]);
    }

    const allKeys = new Set();
    for (const rec of sample) {
      for (const key of Object.keys(rec)) {
        allKeys.add(key);
      }
    }

    const fieldStats = {};
    for (const key of allKeys) {
      if (['id', 'created_date', 'updated_date', 'created_by'].includes(key)) continue;

      let filledCount = 0;
      for (const rec of sample) {
        const val = rec[key];
        if (val !== null && val !== undefined && val !== '' && val !== 0 && val !== false) {
          if (Array.isArray(val) && val.length === 0) continue;
          filledCount++;
        }
      }

      fieldStats[key] = {
        filled: Math.round((filledCount / sampleSize) * totalCount),
        empty: Math.round(((sampleSize - filledCount) / sampleSize) * totalCount),
        percentage: Math.round((filledCount / sampleSize) * 100),
        sample_size: sampleSize
      };
    }

    return Response.json({ entityName, totalCount, fields: fieldStats });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});