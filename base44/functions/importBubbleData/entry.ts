import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry(fn, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await fn(); }
    catch (e) {
      const msg = e.message || "";
      const isRetryable = e.status === 429 || msg.includes("Rate limit") || msg.includes("connection");
      if (isRetryable && attempt < maxRetries) {
        const wait = Math.min(5000 * Math.pow(2, attempt), 60000);
        console.log(`Retry ${attempt + 1}/${maxRetries}: ${msg.substring(0, 80)}, waiting ${wait}ms`);
        await sleep(wait);
        continue;
      }
      throw e;
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { entityName, dataUrl, mode } = await req.json();
    if (!entityName || !dataUrl) {
      return Response.json({ error: 'entityName and dataUrl are required' }, { status: 400 });
    }

    // 1. Fetch the pre-transformed data
    const fileResp = await fetch(dataUrl);
    const records = await fileResp.json();

    if (!Array.isArray(records) || records.length === 0) {
      return Response.json({ error: 'No records found in uploaded data' }, { status: 400 });
    }
    console.log(`Loaded ${records.length} records for ${entityName}, mode=${mode}`);

    const entity = base44.asServiceRole.entities[entityName];
    if (!entity) {
      return Response.json({ error: `Entity ${entityName} not found` }, { status: 400 });
    }

    // 2. Delete existing records if overwrite mode
    let totalDeleted = 0;
    if (mode === "overwrite") {
      console.log(`Deleting all existing ${entityName} records...`);
      for (let round = 0; round < 200; round++) {
        try {
          const result = await withRetry(() => entity.deleteMany({}));
          const d = result?.deleted || 0;
          totalDeleted += d;
          if (d === 0) break;
          console.log(`Delete round ${round + 1}: deleted ${d}, total: ${totalDeleted}`);
          // Longer pause between delete rounds to avoid connection errors
          await sleep(3000);
        } catch (e) {
          console.log(`Delete round ${round + 1} failed after retries: ${e.message}, continuing...`);
          // Wait even longer then try again
          await sleep(10000);
        }
      }
      console.log(`Total deleted: ${totalDeleted}`);
    }

    // 3. Insert records in batches
    let created = 0;
    let insertErrors = 0;
    const BATCH = 20;

    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      try {
        await withRetry(() => entity.bulkCreate(batch));
        created += batch.length;
      } catch (batchErr) {
        console.log(`Batch ${Math.floor(i/BATCH)+1} failed: ${batchErr.message}, trying one-by-one...`);
        for (const record of batch) {
          try {
            await withRetry(() => entity.create(record));
            created++;
          } catch (singleErr) {
            insertErrors++;
            if (insertErrors <= 10) {
              console.log(`Insert error: ${singleErr.message}`);
            }
          }
          await sleep(100);
        }
      }
      // Pace the inserts
      await sleep(500);
      if ((Math.floor(i / BATCH) + 1) % 10 === 0) {
        console.log(`Progress: ${created}/${records.length}`);
        await sleep(2000);
      }
    }

    console.log(`Done. Created: ${created}, Errors: ${insertErrors}`);

    return Response.json({
      success: true,
      deleted: totalDeleted,
      created,
      insertErrors,
      totalInFile: records.length,
    });
  } catch (error) {
    console.error("importBubbleData error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});