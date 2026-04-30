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

function parseFY(fyLabel) {
  const match = fyLabel.match(/FY(\d{4})\/(\d{4})/);
  if (!match) return null;
  const y = parseInt(match[1]);
  return { start: `${y}-04-01`, end: `${y + 1}-03-31` };
}

export default function SelfReviewRecords({ staffId, fiscalYear }) {
  const [loading, setLoading] = useState(true);
  const [meritRecords, setMeritRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);

  const fy = parseFY(fiscalYear);

  useEffect(() => {
    if (!staffId || !fy) { setLoading(false); return; }
    Promise.all([
      loadMerits(),
      loadAttendance(),
    ]).finally(() => setLoading(false));
  }, [staffId, fiscalYear]);

  const loadMerits = async () => {
    const records = await base44.entities.BubbleMeritsDemerits.filter({ staff_id: staffId }, "-event_date", 200);
    const filtered = records.filter(rec => {
      if (!rec.event_date) return false;
      const d = toLocalDate(rec.event_date);
      return d && d >= fy.start && d <= fy.end;
    });
    setMeritRecords(filtered);
  };

  const loadAttendance = async () => {
    // Simplified: just load clockin count + late minutes for this staff in FY
    const clockins = await base44.entities.BubbleClockin.filter({ staff_id: staffId }, "id", 5000);
    let workDays = 0, totalLate = 0;
    for (const c of clockins) {
      const d = toLocalDate(c.clockin_time);
      if (!d || d < fy.start || d > fy.end) continue;
      workDays++;
      if (c.late_minutes > 0) totalLate += c.late_minutes;
    }

    const leaves = await base44.entities.BubbleLeave.filter({ staff_id: staffId }, "id", 2000);
    let ulDays = 0;
    for (const l of leaves) {
      if (l.approved !== true) continue;
      const dn = (l.display_name || "");
      if (!dn.includes("無薪") && !dn.toLowerCase().includes("unpaid") && !dn.toLowerCase().includes("no pay")) continue;
      const sd = toLocalDate(l.start_date_time || l.end_date_time);
      if (!sd || sd < fy.start || sd > fy.end) continue;
      ulDays += Math.abs(l.quota || 0);
    }

    setAttendanceStats({ workDays, totalLate, ulDays });
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
                const isDemerit = !(r.type || "").includes("優") && !(r.type || "").includes("功");
                return (
                  <div key={r.id || i} className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${isDemerit ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDemerit ? "bg-red-100" : "bg-green-100"}`}>
                      {isDemerit ? <AlertTriangle size={14} className="text-red-500" /> : <Award size={14} className="text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isDemerit ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{r.type}</span>
                        {r.event_date && <span className="text-xs text-gray-400">{new Date(r.event_date).toLocaleDateString("zh-HK")}</span>}
                      </div>
                      {r.brief_description && <div className="text-sm font-medium text-gray-800 mt-1">{r.brief_description}</div>}
                      {r.detailed_description && <div className="text-sm text-gray-600 mt-0.5">{r.detailed_description}</div>}
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
          <h3 className="font-bold text-base text-slate-800">📋 考勤紀錄（{fiscalYear}）</h3>
          <p className="text-sm text-slate-500 mt-0.5">以下為你在本年度的考勤概況，僅供參考。</p>
        </div>
        <div className="p-5">
          {attendanceStats ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-lg px-3 py-3 text-center border border-blue-100">
                <Calendar size={16} className="mx-auto text-blue-500 mb-1" />
                <div className="text-lg font-bold text-blue-600">{attendanceStats.workDays}</div>
                <div className="text-[10px] text-gray-500">上班日</div>
              </div>
              <div className={`rounded-lg px-3 py-3 text-center border ${attendanceStats.totalLate > 0 ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"}`}>
                <Clock size={16} className={`mx-auto mb-1 ${attendanceStats.totalLate > 0 ? "text-orange-500" : "text-gray-400"}`} />
                <div className={`text-lg font-bold ${attendanceStats.totalLate > 0 ? "text-orange-600" : "text-gray-500"}`}>{attendanceStats.totalLate}</div>
                <div className="text-[10px] text-gray-500">遲到分鐘</div>
              </div>
              <div className={`rounded-lg px-3 py-3 text-center border ${attendanceStats.ulDays > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                <Coffee size={16} className={`mx-auto mb-1 ${attendanceStats.ulDays > 0 ? "text-red-500" : "text-gray-400"}`} />
                <div className={`text-lg font-bold ${attendanceStats.ulDays > 0 ? "text-red-600" : "text-gray-500"}`}>{attendanceStats.ulDays}</div>
                <div className="text-[10px] text-gray-500">無薪假日數</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">無法載入考勤數據</div>
          )}
        </div>
      </div>
    </div>
  );
}