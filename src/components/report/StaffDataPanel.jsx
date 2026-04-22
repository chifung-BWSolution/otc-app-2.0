import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function StaffDataPanel({ staffRec, myDates, myTasks, myKpis, projectMap, taskTypeMap, nosTaskMap, dateMap }) {
  const [expandedProject, setExpandedProject] = useState(null);
  const name = staffRec.display_name || staffRec.full_name || "—";

  const totalHours = myDates.reduce((s, d) => s + (d.total_work_hour || 0), 0);
  const reportDays = myDates.length;
  const taskCount = myTasks.length;
  const avgDaily = reportDays > 0 ? (totalHours / reportDays).toFixed(1) : "0";

  const kpiScores = myKpis.filter(k => k.score).map(k => k.score);
  const avgKpi = kpiScores.length > 0 ? Math.round(kpiScores.reduce((a, b) => a + b, 0) / kpiScores.length * 10) / 10 : null;
  const totalSales = myKpis.reduce((s, k) => s + (k.kpi_sales || 0), 0);

  const resolveTaskTypeName = (t) => {
    if (t.task_type_id) { const tt = taskTypeMap[t.task_type_id]; if (tt) return tt.display; }
    if (t.task_id) { const nt = nosTaskMap[t.task_id]; if (nt?.task_type_ids?.length) { const tt = taskTypeMap[nt.task_type_ids[0]]; if (tt) return tt.display; } }
    return t.task_type_name || "";
  };
  const resolveTaskName = (t) => {
    if (t.task_id) { const nt = nosTaskMap[t.task_id]; if (nt) return nt.display; }
    return t.task_name || t.keywords || "—";
  };

  const typeBreakdown = useMemo(() => {
    const map = {};
    for (const t of myTasks) {
      const type = resolveTaskTypeName(t) || "未分類";
      if (!map[type]) map[type] = { name: type, hours: 0, count: 0 };
      map[type].hours += t.work_hour || 0;
      map[type].count++;
    }
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [myTasks]);

  const projectBreakdown = useMemo(() => {
    const map = {};
    for (const t of myTasks) {
      const proj = projectMap[t.project_id];
      const projName = t.project_name || proj?.display_name || "未指定項目";
      if (!map[projName]) map[projName] = { name: projName, hours: 0, count: 0, tasksByType: {} };
      map[projName].hours += t.work_hour || 0;
      map[projName].count++;
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
  }, [myTasks, projectMap]);

  const pieData = typeBreakdown.slice(0, 6).map(t => ({
    name: t.name,
    value: Math.round(t.hours * 10) / 10,
  }));

  return (
    <div className="space-y-3 overflow-y-auto h-full pr-1">
      {/* Staff info */}
      <div className="flex items-center gap-3">
        {staffRec.profile_pic ? (
          <img src={staffRec.profile_pic} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
            {name[0]}
          </div>
        )}
        <div>
          <div className="font-bold text-sm text-gray-900">{name}</div>
          <div className="text-xs text-gray-400">{staffRec.position || ""} · {staffRec.team_name || ""} · {staffRec.bu_name || ""}</div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
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

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-xs font-bold text-gray-600 mb-2">📊 任務類型分佈</h5>
          <div className="flex items-center gap-3">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}h`, "工時"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="flex-1 truncate text-gray-700">{item.name}</span>
                  <span className="font-bold text-gray-600">{item.value}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Projects */}
      {projectBreakdown.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-xs font-bold text-gray-600 mb-2">🚀 參與項目</h5>
          <div className="space-y-1">
            {projectBreakdown.slice(0, 10).map((p, i) => {
              const isOpen = expandedProject === p.name;
              return (
                <div key={i}>
                  <button className="w-full flex items-center gap-2 text-xs py-1 px-1 rounded hover:bg-gray-100 text-left"
                    onClick={() => setExpandedProject(isOpen ? null : p.name)}>
                    <span className="text-gray-400 shrink-0">{isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-700 truncate block">{p.name}</span>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-0.5">
                        <div className="h-1 rounded-full bg-indigo-400" style={{ width: `${Math.min(100, (p.hours / (projectBreakdown[0]?.hours || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="font-bold text-indigo-600 shrink-0 text-[11px]">{Math.round(p.hours * 10) / 10}h</span>
                  </button>
                  {isOpen && (
                    <div className="ml-5 mt-1 mb-2 space-y-1.5 border-l-2 border-indigo-200 pl-2">
                      {p.tasksByType.map((tt, j) => (
                        <div key={j}>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[j % COLORS.length] }} />
                            <span className="flex-1 truncate">{tt.name}</span>
                            <span className="text-blue-600">{Math.round(tt.hours * 10) / 10}h</span>
                          </div>
                          <div className="ml-3 space-y-0.5">
                            {tt.tasks.map((task, k) => (
                              <div key={k} className="flex items-center gap-1 text-[10px] text-gray-500">
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

      {/* KPI */}
      {myKpis.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-xs font-bold text-gray-600 mb-2">🎯 KPI 記錄 ({myKpis.length}筆)</h5>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {myKpis.map((k, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] bg-white rounded-lg px-2 py-1 border border-gray-100">
                <span className="flex-1 truncate text-gray-700">{k.project_name || k.key_achievement || "KPI 項目"}</span>
                {k.score && <span className={`font-bold px-1 py-0.5 rounded text-[10px] ${k.score >= 80 ? "bg-green-100 text-green-700" : k.score >= 60 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>{k.score}</span>}
              </div>
            ))}
          </div>
          {totalSales > 0 && <div className="text-[11px] text-right mt-1 text-blue-600 font-bold">總銷售額: ${Math.round(totalSales).toLocaleString()}</div>}
        </div>
      )}
    </div>
  );
}