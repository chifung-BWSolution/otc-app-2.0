import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function StaffAppraisalCard({ staffRec, manHourDates, manHourTasks, kpiMonths, kpiItems, projectMap, taskTypeMap, nosTaskMap, expanded, onToggle, dateRange }) {
  const [expandedProject, setExpandedProject] = useState(null);
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

  // Summary stats
  const totalHours = myDates.reduce((s, d) => s + (d.total_work_hour || 0), 0);
  const reportDays = myDates.length;
  const taskCount = myTasks.length;
  const avgDaily = reportDays > 0 ? (totalHours / reportDays).toFixed(1) : "0";

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

  // Task type breakdown for pie chart
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

  // Project breakdown with nested task type + task details
  const projectBreakdown = useMemo(() => {
    const map = {};
    for (const t of myTasks) {
      const projId = t.project_id;
      const proj = projectMap[projId];
      const projName = t.project_name || proj?.display_name || "未指定項目";
      if (!map[projName]) map[projName] = { name: projName, hours: 0, count: 0, tasksByType: {} };
      map[projName].hours += t.work_hour || 0;
      map[projName].count++;

      // Group by task type within project
      const typeName = resolveTaskTypeName(t) || "未分類";
      if (!map[projName].tasksByType[typeName]) map[projName].tasksByType[typeName] = { name: typeName, hours: 0, taskMap: {} };
      map[projName].tasksByType[typeName].hours += t.work_hour || 0;
      const tName = resolveTaskName(t);
      if (!map[projName].tasksByType[typeName].taskMap[tName]) map[projName].tasksByType[typeName].taskMap[tName] = { name: tName, hours: 0, count: 0 };
      map[projName].tasksByType[typeName].taskMap[tName].hours += t.work_hour || 0;
      map[projName].tasksByType[typeName].taskMap[tName].count++;
    }
    return Object.values(map)
      .map(p => ({
        ...p,
        tasksByType: Object.values(p.tasksByType)
          .map(tt => ({ ...tt, tasks: Object.values(tt.taskMap).sort((a, b) => b.hours - a.hours) }))
          .sort((a, b) => b.hours - a.hours),
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [myTasks, projectMap, taskTypeMap, nosTaskMap]);

  const kpiColor = avgKpi === null ? "text-gray-400" : avgKpi >= 80 ? "text-green-600" : avgKpi >= 60 ? "text-orange-500" : "text-red-500";

  // Pie chart: use legend instead of labels to avoid text overflow
  const pieData = typeBreakdown.slice(0, 6).map(t => ({
    name: t.name,
    value: Math.round(t.hours * 10) / 10,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row */}
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
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
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
          </div>

          {/* Task type pie chart with legend */}
          {pieData.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-bold text-gray-600 mb-2">📊 任務類型分佈</h5>
              <div className="flex items-center gap-4">
                <div className="w-[160px] h-[160px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={false}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v}h`, "工時"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 truncate text-gray-700">{item.name}</span>
                      <span className="font-bold text-gray-600">{item.value}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Project breakdown - clickable to expand */}
          {projectBreakdown.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-bold text-gray-600 mb-2">🚀 參與項目分佈（點擊展開明細）</h5>
              <div className="space-y-1">
                {projectBreakdown.slice(0, 12).map((p, i) => {
                  const isOpen = expandedProject === p.name;
                  return (
                    <div key={i}>
                      <button
                        className="w-full flex items-center gap-2 text-xs py-1.5 px-1 rounded hover:bg-gray-100 transition-colors text-left"
                        onClick={() => setExpandedProject(isOpen ? null : p.name)}
                      >
                        <span className="text-gray-400 shrink-0">{isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
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
                      </button>

                      {/* Expanded: task types and tasks within project */}
                      {isOpen && (
                        <div className="ml-6 mt-1 mb-2 space-y-2 border-l-2 border-indigo-200 pl-3">
                          {p.tasksByType.map((tt, j) => (
                            <div key={j}>
                              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-0.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[j % COLORS.length] }} />
                                <span className="flex-1 truncate">{tt.name}</span>
                                <span className="text-blue-600">{Math.round(tt.hours * 10) / 10}h</span>
                              </div>
                              <div className="ml-4 space-y-0.5">
                                {tt.tasks.map((task, k) => (
                                  <div key={k} className="flex items-center gap-2 text-[11px] text-gray-500">
                                    <span className="flex-1 truncate">{task.name}{task.count > 1 ? ` ×${task.count}` : ""}</span>
                                    <span className="font-medium text-gray-600 shrink-0">{Math.round(task.hours * 10) / 10}h</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Analysis button */}
          <div className="flex justify-center">
            <button
              onClick={() => window.open(`/admin/staff-ai-analysis?staffId=${staffRec.id}&days=${dateRange || 90}`, "_blank")}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles size={15} /> AI 績效分析
            </button>
          </div>

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
        </div>
      )}
    </div>
  );
}