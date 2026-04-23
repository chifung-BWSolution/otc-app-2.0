import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const staffName = body.staffName || null;

  // Load all man hour dates
  const all = [];
  let offset = 0;
  while (true) {
    const batch = await base44.asServiceRole.entities.BubbleManHourDate.filter({}, 'id', 5000, offset);
    all.push(...batch);
    if (batch.length < 5000) break;
    offset += batch.length;
  }

  // Group by staff_id + report_date (using HKT date)
  const toHKTDate = (isoStr) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    return hkt.toISOString().slice(0, 10);
  };

  const groups = {};
  for (const r of all) {
    if (staffName && r.staff_name !== staffName) continue;
    const hktDate = toHKTDate(r.report_date);
    const key = `${r.staff_id}|${hktDate}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({
      id: r.id,
      bubble_id: r.bubble_id,
      staff_name: r.staff_name,
      report_date: r.report_date,
      hkt_date: hktDate,
      total_work_hour: r.total_work_hour,
      created_date: r.created_date,
    });
  }

  // Find duplicates
  const duplicates = [];
  for (const [key, records] of Object.entries(groups)) {
    if (records.length > 1) {
      duplicates.push({
        key,
        staff_name: records[0].staff_name,
        hkt_date: records[0].hkt_date,
        count: records.length,
        records,
      });
    }
  }

  duplicates.sort((a, b) => a.staff_name.localeCompare(b.staff_name) || a.hkt_date.localeCompare(b.hkt_date));

  return Response.json({
    total_records: all.length,
    unique_groups: Object.keys(groups).length,
    duplicate_groups: duplicates.length,
    duplicate_records: duplicates.reduce((s, d) => s + d.count - 1, 0),
    samples: duplicates.slice(0, 20),
  });
});