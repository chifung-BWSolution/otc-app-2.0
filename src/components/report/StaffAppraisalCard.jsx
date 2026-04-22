import { useMemo } from "react";
import { ChevronDown, ChevronRight, Clock, CheckCircle, Briefcase } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function StaffAppraisalCard({ staffRec, manHourDates, manHourTasks, kpiMonths, kpiItems, clockins, leaves, projectMap, taskTypeMap, nosTaskMap, expanded, onToggle }) {
  const name = staffRec.display_name || staffRec.full_name || "—";
  const bubbleId = staffRec.bubble_id;

  // Filter data for this staff
  const myDates = useMemo(() => manHourDates.filter(d => d.staff_id === bubbleId), [manHourDates, bubbleId]);
  const myDateIds = useMemo(() => new Set(myDates.map(d => d.bubble_id).filter(Boolean)), [myDates]);
  const myTasks = useMemo(() => manHourTasks.filter(t => myDateIds.has(t.man_hour_date_id)), [manHourTasks, myDateIds]);
  const myKpiMonthIds = useMemo(() => {
    const ids = new Set();
    for (const m of kpiMonths) { if (m.staff_id === bubbleId && m.bubble_id) ids.add(m.bubble_id); }
    return ids;
  }, [kpiMonths, bubbleId]);
  const myKpis = useMemo(() => kpiItems.filter(k => myKpiMonthIds.has(k.staff_kpi_month_id)), [kpiItems, myKpiMonthIds]);
  const myClockins = useMemo(() => clockins.filter(c => c.staff_id === bubbleId), [clockins, bubbleId]);
  const myLeaves = useMemo(() => leaves.filter(l => l.staff_id === bubbleId), [leaves, bubbleId]);

  // Summary stats
  const totalHours = myDates.reduce((s, d) => s + (d.total_work_hour || 0), 0);
  const reportDays = myDates.length;
  const taskCount = myTasks.length;
  const avgDaily = reportDays > 0 ? (totalHours / reportDays).toFixed(1) : "0";
  const lateCount = myClockins.filter(c => c.late_minutes && c.late_minutes > 0).length;
  const totalLateMins = myClockins.reduce((s, c) => s + (c.late_minutes > 0 ? c.late_minutes : 0), 0);
  const leaveCount = myLeaves.length;

  // KPI average
  const kpiScores = myKpis.filter(k => k.score).map(k => k.score);
  const avgKpi = kpiScores.length > 0 ? Math.round(kpiScores.reduce((a, b) => a + b, 0) / kpiScores.length * 10) / 10 : null;
  const totalSales = myKpis.reduce((s, k) => s + (k.kpi_sales || 0), 0);

  // Resolve helpers
  const resolveTaskTypeName = (t) => {
    if (t.task_type_id) { const tt = taskTypeMap[t.task_type_id]; if (tt) return tt.display; }
    if (t.task_id) { const nt = nosTaskMap[t.task_id]; if (nt?.task_type_ids?.length) { const tt = taskTypeMap[nt.task_type_ids[0]]; if (tt) return tt.display; } }
    return t.task_type_name || "";
  };
  const resolveTaskName = (t) => {
    if (t.task_id) { const nt = nosTaskMap[t.task_id]; if (nt) return nt.display; }
    return t.task_name || t.keywords || "—";
  };

  // Task type breakdown for this staff
  const typeBreakdown = useMemo(() => {
    const map = {};
    for (const t of myTasks) {
      const type = resolveTaskTypeName(t) || "未分類";
      if (!map[type]) map[type] = { name: type, hours: 0, count: 0 };
      map[type].hours += t.work_hour || 0;
      map[type].count++;
    }
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [myTasks, taskTypeMap, nosTaskMap]);

  // Project breakdown
  const projectBreakdown = useMemo(() => {
    const map = {};
    for (const t of myTasks) {
      const projId = t.project_id;
      const proj = projectMap[projId];
      const projName = t.project_name || proj?.display_name || "未指定項目";
      if (!map[projName]) map[projName] = { name: projName, hours: 0, count: 0 };
      map[projName].hours += t.work_hour || 0;
      map[projName].count++;
    }
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [myTasks, projectMap]);

  // Daily hours trend (group by date)
  const dailyTrend = useMemo(() => {
    const map = {};
    for (const d of myDates) {
      if (!d.report_date) continue;
      map[d.report_date] = (map[d.report_date] || 0) + (d.total_work_hour || 0);
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-30).map(([date, hours]) => ({
      date: date.substring(5), // MM-DD
      hours: Math.round(hours * 10) / 10,
    }));
  }, [myDates]);

  const kpiColor = avgKpi === null ? "text-gray-400" : avgKpi >= 80 ? "text-green-600" : avgKpi >= 60 ? "text-orange-500" : "text-red-500";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row - always visible */}
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
        onClick={onToggle}>
        <div className="shrink-0 text-gray-400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        {staffRec.profile_pic ? (
          <img src={staffRec.profile_pic} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900">{name}</div>
          <div className="text-xs text-gray-400">{staffRec.position || ""} · {staffRec.team_name || ""} · {staffRec.bu_name || ""}</div>
        </div>
        <div className="flex gap-4 shrink-0 text-xs">
          <div className="text-center">
            <div className="font-bold text-blue-600">{Math.round(totalHours)}h</div>
            <div className="text-gray-400">工時</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-600">{taskCount}</div>
            <div className="text-gray-400">任務</div>
          </div>
          <div className="text-center">
            <div className={`font-bold ${kpiColor}`}>{avgKpi ?? "—"}</div>
            <div className="text-gray-400">KPI</div>
          </div>
          <div className="text-center hidden md:block">
            <div className={`font-bold ${lateCount > 5 ? "text-red-500" : "text-gray-600"}`}>{lateCount}</div>
            <div className="text-gray-400">遲到</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="font-bold text-teal-600">{leaveCount}</div>
            <div className="text-gray-400">請假</div>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
              <div className="text-base font-bold text-blue-600">{Math.round(totalHours)}h</div>
              <div className="text-gray-500">總工時</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 border border-green-100">
              <div className="text-base font-bold text-green-600">{taskCount}</div>
              <div className="text-gray-500">任務數</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100">
              <div className="text-base font-bold text-indigo-600">{reportDays}</div>
              <div className="text-gray-500">匯報天</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 border border-orange-100">
              <div className="text-base font-bold text-orange-600">{avgDaily}h</div>
              <div className="text-gray-500">日均工時</div>
            </div>
            <div className={`rounded-lg p-2 border ${lateCount > 5 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
              <div className={`text-base font-bold ${lateCount > 5 ? "text-red-500" : "text-gray-600"}`}>{lateCount}次</div>
              <div className="text-gray-500">遲到 ({totalLateMins}m)</div>
            </div>
            <div className={`rounded-lg p-2 border ${avgKpi !== null ? (avgKpi >= 80 ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100") : "bg-gray-50 border-gray-100"}`}>
              <div className={`text-base font-bold ${kpiColor}`}>{avgKpi ?? "—"}</div>
              <div className="text-gray-500">KPI 均分</div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Daily hours trend */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-bold text-gray-600 mb-2">📈 每日工時趨勢</h5>
              {dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={dailyTrend}>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} width={30} />
                    <Tooltip formatter={(v) => [`${v}h`, "工時"]} />
                    <Bar dataKey="hours" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="text-center py-6 text-gray-400 text-xs">暫無數據</div>}
            </div>

            {/* Task type pie */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-bold text-gray-600 mb-2">📊 任務類型分佈</h5>
              {typeBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={typeBreakdown.slice(0, 6).map(t => ({ name: t.name.length > 8 ? t.name.slice(0, 8) + ".." : t.name, value: Math.round(t.hours * 10) / 10 }))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: "#ccc", strokeWidth: 1 }}>
                      {typeBreakdown.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}h`, "工時"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="text-center py-6 text-gray-400 text-xs">暫無數據</div>}
            </div>
          </div>

          {/* Project breakdown */}
          {projectBreakdown.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-bold text-gray-600 mb-2">🚀 參與項目分佈</h5>
              <div className="space-y-1">
                {projectBreakdown.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 truncate">{p.name}</span>
                        <span className="text-gray-400">({p.count}個任務)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
                        <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${Math.min(100, (p.hours / (projectBreakdown[0]?.hours || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="font-bold text-indigo-600 shrink-0">{Math.round(p.hours * 10) / 10}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPI details */}
          {myKpis.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-bold text-gray-600 mb-2">🎯 KPI 記錄 ({myKpis.length}筆)</h5>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {myKpis.map((k, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-white rounded-lg px-2 py-1.5 border border-gray-100">
                    <span className="flex-1 truncate text-gray-700">{k.project_name || k.key_achievement || "KPI 項目"}</span>
                    {k.score && <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${k.score >= 80 ? "bg-green-100 text-green-700" : k.score >= 60 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>分數: {k.score}</span>}
                    {k.self_score && <span className="text-gray-400">自評: {k.self_score}</span>}
                    {k.leader_suggest_score && <span className="text-purple-500">領導: {k.leader_suggest_score}</span>}
                    {k.kpi_sales > 0 && <span className="text-blue-500">${Math.round(k.kpi_sales).toLocaleString()}</span>}
                  </div>
                ))}
              </div>
              {totalSales > 0 && <div className="text-xs text-right mt-1 text-blue-600 font-bold">總銷售額: ${Math.round(totalSales).toLocaleString()}</div>}
            </div>
          )}

          {/* Recent tasks */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="text-xs font-bold text-gray-600 mb-2">📝 任務明細（最近 30 筆）</h5>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <div className="flex gap-2 text-[10px] text-gray-400 font-semibold border-b border-gray-200 pb-1 sticky top-0 bg-gray-50">
                <span className="w-24">任務</span>
                <span className="w-28">項目</span>
                <span className="w-20">類型</span>
                <span className="w-12 text-right">工時</span>
                <span className="flex-1">描述</span>
              </div>
              {myTasks.slice(0, 30).map((t, i) => {
                const proj = projectMap[t.project_id];
                const projName = t.project_name || proj?.display_name || "";
                return (
                  <div key={i} className="flex gap-2 text-xs text-gray-600">
                    <span className="w-24 truncate font-medium">{resolveTaskName(t)}</span>
                    <span className="w-28 truncate text-gray-400">{projName || "—"}</span>
                    <span className="w-20 truncate">{resolveTaskTypeName(t) || "—"}</span>
                    <span className="w-12 text-right font-semibold text-blue-600">{t.work_hour || 0}h</span>
                    <span className="flex-1 truncate text-gray-400">{t.task_description || ""}</span>
                  </div>
                );
              })}
              {myTasks.length > 30 && <div className="text-gray-400 text-center text-[10px]">...還有 {myTasks.length - 30} 筆</div>}
              {myTasks.length === 0 && <div className="text-center py-4 text-gray-400 text-xs">暫無任務記錄</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}