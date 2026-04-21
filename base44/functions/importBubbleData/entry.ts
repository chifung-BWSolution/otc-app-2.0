import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { entityName, dataUrl } = await req.json();
    if (!entityName || !dataUrl) {
      return Response.json({ error: 'entityName and dataUrl are required' }, { status: 400 });
    }

    const fileResp = await fetch(dataUrl);
    const records = await fileResp.json();
    if (!Array.isArray(records) || records.length === 0) {
      return Response.json({ error: 'No records in uploaded data' }, { status: 400 });
    }
    console.log(`${entityName}: ${records.length} records to insert`);

    const entity = base44.asServiceRole.entities[entityName];

    let created = 0;
    let errors = 0;
    const BATCH_SIZE = 20;
    const PAUSE_BETWEEN_BATCHES = 1500;       // 1.5s between batches
    const PAUSE_EVERY_100 = 8000;             // 8s every 100 records
    const RATE_LIMIT_WAIT = 30000;            // 30s when rate limited

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      let success = false;

      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          await entity.bulkCreate(batch);
          created += batch.length;
          success = true;
          break;
        } catch (e) {
          const msg = (e.message || "").substring(0, 100);
          const isRateLimit = msg.includes("Rate limit") || msg.includes("429");

          if (isRateLimit) {
            const wait = RATE_LIMIT_WAIT * (attempt + 1); // 30s, 60s, 90s...
            console.log(`Rate limited at ${created}, waiting ${wait/1000}s (attempt ${attempt})...`);
            await sleep(wait);
            continue;
          }

          // Validation or other error — try one by one
          console.log(`Batch error: ${msg}, inserting one by one...`);
          for (const rec of batch) {
            try {
              await entity.create(rec);
              created++;
            } catch (e2) {
              errors++;
              if (errors <= 10) console.log(`Skip record: ${(e2.message||"").substring(0, 80)}`);
            }
            await sleep(300);
          }
          success = true;
          break;
        }
      }

      if (!success) {
        // All 6 attempts rate limited — still try one by one slowly
        console.log(`All attempts failed for batch at ${i}, trying one by one with long pauses...`);
        for (const rec of batch) {
          await sleep(2000);
          try { await entity.create(rec); created++; }
          catch { errors++; }
        }
      }

      await sleep(PAUSE_BETWEEN_BATCHES);

      // Extra pause every 100 records to stay under rate limit
      if (created > 0 && created % 100 < BATCH_SIZE) {
        console.log(`Progress: ${created}/${records.length} (errors: ${errors})`);
        await sleep(PAUSE_EVERY_100);
      }
    }

    console.log(`Done. Created: ${created}, Errors: ${errors}`);
    return Response.json({ success: true, deleted: 0, created, insertErrors: errors, totalInFile: records.length });
  } catch (error) {
    console.error("importBubbleData error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});