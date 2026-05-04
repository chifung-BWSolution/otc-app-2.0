import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const toLocalDate = (val) => {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const cleaned = val.split(' ')[0];
  const parts = cleaned.split('/');
  if (parts.length === 3) { const [d, m, y] = parts; return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  if (val.includes('T')) { const dt = new Date(val); const hkt = new Date(dt.getTime() + 8 * 60 * 60 * 1000); return hkt.toISOString().slice(0, 10); }
  return null;
};

function parseToDate(val) {
  if (!val) return null;
  if (val.includes('T')) return new Date(val);
  const [datePart, timePart] = val.split(' ');
  const parts = datePart.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const [hh, mm] = (timePart || '0:00').split(':');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hh), parseInt(mm));
  }
  return new Date(val);
}

async function loadAll(entity, sort, batchSize, query) {
  const all = [];
  let offset = 0;
  while (true) {
    const batch = await entity.filter(query, sort, batchSize, offset);
    all.push(...batch);
    if (batch.length < batchSize) break;
    offset += batch.length;
    await new Promise(r => setTimeout(r, 300));
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const staffId = body.staff_id;
    const fiscalYear = body.fiscal_year;

    if (!staffId || !fiscalYear) {
      return Response.json({ error: 'Missing staff_id or fiscal_year' }, { status: 400 });
    }

    // Only allow own data or admin/management
    if (staffId !== user.linked_staff_id && user.role !== 'admin' && user.role !== 'management') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fyMatch = fiscalYear.match(/FY(\d{4})\/(\d{4})/);
    if (!fyMatch) return Response.json({ error: 'Invalid fiscal_year' }, { status: 400 });
    const y = parseInt(fyMatch[1]);
    const fyStart = `${y}-04-01`;
    const fyEnd = `${y + 1}-03-31`;

    const sr = base44.asServiceRole;

    // Load staff record for region
    const staffList = await sr.entities.Staff.filter({ bubble_id: staffId }, "id", 1);
    const staffRec = staffList[0];
    const staffName = staffRec?.display_name;

    // Build name→id map for clockin records with null staff_id
    const nameToId = {};
    if (staffName) nameToId[staffName] = staffId;

    // Load data in parallel using service role
    const [clockinList, leaveList, regionList, dateList] = await Promise.all([
      loadAll(sr.entities.BubbleClockin, "id", 5000, { staff_id: staffId }),
      loadAll(sr.entities.BubbleLeave, "id", 5000, { staff_id: staffId }),
      sr.entities.Region.filter({ is_active: true }, "sort_order", 50),
      loadAll(sr.entities.BubbleManHourDate, "-report_date", 5000, { staff_id: staffId }),
    ]);

    // Also load clockins with null staff_id that match by name
    let extraClockins = [];
    if (staffName) {
      extraClockins = await loadAll(sr.entities.BubbleClockin, "id", 5000, { staff_name: staffName, staff_id: null });
    }
    const allClockins = [...clockinList, ...extraClockins];

    console.log(`Staff ${staffId} (${staffName}): clockins=${allClockins.length} (direct=${clockinList.length}, by_name=${extraClockins.length}), leaves=${leaveList.length}, dates=${dateList.length}`);

    // Region config
    const staffRegion = regionList.find(reg => {
      if (staffRec?.staff_region) return reg.code === staffRec.staff_region;
      const loc = (staffRec?.o_base_location || "").toLowerCase();
      return (reg.base_locations || []).some(v => v && loc.includes(v.toLowerCase()));
    }) || regionList[0];

    const parseTime = (t, fallback) => {
      if (!t) return fallback;
      const [h, m] = t.split(":").map(Number);
      return h * 60 + (m || 0);
    };
    const weekdayEndMin = parseTime(staffRegion?.work_end, 18 * 60 + 30);
    const satEndMin = parseTime(staffRegion?.sat_training_end, 13 * 60 + 30);

    // Process clockins
    const clockinDates = new Set();
    let totalLateMinutes = 0;
    let voluntaryOTMinutes = 0;

    for (const c of allClockins) {
      if (!c.clockin_time) continue;
      const d = toLocalDate(c.clockin_time);
      if (!d || d < fyStart || d > fyEnd) continue;
      clockinDates.add(d);
      if (c.late_minutes > 0) totalLateMinutes += c.late_minutes;
      if (c.clock_out_time) {
        const outDate = parseToDate(c.clock_out_time);
        if (outDate) {
          const outLocalDate = toLocalDate(c.clock_out_time);
          if (outLocalDate && outLocalDate >= fyStart && outLocalDate <= fyEnd) {
            const dayOfWeek = outDate.getDay();
            const outTotalMin = outDate.getHours() * 60 + outDate.getMinutes();
            let threshold = null;
            if (dayOfWeek >= 1 && dayOfWeek <= 5) threshold = weekdayEndMin;
            else if (dayOfWeek === 6) threshold = satEndMin;
            if (threshold !== null && outTotalMin > threshold) {
              let extraMin = outTotalMin - threshold - (c.ot_minutes || 0);
              voluntaryOTMinutes += Math.max(0, extraMin);
            }
          }
        }
      }
    }

    // Report days
    const reportDates = new Set();
    for (const d of dateList) {
      const rd = toLocalDate(d.report_date);
      if (!rd || rd < fyStart || rd > fyEnd) continue;
      if ((d.total_work_hour || 0) > 0) reportDates.add(rd);
    }

    // Unpaid leave
    const myLeaves = leaveList.filter(l => {
      if (l.approved !== true) return false;
      const dn = (l.display_name || "");
      if (!dn.includes("無薪") && !dn.toLowerCase().includes("unpaid") && !dn.toLowerCase().includes("no pay")) return false;
      const sd = toLocalDate(l.start_date_time || l.end_date_time);
      return sd && sd >= fyStart && sd <= fyEnd;
    });

    const ulPersonalDays = myLeaves.filter(l => {
      const dn = l.display_name || "";
      return dn.includes("無薪事假") || dn.includes("突發無薪事假");
    }).reduce((s, l) => s + Math.abs(l.quota || 0), 0);

    const ulSickDays = myLeaves.filter(l => {
      const dn = l.display_name || "";
      return dn.includes("無薪病假") || dn.includes("無薪假期");
    }).reduce((s, l) => s + Math.abs(l.quota || 0), 0);

    // Merits/demerits
    const meritRecords = await sr.entities.BubbleMeritsDemerits.filter({ staff_id: staffId }, "-event_date", 200);
    const filteredMerits = meritRecords.filter(rec => {
      if (!rec.event_date) return false;
      const d = toLocalDate(rec.event_date);
      return d && d >= fyStart && d <= fyEnd;
    });

    return Response.json({
      attendanceStats: {
        workDays: clockinDates.size,
        reportDays: reportDates.size,
        totalLateMinutes,
        voluntaryOTMinutes,
        ulDays: myLeaves.reduce((s, l) => s + Math.abs(l.quota || 0), 0),
        ulPersonalDays,
        ulSickDays,
        ulLeaves: myLeaves.map(l => ({
          display_name: l.display_name,
          quota: l.quota,
          start: toLocalDate(l.start_date_time),
        })),
      },
      meritRecords: filteredMerits.map(r => ({
        id: r.id,
        type: r.type,
        brief_description: r.brief_description,
        detailed_description: r.detailed_description,
        event_date: r.event_date,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});