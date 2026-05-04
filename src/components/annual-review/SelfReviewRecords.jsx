import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Award, AlertTriangle, Calendar, Clock, Coffee } from "lucide-react";

const toLocalDate = (val) => {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const cleaned = val.split(' ')[0];
  const parts = cleaned.split('/');
  if (parts.length === 3) { const [d, m, y] = parts; return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  if (val.includes('T')) { const d = new Date(val); const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000); return hkt.toISOString().slice(0, 10); }
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

function parseFY(fyLabel) {
  const match = fyLabel.match(/FY(\d{4})\/(\d{4})/);
  if (!match) return null;
  const y = parseInt(match[1]);
  return { start: `${y}-04-01`, end: `${y + 1}-03-31` };
}

async function loadAll(entity, sort = "id", batchSize = 5000, query = {}) {
  const all = [];
  let offset = 0;
  while (true) {
    const batch = await entity.filter(query, sort, batchSize, offset);
    all.push(...batch);
    if (batch.length < batchSize) break;
    offset += batch.length;
    await new Promise(r => setTimeout(r, 500));
  }
  return all;
}

export default function SelfReviewRecords({ staffId, fiscalYear }) {
  const [loading, setLoading] = useState(true);
  const [meritRecords, setMeritRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);

  const fy = parseFY(fiscalYear);

  useEffect(() => {
    if (!staffId || !fy) { setLoading(false); return; }
    Promise.all([loadMerits(), loadAttendance()]).finally(() => setLoading(false));
  }, [staffId, fiscalYear]);

  const loadMerits = async () => {
    const records = await base44.entities.BubbleMeritsDemerits.filter({ staff_id: staffId }, "-event_date", 200);
    setMeritRecords(records.filter(rec => {
      if (!rec.event_date) return false;
      const d = toLocalDate(rec.event_date);
      return d && d >= fy.start && d <= fy.end;
    }));
  };

  const loadAttendance = async () => {
    const [staffList, clockinList, leaveList, regionList, dateList, taskList] = await Promise.all([
      base44.entities.Staff.filter({ bubble_id: staffId }, "id", 1),
      loadAll(base44.entities.BubbleClockin, "id", 5000, { staff_id: staffId }),
      loadAll(base44.entities.BubbleLeave, "id", 5000, { staff_id: staffId }),
      base44.entities.Region.filter({ is_active: true }, "sort_order", 50),
      loadAll(base44.entities.BubbleManHourDate, "-report_date", 5000, { staff_id: staffId }),
      loadAll(base44.entities.BubbleManHourTask, "-created_date"),
    ]);

    const staffRec = staffList[0];

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

    const myClockins = clockinList.filter(c => !!c.clockin_time);

    const clockinDates = new Set();
    let totalLateMinutes = 0;
    let voluntaryOTMinutes = 0;

    for (const c of myClockins) {
      const d = toLocalDate(c.clockin_time);
      if (!d || d < fy.start || d > fy.end) continue;
      clockinDates.add(d);
      if (c.late_minutes > 0) totalLateMinutes += c.late_minutes;
      if (c.clock_out_time) {
        const outDate = parseToDate(c.clock_out_time);
        if (outDate) {
          const outLocalDate = toLocalDate(c.clock_out_time);
          if (outLocalDate && outLocalDate >= fy.start && outLocalDate <= fy.end) {
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

    // Report days (dateList already filtered by staff_id)
    const myDates = dateList.filter(d => {
      const rd = toLocalDate(d.report_date);
      return rd && rd >= fy.start && rd <= fy.end;
    });
    const myDateIds = new Set(myDates.map(d => d.bubble_id).filter(Boolean));
    const dateIdsWithTasks = new Set(taskList.filter(t => myDateIds.has(t.man_hour_date_id)).map(t => t.man_hour_date_id));
    const reportDates = new Set();
    for (const d of myDates) {
      if (d.bubble_id && dateIdsWithTasks.has(d.bubble_id)) {
        const rd = toLocalDate(d.report_date);
        if (rd) reportDates.add(rd);
      }
    }

    // Unpaid leave (leaveList already filtered by staff_id)
    const myLeaves = leaveList.filter(l => {
      if (l.approved !== true) return false;
      const dn = (l.display_name || "");
      if (!dn.includes("無薪") && !dn.toLowerCase().includes("unpaid") && !dn.toLowerCase().includes("no pay")) return false;
      const sd = toLocalDate(l.start_date_time || l.end_date_time);
      return sd && sd >= fy.start && sd <= fy.end;
    });
    const ulPersonalDays = myLeaves.filter(l => { const dn = l.display_name || ""; return dn.includes("無薪事假") || dn.includes("突發無薪事假"); }).reduce((s, l) => s + Math.abs(l.quota || 0), 0);
    const ulSickDays = myLeaves.filter(l => { const dn = l.display_name || ""; return dn.includes("無薪病假") || dn.includes("無薪假期"); }).reduce((s, l) => s + Math.abs(l.quota || 0), 0);

    setAttendanceStats({
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
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">載入紀錄...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Merits & Demerits */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-amber-50 px-5 py-4 border-b border-amber-100">
          <h3 className="font-bold text-base text-amber-800">🏅 功過紀錄（{fiscalYear}）</h3>
          <p className="text-sm text-amber-600 mt-0.5">以下為你在本年度的功過紀錄，僅供參考。</p>
        </div>
        <div className="p-5">
          {meritRecords.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">本年度暫無功過紀錄</div>
          ) : (
            <div className="space-y-2">
              {meritRecords.map((r, i) => {
                const isMerit = (r.type || "").includes("優") || (r.type || "").includes("功") || (r.type || "").toLowerCase().includes("merit");
                const isDemerit = !isMerit;
                return (
                  <div key={r.id || i} className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${isDemerit ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDemerit ? "bg-red-100" : "bg-green-100"}`}>
                      {isDemerit ? <AlertTriangle size={15} className="text-red-500" /> : <Award size={15} className="text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isDemerit ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{r.type || (isDemerit ? "過" : "功")}</span>
                        {r.event_date && <span className="text-xs text-gray-400">{new Date(r.event_date).toLocaleDateString("zh-HK")}</span>}
                      </div>
                      {r.brief_description && <div className="text-sm font-medium text-gray-800 mt-1">{r.brief_description}</div>}
                      {r.detailed_description && <div className="text-sm text-gray-600 mt-0.5 leading-relaxed">{r.detailed_description}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Attendance */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold text-base text-slate-800">📋 年度考勤紀錄（{fiscalYear}）</h3>
          <p className="text-sm text-slate-500 mt-0.5">以下為你在本年度的考勤概況，僅供參考。</p>
        </div>
        <div className="p-5">
          {attendanceStats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <AttendanceStat
                  icon={<Calendar size={16} className="text-blue-500" />}
                  label="上班日 vs 匯報日"
                  value={`${attendanceStats.workDays} / ${attendanceStats.reportDays}`}
                  sub={attendanceStats.workDays > attendanceStats.reportDays
                    ? `差 ${attendanceStats.workDays - attendanceStats.reportDays} 日`
                    : "全部已匯報"}
                  warn={attendanceStats.workDays > attendanceStats.reportDays}
                />
                <AttendanceStat
                  icon={<AlertTriangle size={16} className="text-orange-500" />}
                  label="年度遲到分鐘"
                  value={`${attendanceStats.totalLateMinutes} 分鐘`}
                  sub={attendanceStats.totalLateMinutes > 0
                    ? `≈ ${(attendanceStats.totalLateMinutes / 60).toFixed(1)} 小時`
                    : "無遲到記錄"}
                  warn={attendanceStats.totalLateMinutes > 60}
                />
                <AttendanceStat
                  icon={<Coffee size={16} className="text-red-500" />}
                  label="無薪假（合計）"
                  value={`${attendanceStats.ulDays} 日`}
                  sub={`事假 ${attendanceStats.ulPersonalDays}日 · 病假 ${attendanceStats.ulSickDays}日`}
                  warn={attendanceStats.ulDays > 0}
                />
                <AttendanceStat
                  icon={<Clock size={16} className="text-green-500" />}
                  label="自願加班"
                  value={`${attendanceStats.voluntaryOTMinutes} 分鐘`}
                  sub={attendanceStats.voluntaryOTMinutes > 0
                    ? `≈ ${(attendanceStats.voluntaryOTMinutes / 60).toFixed(1)} 小時`
                    : "無自願加班"}
                  warn={false}
                />
              </div>

              {/* UL detail breakdown */}
              {attendanceStats.ulLeaves?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs font-bold text-gray-500 mb-2">📋 無薪假明細</div>
                  <div className="space-y-1">
                    {attendanceStats.ulLeaves
                      .sort((a, b) => (a.start || "").localeCompare(b.start || ""))
                      .map((l, i) => {
                        const label = (l.display_name || "").split(" - ").slice(1).join(" - ") || l.display_name;
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 w-20 shrink-0">{l.start}</span>
                            <span className="flex-1 text-gray-600">{label}</span>
                            <span className="font-semibold text-orange-600 shrink-0">{l.quota}日</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">無法載入考勤數據</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendanceStat({ icon, label, value, sub, warn }) {
  return (
    <div className={`rounded-xl p-3 border text-center ${warn ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"}`}>
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <div className={`text-base font-bold ${warn ? "text-orange-600" : "text-gray-800"}`}>{value}</div>
      <div className="text-[10px] text-gray-500 font-medium">{label}</div>
      {sub && <div className={`text-[10px] mt-0.5 ${warn ? "text-orange-500" : "text-gray-400"}`}>{sub}</div>}
    </div>
  );
}