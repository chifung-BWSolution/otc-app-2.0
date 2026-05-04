import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const batchOffset = body.offset || 0;
    const batchSize = 100;

    const sr = base44.asServiceRole;

    // Load all staff to build name→bubble_id map
    const allStaff = await sr.entities.Staff.filter({}, "display_name", 5000);
    const nameToId = {};
    for (const s of allStaff) {
      if (s.bubble_id && s.display_name) {
        nameToId[s.display_name] = s.bubble_id;
      }
    }

    // Load one batch of clockins
    const batch = await sr.entities.BubbleClockin.filter({}, "id", batchSize, batchOffset);
    let fixed = 0;
    let needsFix = 0;

    for (const c of batch) {
      if (!c.staff_id && c.staff_name) {
        needsFix++;
        const mappedId = nameToId[c.staff_name];
        if (mappedId) {
          await sr.entities.BubbleClockin.update(c.id, { staff_id: mappedId });
          fixed++;
          await new Promise(r => setTimeout(r, 200));
        }
      }
    }

    const hasMore = batch.length === batchSize;

    return Response.json({
      success: true,
      batchOffset,
      batchSize: batch.length,
      needsFix,
      fixed,
      nextOffset: hasMore ? batchOffset + batchSize : null,
      hasMore,
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});