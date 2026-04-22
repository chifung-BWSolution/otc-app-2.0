import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ReportStatCard from "./ReportStatCard";

export default function AttendanceSection({ clockins, leaves, ots, staffMap }) {
  // Attendance stats
  const stats = useMemo(() => {
    let totalLate = 0, lateCount = 0, totalOtHours = 0, otCount = 0;
    for (const c of clockins) {
      if (c.late_minutes && c.late_minutes > 0) { totalLate += c.late_minutes; lateCount++; }
    }
    for (const o of ots) {
      if (o.ot_hour) { totalOtHours += o.ot_hour; otCount++; }
    }
    return { totalClockins: clockins.length, lateCount, avgLate: lateCount > 0 ? Math.round(totalLate / lateCount) : 0, totalLeaves: leaves.length, totalOtHours: Math.round(totalOtHours * 10) / 10, otCount };
  }, [clockins, leaves, ots]);

  // Late staff ranking
  const lateRanking = useMemo(() => {
    const map = {};
    for (const c of clockins) {
      if (!c.staff_id || !c.late_minutes || c.late_minutes <= 0) continue;
      if (!map[c.staff_id]) map[c.staff_id] = { staffId: c.staff_id, totalLate: 0, count: 0 };
      map[c.staff_id].totalLate += c.late_minutes;
      map[c.staff_id].count++;
    }
    return Object.values(map)
      .map(s => {
        const staffRec = staffMap[s.staffId];
        return { ...s, name: staffRec?.display_name || s.staffId, team: staffRec?.team_name || "" };
      })
      .sort((a, b) => b.totalLate - a.totalLate)
      .slice(0, 10);
  }, [clockins, staffMap]);

  // Leave type distribution
  const leaveTypes = useMemo(() => {
    const map = {};
    for (const l of leaves) {
      const type = l.leave_type || "其他";
      if (!map[type]) map[type] = { name: type, count: 0 };
      map[type].count++;
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [leaves]);

  // OT by status
  const otByStatus = useMemo(() => {
    const map = {};
    for (const o of ots) {
      const s = o.status || "Pending";
      if (!map[s]) map[s] = { name: s, count: 0, hours: 0 };
      map[s].count++;
      map[s].hours += o.ot_hour || 0;
    }
    return Object.values(map);
  }, [ots]);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">⏰ 考勤概覽</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportStatCard label="打卡記錄" value={stats.totalClockins.toLocaleString()} color="blue" />
        <ReportStatCard label="遲到次數" value={stats.lateCount} sub={stats.lateCount > 0 ? `平均 ${stats.avgLate} 分鐘` : ""} color="red" />
        <ReportStatCard label="請假申請" value={stats.totalLeaves} color="teal" />
        <ReportStatCard label="加班時數" value={`${stats.totalOtHours}h`} sub={`${stats.otCount} 次`} color="orange" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Late ranking */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-2">⚠️ 遲到排行（累計分鐘）</h4>
          {lateRanking.length > 0 ? (
            <div className="space-y-1.5">
              {lateRanking.map((s, i) => (
                <div key={s.staffId} className="flex items-center gap-2 text-xs">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${i < 3 ? "bg-red-500" : "bg-gray-300"}`}>{i + 1}</span>
                  <span className="font-medium text-gray-800 flex-1 truncate">{s.name}</span>
                  <span className="text-gray-400 text-[10px]">{s.team}</span>
                  <span className="font-bold text-red-500">{s.totalLate}m</span>
                  <span className="text-gray-400 text-[10px]">({s.count}次)</span>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-6 text-gray-400 text-sm">暫無遲到記錄</div>}
        </div>

        {/* Leave type distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">🌴 請假類型分佈</h4>
          {leaveTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leaveTypes} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                <Tooltip />
                <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} name="次數" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-6 text-gray-400 text-sm">暫無請假記錄</div>}
        </div>
      </div>

      {/* OT summary */}
      {otByStatus.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-2">⚡ 加班申請狀態</h4>
          <div className="flex gap-3 flex-wrap">
            {otByStatus.map(s => (
              <div key={s.name} className={`px-3 py-2 rounded-lg border text-center min-w-[100px] ${
                s.name === "Approved" ? "bg-green-50 border-green-200" : s.name === "Rejected" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
              }`}>
                <div className="text-sm font-bold">{s.count} 次</div>
                <div className="text-xs text-gray-500">{s.name}</div>
                <div className="text-[10px] text-gray-400">{Math.round(s.hours * 10) / 10}h</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}