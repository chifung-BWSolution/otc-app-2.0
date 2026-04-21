import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
      return Response.json({ error: 'No records in uploaded data' }, { status: 400 });
    }
    console.log(`${entityName}: ${records.length} records to import, mode=${mode}`);

    const entity = base44.asServiceRole.entities[entityName];

    // 2. Delete all if overwrite
    let totalDeleted = 0;
    if (mode === "overwrite") {
      console.log("Clearing all records...");
      for (let round = 0; round < 500; round++) {
        let d = 0;
        try {
          const r = await entity.deleteMany({});
          d = r?.deleted || 0;
        } catch (e) {
          console.log(`Delete error (round ${round}): ${(e.message || "").substring(0, 60)}`);
          await sleep(15000); // wait 15s on error then retry
          continue;
        }
        totalDeleted += d;
        if (d === 0) break;
        console.log(`Deleted ${d}, total: ${totalDeleted}`);
        await sleep(2000);
      }
      console.log(`Clear done: ${totalDeleted} deleted`);
    }

    // 3. Insert in batches of 20
    let created = 0;
    let errors = 0;
    for (let i = 0; i < records.length; i += 20) {
      const batch = records.slice(i, i + 20);
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await entity.bulkCreate(batch);
          created += batch.length;
          break;
        } catch (e) {
          console.log(`Insert batch ${Math.floor(i/20)} attempt ${attempt}: ${(e.message||"").substring(0,60)}`);
          if (attempt < 4) { await sleep(5000 * (attempt + 1)); continue; }
          // Last resort: one by one
          for (const rec of batch) {
            try { await entity.create(rec); created++; }
            catch { errors++; }
            await sleep(200);
          }
        }
      }
      await sleep(300);
      if (created % 200 === 0 && created > 0) {
        console.log(`Inserted ${created}/${records.length}`);
        await sleep(2000);
      }
    }

    console.log(`Done. Deleted: ${totalDeleted}, Created: ${created}, Errors: ${errors}`);
    return Response.json({ success: true, deleted: totalDeleted, created, insertErrors: errors, totalInFile: records.length });
  } catch (error) {
    console.error("importBubbleData error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});