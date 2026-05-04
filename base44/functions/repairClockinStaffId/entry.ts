import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'scan'; // 'scan' or 'fix'
    const sr = base44.asServiceRole;

    // Load all staff to build name→bubble_id map
    const allStaff = await sr.entities.Staff.filter({}, "display_name", 5000);
    const nameToId = {};
    for (const s of allStaff) {
      if (s.bubble_id && s.display_name) {
        nameToId[s.display_name] = s.bubble_id;
      }
    }

    if (mode === 'scan') {
      // Just scan and report unique staff_names with null staff_id
      const nullRecords = [];
      let offset = 0;
      while (true) {
        const batch = await sr.entities.BubbleClockin.filter({ staff_id: null }, "id", 5000, offset);
        nullRecords.push(...batch);
        if (batch.length < 5000) break;
        offset += batch.length;
        await new Promise(r => setTimeout(r, 1000));
      }

      // Count by staff_name
      const nameCounts = {};
      for (const c of nullRecords) {
        const name = c.staff_name || '(empty)';
        if (!nameCounts[name]) nameCounts[name] = { count: 0, hasMapping: !!nameToId[name], bubble_id: nameToId[name] || null };
        nameCounts[name].count++;
      }

      return Response.json({
        total_null_staff_id: nullRecords.length,
        unique_names: Object.keys(nameCounts).length,
        breakdown: nameCounts,
      });
    }

    return Response.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});