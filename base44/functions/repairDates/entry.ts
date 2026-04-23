import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dryRun !== false;
  const all = [];
  let off = 0;
  while (true) {
    const b = await base44.asServiceRole.entities.BubbleManHourDate.filter({}, 'id', 5000, off);
    all.push(...b);
    if (b.length < 5000) break;
    off += b.length;
  }
  let fixed = 0, skip = 0, err = 0;
  const samp = [];
  for (const r of all) {
    if (!r.report_date || !r.report_date.includes('T16:00:00')) { skip++; continue; }
    const d = new Date(r.report_date);
    d.setUTCHours(d.getUTCHours() + 8);
    const nd = d.toISOString();
    if (samp.length < 5) samp.push({ old: r.report_date, new: nd, staff: r.staff_name });
    if (!dryRun) {
      try { await base44.asServiceRole.entities.BubbleManHourDate.update(r.id, { report_date: nd }); fixed++; }
      catch (e) { err++; }
    } else fixed++;
  }
  return Response.json({ dryRun, total: all.length, fix: fixed, skip, err, samp });
});