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
    for (let i = 0; i < records.length; i += 20) {
      const batch = records.slice(i, i + 20);
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await entity.bulkCreate(batch);
          created += batch.length;
          break;
        } catch (e) {
          console.log(`Batch ${Math.floor(i/20)} attempt ${attempt}: ${(e.message||"").substring(0,80)}`);
          if (attempt < 4) { await sleep(5000 * (attempt + 1)); continue; }
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

    console.log(`Done. Created: ${created}, Errors: ${errors}`);
    return Response.json({ success: true, deleted: 0, created, insertErrors: errors, totalInFile: records.length });
  } catch (error) {
    console.error("importBubbleData error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});