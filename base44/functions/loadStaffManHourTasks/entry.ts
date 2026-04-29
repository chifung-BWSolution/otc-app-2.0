import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const staffId = body.staff_id || user.linked_staff_id;
    const fyStart = body.fy_start; // e.g. "2025-04-01"
    const fyEnd = body.fy_end;     // e.g. "2026-03-31"

    if (!staffId || !fyStart || !fyEnd) {
      return Response.json({ error: 'Missing staff_id, fy_start, or fy_end' }, { status: 400 });
    }

    // Security: only allow loading own data unless admin
    if (staffId !== user.linked_staff_id && user.role !== 'admin' && user.role !== 'management') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use service role to bypass RLS
    const sr = base44.asServiceRole;

    // Load man hour dates for this staff
    const allDates = [];
    let offset = 0;
    while (true) {
      const batch = await sr.entities.BubbleManHourDate.filter(
        { staff_id: staffId }, "-report_date", 5000, offset
      );
      allDates.push(...batch);
      if (batch.length < 5000) break;
      offset += batch.length;
    }

    // Helper: parse date string to YYYY-MM-DD
    const toLocalDate = (val) => {
      if (!val) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      const cleaned = val.split(' ')[0];
      const parts = cleaned.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      if (val.includes('T')) {
        const dt = new Date(val);
        const hkt = new Date(dt.getTime() + 8 * 60 * 60 * 1000);
        return hkt.toISOString().slice(0, 10);
      }
      return null;
    };

    // Filter dates within FY range
    const fyDates = allDates.filter(d => {
      const rd = toLocalDate(d.report_date);
      return rd && rd >= fyStart && rd <= fyEnd;
    });

    const dateIdMap = {};
    for (const d of fyDates) {
      if (d.bubble_id) dateIdMap[d.bubble_id] = d.id;
    }
    const bubbleDateIds = new Set(Object.keys(dateIdMap));
    // Also map base44 IDs
    const base44DateIds = new Set(fyDates.map(d => d.id));

    console.log(`Staff ${staffId}: ${allDates.length} total dates, ${fyDates.length} in FY range`);

    // Load ALL tasks via service role in batches with throttle, then filter client-side
    const allTasks = [];
    offset = 0;
    const TASK_BATCH = 5000;
    while (true) {
      const batch = await sr.entities.BubbleManHourTask.filter(
        {}, "-created_date", TASK_BATCH, offset
      );
      allTasks.push(...batch);
      if (batch.length < TASK_BATCH) break;
      offset += batch.length;
      // Throttle between batches
      await new Promise(r => setTimeout(r, 300));
    }

    // Filter tasks belonging to this staff's FY dates
    const myTasks = allTasks.filter(t => {
      const mid = t.man_hour_date_id;
      return bubbleDateIds.has(mid) || base44DateIds.has(mid);
    });

    console.log(`Total tasks: ${allTasks.length}, matched: ${myTasks.length}`);

    // Also load lookup tables
    const [taskTypes, nosTasks, projects] = await Promise.all([
      sr.entities.NOSTaskType.filter({}, "display", 500),
      sr.entities.NOSTask.filter({}, "display", 500),
      sr.entities.BubbleProject.filter({}, "display_name", 5000),
    ]);

    return Response.json({
      tasks: myTasks,
      dates: fyDates,
      taskTypes,
      nosTasks,
      projects,
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});