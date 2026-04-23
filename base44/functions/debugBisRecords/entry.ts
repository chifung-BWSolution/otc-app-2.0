import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const staffBubbleId = '1731049915748x916598872489261300';

  // Load ALL ManHourDate records for this staff
  const all = [];
  let offset = 0;
  while (true) {
    const batch = await base44.asServiceRole.entities.BubbleManHourDate.filter(
      { staff_id: staffBubbleId }, 'id', 5000, offset
    );
    all.push(...batch);
    if (batch.length < 5000) break;
    offset += batch.length;
  }

  // Show March 2026 records specifically
  const marchRecords = all.filter(r => {
    const rd = r.report_date;
    if (!rd) return false;
    // Check if it falls in March 2026 regardless of format
    if (rd.startsWith('2026-03')) return true;
    // Legacy format: T16:00:00Z means the HKT date is next day
    if (rd.includes('2026-02') && rd.includes('T16:00:00')) return true; // Feb 28 T16 = Mar 1 HKT
    if (rd.includes('2026-03') && rd.includes('T')) return true;
    return false;
  });

  // Parse to local date for display
  const toLocalDate = (isoStr) => {
    if (!isoStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return isoStr;
    if (isoStr.includes('T')) {
      const d = new Date(isoStr);
      const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
      return hkt.toISOString().slice(0, 10);
    }
    return isoStr?.slice(0, 10);
  };

  const records = marchRecords
    .map(r => ({
      id: r.id,
      bubble_id: r.bubble_id,
      report_date_raw: r.report_date,
      report_date_local: toLocalDate(r.report_date),
      total_work_hour: r.total_work_hour,
      staff_name: r.staff_name,
      created_date: r.created_date,
    }))
    .sort((a, b) => (a.report_date_local || '').localeCompare(b.report_date_local || ''));

  const localDates = records.map(r => r.report_date_local).filter(Boolean);

  // Expected dates from Bubble Excel
  const expectedDates = [
    '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05',
    '2026-03-06', '2026-03-07', '2026-03-09', '2026-03-10', '2026-03-11',
    '2026-03-12', '2026-03-13', '2026-03-14', '2026-03-15', '2026-03-17',
    '2026-03-18', '2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26',
    '2026-03-27', '2026-03-30', '2026-03-31',
  ];

  const missingInDb = expectedDates.filter(d => !localDates.includes(d));
  const extraInDb = localDates.filter(d => !expectedDates.includes(d));

  return Response.json({
    totalAllTime: all.length,
    totalMarch: marchRecords.length,
    uniqueDates: [...new Set(localDates)].sort(),
    uniqueDateCount: new Set(localDates).size,
    missingVsExcel: missingInDb,
    extraVsExcel: extraInDb,
    records,
  });
});