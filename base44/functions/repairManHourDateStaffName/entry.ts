import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const maxUpdates = body.maxUpdates || 200; // limit per invocation

    // Step 1: Load all Staff records to build bubble_id -> display_name map
    console.log("Loading Staff records...");
    const staffMap = {};
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.Staff.filter({}, 'id', 5000, offset);
      for (const s of batch) {
        if (s.bubble_id) {
          staffMap[s.bubble_id] = s.display_name || s.full_name || "";
        }
      }
      offset += batch.length;
      if (batch.length < 5000) hasMore = false;
      else await sleep(300);
    }
    console.log(`Staff map: ${Object.keys(staffMap).length} entries`);

    // Step 2: Load all BubbleManHourDate records
    console.log("Loading ManHourDate records...");
    const records = [];
    offset = 0;
    hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.BubbleManHourDate.filter({}, 'id', 5000, offset);
      records.push(...batch);
      offset += batch.length;
      if (batch.length < 5000) hasMore = false;
      else await sleep(300);
    }
    console.log(`ManHourDate records: ${records.length}`);

    // Step 3: Find records that need staff_name update
    const toUpdate = [];
    let alreadyCorrect = 0;
    let noStaffId = 0;
    let staffNotFound = 0;

    for (const rec of records) {
      if (!rec.staff_id) { noStaffId++; continue; }
      const name = staffMap[rec.staff_id];
      if (!name) { staffNotFound++; continue; }
      if (rec.staff_name === name) { alreadyCorrect++; continue; }
      toUpdate.push({ id: rec.id, staff_name: name });
    }

    console.log(`To update: ${toUpdate.length}, Already correct: ${alreadyCorrect}, No staff_id: ${noStaffId}, Staff not found: ${staffNotFound}`);

    if (dryRun) {
      return Response.json({
        dryRun: true,
        totalRecords: records.length,
        toUpdate: toUpdate.length,
        alreadyCorrect,
        noStaffId,
        staffNotFound,
        sample: toUpdate.slice(0, 5),
      });
    }

    // Step 4: Apply updates (limited per invocation)
    const batch = toUpdate.slice(0, maxUpdates);
    let updated = 0;
    let errors = 0;
    for (let i = 0; i < batch.length; i++) {
      const { id, staff_name } = batch[i];
      try {
        await base44.asServiceRole.entities.BubbleManHourDate.update(id, { staff_name });
        updated++;
      } catch (e) {
        if ((e.message || "").includes("Rate limit") || (e.message || "").includes("429")) {
          console.log(`Rate limited at ${updated}, waiting 30s...`);
          await sleep(30000);
          try {
            await base44.asServiceRole.entities.BubbleManHourDate.update(id, { staff_name });
            updated++;
          } catch { errors++; }
        } else {
          errors++;
          if (errors <= 5) console.log(`Error: ${(e.message || "").substring(0, 80)}`);
        }
      }
      // 2 updates then 8s pause to avoid rate limit
      if ((i + 1) % 2 === 0) await sleep(8000);
      if ((i + 1) % 20 === 0) console.log(`Progress: ${updated}/${batch.length}`);
    }

    const remaining = toUpdate.length - batch.length;
    console.log(`Done. Updated: ${updated}, Errors: ${errors}, Remaining: ${remaining}`);
    return Response.json({ success: true, totalRecords: records.length, updated, errors, alreadyCorrect, noStaffId, staffNotFound, remaining });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});