import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Load all NOSTask records
    const all = [];
    let offset = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.NOSTask.filter({}, 'id', 5000, offset);
      all.push(...batch);
      if (batch.length < 5000) break;
      offset += batch.length;
    }
    console.log(`Total NOSTask records: ${all.length}`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < all.length; i++) {
      const rec = all[i];
      const ids = rec.task_type_ids || [];
      
      // Check if any element contains comma/space separator (needs splitting)
      const needsFix = ids.some(id => id.includes(',') || id.includes(' , '));
      if (!needsFix) {
        skipped++;
        continue;
      }

      // Split all elements and flatten
      const newIds = [];
      for (const raw of ids) {
        const parts = raw.split(/\s*,\s*/).map(s => s.trim()).filter(Boolean);
        newIds.push(...parts);
      }

      try {
        await base44.asServiceRole.entities.NOSTask.update(rec.id, { task_type_ids: newIds });
        fixed++;
      } catch (e) {
        errors++;
        if (errors <= 5) console.log(`Error updating ${rec.id}: ${e.message}`);
      }

      // Rate limit protection
      if ((i + 1) % 5 === 0) await sleep(1000);
      if ((i + 1) % 50 === 0) console.log(`Progress: ${i + 1}/${all.length}, fixed: ${fixed}`);
    }

    console.log(`Done. Fixed: ${fixed}, Skipped: ${skipped}, Errors: ${errors}`);
    return Response.json({ success: true, total: all.length, fixed, skipped, errors });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});