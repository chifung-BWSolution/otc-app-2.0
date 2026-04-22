import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import ReportStatCard from "./ReportStatCard";

export default function KPIOverviewSection({ kpiMonths, kpiItems, staff, staffMap }) {
  // Aggregate KPI data by staff
  const staffKpiSummary = useMemo(() => {
    // Group kpiItems by staff_kpi_month_id
    const monthMap = {};
    for (const m of kpiMonths) {
      if (m.bubble_id) monthMap[m.bubble_id] = m;
    }

    // Group KPI items by staff (via kpi month)
    const byStaff = {};
    for (const item of kpiItems) {
      const month = monthMap[item.staff_kpi_month_id];
      if (!month) continue;
      const sid = month.staff_id;
      if (!sid) continue;
      if (!byStaff[sid]) byStaff[sid] = { staffId: sid, items: [], months: new Set(), totalScore: 0, scoreCount: 0, totalSales: 0 };
      byStaff[sid].items.push(item);
      byStaff[sid].months.add(item.staff_kpi_month_id);
      if (item.score) { byStaff[sid].totalScore += item.score; byStaff[sid].scoreCount++; }
      if (item.kpi_sales) byStaff[sid].totalSales += item.kpi_sales;
    }

    return Object.values(byStaff).map(s => {
      const staffRec = staffMap[s.staffId];
      const name = staffRec?.display_name || s.staffId;
      const avgScore = s.scoreCount > 0 ? Math.round(s.totalScore / s.scoreCount * 10) / 10 : 0;
      return { ...s, name, team: staffRec?.team_name || "", bu: staffRec?.bu_name || "", avgScore, monthCount: s.months.size };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [kpiMonths, kpiItems, staffMap]);

  // Monthly KPI trend (by report_month)
  const monthlyTrend = useMemo(() => {
    const map = {};
    const monthMap = {};
    for (const m of kpiMonths) {
      if (m.bubble_id) monthMap[m.bubble_id] = m;
    }
    for (const item of kpiItems) {
      const month = monthMap[item.staff_kpi_month_id];
      if (!month?.report_month) continue;
      const key = month.report_month.substring(0, 7); // YYYY-MM
      if (!map[key]) map[key] = { month: key, totalScore: 0, count: 0, totalSales: 0 };
      if (item.score) { map[key].totalScore += item.score; map[key].count++; }
      if (item.kpi_sales) map[key].totalSales += item.kpi_sales;
    }
    return Object.values(map)
      .map(m => ({ ...m, avgScore: m.count > 0 ? Math.round(m.totalScore / m.count * 10) / 10 : 0 }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [kpiMonths, kpiItems]);

  // Team average scores
  const teamScores = useMemo(() => {
    const map = {};
    for (const s of staffKpiSummary) {
      const team = s.team || "未分組";
      if (!map[team]) map[team] = { team, totalScore: 0, count: 0 };
      map[team].totalScore += s.avgScore;
      map[team].count++;
    }
    return Object.values(map)
      .map(t => ({ name: t.team.length > 10 ? t.team.slice(0, 10) + ".." : t.team, avgScore: Math.round(t.totalScore / t.count * 10) / 10 }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 8);
  }, [staffKpiSummary]);

  const totalKpiRecords = kpiItems.length;
  const avgAllScore = staffKpiSummary.length > 0
    ? Math.round(staffKpiSummary.reduce((s, r) => s + r.avgScore, 0) / staffKpiSummary.length * 10) / 10
    : 0;
  const totalSales = kpiItems.reduce((s, r) => s + (r.kpi_sales || 0), 0);
  const kpiStaffCount = staffKpiSummary.length;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">🎯 月度 KPI 概覽</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportStatCard label="KPI 記錄數" value={totalKpiRecords.toLocaleString()} color="purple" />
        <ReportStatCard label="參與人數" value={kpiStaffCount} color="blue" />
        <ReportStatCard label="平均 KPI 分數" value={avgAllScore} color="green" />
        <ReportStatCard label="總銷售額" value={totalSales > 0 ? `$${Math.round(totalSales).toLocaleString()}` : "—"} color="orange" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly KPI trend */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">📈 月度 KPI 趨勢（平均分）</h4>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, "平均分"]} />
                <Bar dataKey="avgScore" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="平均分" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-10 text-gray-400 text-sm">暫無 KPI 數據</div>}
        </div>

        {/* Team comparison */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">👥 各 Team 平均 KPI</h4>
          {teamScores.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={teamScores} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v) => [v, "平均分"]} />
                <Bar dataKey="avgScore" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-10 text-gray-400 text-sm">暫無數據</div>}
        </div>
      </div>

      {/* Top/Bottom performers */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-2">🏆 KPI Top 10</h4>
          <div className="space-y-1.5">
            {staffKpiSummary.slice(0, 10).map((s, i) => (
              <div key={s.staffId} className="flex items-center gap-2 text-xs">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${i < 3 ? "bg-yellow-500" : "bg-gray-300"}`}>{i + 1}</span>
                <span className="font-medium text-gray-800 flex-1 truncate">{s.name}</span>
                <span className="text-gray-400 text-[10px]">{s.team}</span>
                <span className="font-bold text-purple-600">{s.avgScore}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-2">⚠️ 需關注（KPI 偏低）</h4>
          <div className="space-y-1.5">
            {staffKpiSummary.filter(s => s.avgScore > 0).slice(-10).reverse().map((s, i) => (
              <div key={s.staffId} className="flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full flex items-center justify-center bg-red-100 text-red-600 text-[10px] font-bold">{i + 1}</span>
                <span className="font-medium text-gray-800 flex-1 truncate">{s.name}</span>
                <span className="text-gray-400 text-[10px]">{s.team}</span>
                <span className="font-bold text-red-500">{s.avgScore}</span>
              </div>
            ))}
            {staffKpiSummary.filter(s => s.avgScore > 0).length === 0 && (
              <div className="text-center py-4 text-gray-400 text-xs">暫無數據</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}