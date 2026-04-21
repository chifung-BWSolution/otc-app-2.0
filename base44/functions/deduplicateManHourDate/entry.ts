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
    const dryRun = body.dryRun !== false;

    // Load ALL records
    console.log("Loading all BubbleManHourDate records...");
    const allRecords = [];
    const pageSize = 5000;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.BubbleManHourDate.filter({}, 'id', pageSize, allRecords.length);
      allRecords.push(...batch);
      if (batch.length < pageSize) hasMore = false;
      else await sleep(300);
    }
    console.log(`Total DB records: ${allRecords.length}`);

    // Find duplicates: group by bubble_id, keep the first (oldest id), mark rest for deletion
    const seen = {};
    const toDelete = [];
    const noBubbleId = [];

    for (const rec of allRecords) {
      if (!rec.bubble_id) {
        noBubbleId.push(rec.id);
        continue;
      }
      if (seen[rec.bubble_id]) {
        // This is a duplicate — delete this one (keep the first one we saw)
        toDelete.push(rec.id);
      } else {
        seen[rec.bubble_id] = rec.id;
      }
    }

    const uniqueCount = Object.keys(seen).length;
    console.log(`Unique bubble_ids: ${uniqueCount}`);
    console.log(`Duplicates to delete: ${toDelete.length}`);
    console.log(`Records without bubble_id: ${noBubbleId.length}`);

    if (dryRun) {
      return Response.json({
        dryRun: true,
        totalRecords: allRecords.length,
        uniqueBubbleIds: uniqueCount,
        duplicatesToDelete: toDelete.length,
        noBubbleId: noBubbleId.length,
        expectedAfterCleanup: uniqueCount + noBubbleId.length,
        sampleDuplicateIds: toDelete.slice(0, 5),
      });
    }

    // Delete duplicates + records without bubble_id
    const allToDelete = [...toDelete, ...noBubbleId];
    let deleted = 0;
    let errors = 0;
    for (const id of allToDelete) {
      try {
        await base44.asServiceRole.entities.BubbleManHourDate.delete(id);
        deleted++;
      } catch (e) {
        const is429 = e.status === 429 || (e.message || "").includes("Rate limit");
        const is404 = e.status === 404 || (e.message || "").includes("not found");
        if (is404) { deleted++; continue; } // already gone
        if (is429) {
          await sleep(3000);
          try { await base44.asServiceRole.entities.BubbleManHourDate.delete(id); deleted++; } catch { errors++; }
        } else { errors++; }
      }
      if (deleted % 50 === 0 && deleted > 0) console.log(`Deleted ${deleted}/${allToDelete.length}`);
      await sleep(50);
    }

    console.log(`Done. Deleted: ${deleted}, Errors: ${errors}`);
    return Response.json({
      success: true,
      totalRecords: allRecords.length,
      uniqueBubbleIds: uniqueCount,
      deleted,
      errors,
      expectedRemaining: allRecords.length - deleted,
    });
  } catch (error) {
    console.error("deduplicateManHourDate error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});