import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dryRun !== false;

  const all = [];
  let offset = 0;
  while (true) {
    const batch = await base44.asServiceRole.entities.BubbleManHourDate.filter({}, 'id', 5000, offset);
    all.push(...batch);
    if (batch.length < 5000) break;
    offset += batch.length;
  }

  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const samples = [];

  for (const record of all) {
    const rd = record.report_date;
    if (!rd || !rd.includes('T16:00:00')) { skippedCount++; continue; }

    const d = new Date(rd);
    d.setUTCHours(d.getUTCHours() + 8);
    const newDate = d.toISOString();

    if (samples.length < 5) {
      samples.push({ bubble_id: record.bubble_id, old: rd, new: newDate, staff: record.staff_name });
    }

    if (!dryRun) {
      try {
        await base44.asServiceRole.entities.BubbleManHourDate.update(record.id, { report_date: newDate });
        fixedCount++;
      } catch (e) {
        errorCount++;
      }
    } else {
      fixedCount++;
    }
  }

  return Response.json({ dryRun, total: all.length, needsFix: fixedCount, skipped: skippedCount, errors: errorCount, samples });
});