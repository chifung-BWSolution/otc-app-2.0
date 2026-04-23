import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const staffName = body.staffName || 'Iris Zhao';
  const fromDate = body.from || '2026-03-01';
  const toDate = body.to || '2026-03-31';

  // Load all man hour dates
  const all = [];
  let offset = 0;
  while (true) {
    const batch = await base44.asServiceRole.entities.BubbleManHourDate.filter({}, 'id', 5000, offset);
    all.push(...batch);
    if (batch.length < 5000) break;
    offset += batch.length;
  }

  const toHKTDate = (isoStr) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    return hkt.toISOString().slice(0, 10);
  };

  // Method 1: Old (slice)
  const oldMethod = all.filter(r => {
    if (r.staff_name !== staffName) return false;
    const rd = r.report_date?.slice(0, 10);
    return rd && rd >= fromDate && rd <= toDate;
  });

  // Method 2: New (HKT)
  const newMethod = all.filter(r => {
    if (r.staff_name !== staffName) return false;
    const rd = toHKTDate(r.report_date);
    return rd && rd >= fromDate && rd <= toDate;
  });

  const oldDates = [...new Set(oldMethod.map(r => r.report_date?.slice(0, 10)))].sort();
  const newDates = [...new Set(newMethod.map(r => toHKTDate(r.report_date)))].sort();
  
  const oldHours = oldMethod.reduce((s, r) => s + (r.total_work_hour || 0), 0);
  const newHours = newMethod.reduce((s, r) => s + (r.total_work_hour || 0), 0);

  // Find differences
  const onlyInOld = oldDates.filter(d => !newDates.includes(d));
  const onlyInNew = newDates.filter(d => !oldDates.includes(d));

  return Response.json({
    staffName,
    range: `${fromDate} ~ ${toDate}`,
    old_method: { count: oldMethod.length, unique_dates: oldDates.length, total_hours: oldHours, dates: oldDates },
    new_method: { count: newMethod.length, unique_dates: newDates.length, total_hours: newHours, dates: newDates },
    only_in_old: onlyInOld,
    only_in_new: onlyInNew,
  });
});