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

  // Parse any date format to YYYY-MM-DD
  const toLocalDate = (val) => {
    if (!val) return null;
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // ISO with T: convert UTC to HKT
    if (val.includes('T') && val.includes('-')) {
      const d = new Date(val);
      const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
      return hkt.toISOString().slice(0, 10);
    }
    // D/M/YYYY or D/M/YYYY H:MM format
    const cleaned = val.split(' ')[0];
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return null;
  };

  // Filter March 2026
  const marchRecords = all.filter(r => {
    const ld = toLocalDate(r.report_date);
    return ld && ld >= '2026-03-01' && ld <= '2026-03-31';
  });

  const records = marchRecords
    .map(r => ({
      id: r.id,
      bubble_id: r.bubble_id,
      report_date_raw: r.report_date,
      report_date_local: toLocalDate(r.report_date),
      total_work_hour: r.total_work_hour,
      staff_name: r.staff_name,
    }))
    .sort((a, b) => (a.report_date_local || '').localeCompare(b.report_date_local || ''));

  const localDates = records.map(r => r.report_date_local).filter(Boolean);

  const expectedDates = [
    '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05',
    '2026-03-06', '2026-03-07', '2026-03-09', '2026-03-10', '2026-03-11',
    '2026-03-12', '2026-03-13', '2026-03-14', '2026-03-15', '2026-03-17',
    '2026-03-18', '2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26',
    '2026-03-27', '2026-03-30', '2026-03-31',
  ];

  const missingInDb = expectedDates.filter(d => !localDates.includes(d));

  // Show a sample of raw report_date values for format check
  const sampleRawDates = all.slice(0, 5).map(r => r.report_date);

  return Response.json({
    totalAllTime: all.length,
    totalMarch: marchRecords.length,
    uniqueDates: [...new Set(localDates)].sort(),
    uniqueDateCount: new Set(localDates).size,
    missingVsExcel: missingInDb,
    sampleRawDates,
    records,
  });
});