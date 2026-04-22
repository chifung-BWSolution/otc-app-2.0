import { useState, useEffect, useMemo, Fragment } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart2, Clock, Users, Search, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];

function StatCard({ label, value, sub, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    green: "bg-green-50 border-green-100 text-green-600",
    purple: "bg-purple-50 border-purple-100 text-purple-600",
    orange: "bg-orange-50 border-orange-100 text-orange-600",
  };
  return (
    <div className={`rounded-xl p-3 border text-center ${colors[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

async function loadAllRecords(entity, sort = "id", batchSize = 5000) {
  const all = [];
  let offset = 0;
  while (true) {
    const batch = await entity.filter({}, sort, batchSize, offset);
    all.push(...batch);
    if (batch.length < batchSize) break;
    offset += batch.length;
  }
  return all;
}

export default function ManHourReport() {
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dateRange, setDateRange] = useState("30"); // days
  const [search, setSearch] = useState("");
  const [expandedStaff, setExpandedStaff] = useState(null);

  useEffect(() => { loadData(); }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(dateRange));
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const [dateList, staffList, projectList] = await Promise.all([
      base44.entities.BubbleManHourDate.filter({}, "-report_date", 5000),
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 500),
      loadAllRecords(base44.entities.BubbleProject, "display_name"),
    ]);

    // Filter dates within range
    const filteredDates = dateList.filter(d => d.report_date && d.report_date >= cutoffStr);
    setDates(filteredDates);
    setStaff(staffList);
    setProjects(projectList);

    // Load tasks linked to these dates
    const dateIds = new Set(filteredDates.map(d => d.bubble_id).filter(Boolean));
    const taskList = await base44.entities.BubbleManHourTask.filter({}, "-created_date", 5000);
    const filteredTasks = taskList.filter(t => dateIds.has(t.man_hour_date_id));
    setTasks(filteredTasks);
    setLoading(false);
  };

  // Build staff lookup by bubble_id
  const staffMap = useMemo(() => {
    const m = {};
    for (const s of staff) {
      if (s.bubble_id) m[s.bubble_id] = s;
    }
    return m;
  }, [staff]);

  // Build project lookup by bubble_id
  const projectMap = useMemo(() => {
    const m = {};
    for (const p of projects) {
      if (p.bubble_id) m[p.bubble_id] = p;
    }
    return m;
  }, [projects]);

  // Aggregate by staff
  const staffSummary = useMemo(() => {
    const map = {};
    for (const d of dates) {
      const sid = d.staff_id;
      if (!sid) continue;
      if (!map[sid]) map[sid] = { staffId: sid, totalHours: 0, dateCount: 0, taskCount: 0, tasks: [] };
      map[sid].totalHours += d.total_work_hour || 0;
      map[sid].dateCount += 1;
    }
    // Count tasks per staff via date linkage
    const dateToStaff = {};
    for (const d of dates) {
      if (d.bubble_id && d.staff_id) dateToStaff[d.bubble_id] = d.staff_id;
    }
    for (const t of tasks) {
      const sid = dateToStaff[t.man_hour_date_id];
      if (sid && map[sid]) {
        map[sid].taskCount += 1;
        map[sid].tasks.push(t);
      }
    }

    // Also build staff_name from ManHourDate for fallback
    const dateStaffNames = {};
    for (const d of dates) {
      if (d.staff_id && d.staff_name) dateStaffNames[d.staff_id] = d.staff_name;
    }

    return Object.values(map)
      .map(s => {
        const staffRec = staffMap[s.staffId];
        const name = staffRec?.display_name || dateStaffNames[s.staffId] || s.staffId;
        return { ...s, name, team: staffRec?.team_name || "", bu: staffRec?.bu_name || "" };
      })
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [dates, tasks, staffMap]);

  // Filter by search
  const filteredSummary = useMemo(() => {
    if (!search) return staffSummary;
    const q = search.toLowerCase();
    return staffSummary.filter(s =>
      s.name.toLowerCase().includes(q) || s.team.toLowerCase().includes(q) || s.bu.toLowerCase().includes(q)
    );
  }, [staffSummary, search]);

  // Aggregate by task type (use task_type_name or task_type_id as fallback)
  const taskTypeSummary = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const type = t.task_type_name || t.task_name || t.task_type_id || "未分類";
      if (!map[type]) map[type] = { name: type, hours: 0, count: 0 };
      map[type].hours += t.work_hour || 0;
      map[type].count += 1;
    }
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [tasks]);

  // Top 10 for charts
  const top10Staff = filteredSummary.slice(0, 10).map(s => ({ name: s.name.length > 8 ? s.name.slice(0, 8) + ".." : s.name, hours: Math.round(s.totalHours * 10) / 10 }));
  const top8TaskTypes = taskTypeSummary.slice(0, 8).map(t => ({ name: t.name.length > 10 ? t.name.slice(0, 10) + ".." : t.name, value: Math.round(t.hours * 10) / 10 }));

  const totalHours = staffSummary.reduce((s, r) => s + r.totalHours, 0);
  const totalTasks = tasks.length;
  const activeStaffCount = staffSummary.filter(s => s.totalHours > 0).length;
  const avgHoursPerStaff = activeStaffCount > 0 ? (totalHours / activeStaffCount).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={20} className="text-green-500" /> 工作匯報報告
          </h2>
          <p className="text-xs text-gray-400">Man Hour Task 工時數據分析</p>
        </div>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="7">最近 7 天</option>
          <option value="14">最近 14 天</option>
          <option value="30">最近 30 天</option>
          <option value="60">最近 60 天</option>
          <option value="90">最近 90 天</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="總工時" value={`${Math.round(totalHours).toLocaleString()}h`} color="blue" />
        <StatCard label="總任務數" value={totalTasks.toLocaleString()} color="green" />
        <StatCard label="匯報人數" value={activeStaffCount} color="purple" />
        <StatCard label="人均工時" value={`${avgHoursPerStaff}h`} color="orange" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top staff by hours */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">🏆 Top 10 員工工時</h3>
          {top10Staff.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={top10Staff} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={(v) => [`${v}h`, "工時"]} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-10 text-gray-400 text-sm">暫無數據</div>}
        </div>

        {/* Task type distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📊 任務類型分佈（工時）</h3>
          {top8TaskTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={top8TaskTypes} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#ccc", strokeWidth: 1 }}>
                  {top8TaskTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}h`, "工時"]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-10 text-gray-400 text-sm">暫無數據</div>}
        </div>
      </div>

      {/* Staff detail table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <Users size={14} /> 員工工時明細
          </h3>
          <div className="relative flex-1 max-w-64 ml-auto">
            <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input className="w-full pl-7 pr-2 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="搜尋姓名、Team..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold bg-gray-50">
                <th className="px-4 py-2.5 text-left w-8"></th>
                <th className="px-4 py-2.5 text-left">員工</th>
                <th className="px-4 py-2.5 text-left">Team / BU</th>
                <th className="px-4 py-2.5 text-right">匯報天數</th>
                <th className="px-4 py-2.5 text-right">任務數</th>
                <th className="px-4 py-2.5 text-right">總工時</th>
                <th className="px-4 py-2.5 text-right">日均工時</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummary.map(s => {
                const isExpanded = expandedStaff === s.staffId;
                const avgDaily = s.dateCount > 0 ? (s.totalHours / s.dateCount).toFixed(1) : "0";
                return (
                  <Fragment key={s.staffId}>
                    <tr className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                      onClick={() => setExpandedStaff(isExpanded ? null : s.staffId)}>
                      <td className="px-4 py-2.5 text-gray-400">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className="text-blue-600 font-medium">{s.team || "—"}</span>
                        <span className="text-gray-400 ml-1">{s.bu}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{s.dateCount}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{s.taskCount}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-600">{Math.round(s.totalHours * 10) / 10}h</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{avgDaily}h</td>
                    </tr>
                    {isExpanded && s.tasks.length > 0 && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50/70 px-6 py-2">
                          <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
                            <div className="flex gap-2 text-[10px] text-gray-400 font-semibold border-b border-gray-200 pb-1">
                              <span className="w-28">任務名稱</span>
                              <span className="w-32">項目</span>
                              <span className="w-20">任務類型</span>
                              <span className="w-14 text-right">工時</span>
                              <span className="flex-1">描述</span>
                            </div>
                            {s.tasks.slice(0, 30).map((t, i) => {
                              const proj = projectMap[t.project_id];
                              const projName = t.project_name || proj?.display_name || proj?.pic_name || "";
                              return (
                              <div key={i} className="flex gap-2 text-gray-600">
                                <span className="w-28 truncate font-medium">{t.task_name || t.keywords || "—"}</span>
                                <span className="w-32 truncate text-gray-400">{projName || "—"}</span>
                                <span className="w-20 truncate">{t.task_type_name || "—"}</span>
                                <span className="w-14 text-right font-semibold text-blue-600">{t.work_hour || 0}h</span>
                                <span className="flex-1 truncate text-gray-400">{t.task_description || ""}</span>
                              </div>
                              );
                            })}
                            {s.tasks.length > 30 && <div className="text-gray-400 text-center">...還有 {s.tasks.length - 30} 筆</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSummary.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">
            <Clock size={28} className="mx-auto mb-2 opacity-30" />
            暫無匯報數據
          </div>
        )}
      </div>
    </div>
  );
}