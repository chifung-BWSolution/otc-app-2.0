import { useState, useEffect, useMemo, Fragment } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart2, Clock, Users, Search, ChevronDown, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DateRangeFilter from "@/components/report/DateRangeFilter";

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
  const [taskTypes, setTaskTypes] = useState([]);
  const [nosTasks, setNosTasks] = useState([]);
  const [clockins, setClockins] = useState([]);
  const [dateRange, setDateRange] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [expandedStaff, setExpandedStaff] = useState(null);

  useEffect(() => { loadData(); }, [dateRange, customFrom, customTo]);

  const loadData = async () => {
    setLoading(true);
    let cutoffStr, endStr;
    if (customFrom && customTo) {
      cutoffStr = customFrom;
      endStr = customTo;
    } else {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(dateRange));
      cutoffStr = cutoff.toISOString().split("T")[0];
      endStr = new Date().toISOString().split("T")[0];
    }

    const [dateList, allStaffList, projectList, taskTypeList, nosTaskList, clockinList] = await Promise.all([
      loadAllRecords(base44.entities.BubbleManHourDate, "-report_date"),
      base44.entities.Staff.list("display_name", 1000),  // Load ALL staff for clockin name matching
      loadAllRecords(base44.entities.BubbleProject, "display_name"),
      base44.entities.NOSTaskType.filter({}, "display", 200),
      loadAllRecords(base44.entities.NOSTask, "display"),
      loadAllRecords(base44.entities.BubbleClockin, "id"),
    ]);
    const staffList = allStaffList.filter(s => s.o_status === "Active");

    // report_date formats: "2026-03-01" (YYYY-MM-DD), "2026-03-01T16:00:00.000Z" (legacy ISO), "1/3/2026 0:00" (D/M/YYYY)
    const toReportDate = (val) => {
      if (!val) return null;
      // Already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      // D/M/YYYY or D/M/YYYY H:MM format
      const cleaned = val.split(' ')[0];
      const parts = cleaned.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      // Legacy ISO format: convert UTC to HKT (UTC+8)
      if (val.includes('T')) {
        const d = new Date(val);
        const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
        return hkt.toISOString().slice(0, 10);
      }
      return null;
    };
    const filteredDates = dateList.filter(d => {
      const rd = toReportDate(d.report_date);
      return rd && rd >= cutoffStr && rd <= endStr;
    });
    // Attach report date to each record for downstream use
    for (const d of filteredDates) { d._localDate = toReportDate(d.report_date); }
    setDates(filteredDates);
    setStaff(allStaffList);  // Store all staff for clockin name matching
    setProjects(projectList);
    setTaskTypes(taskTypeList);
    setNosTasks(nosTaskList);

    // Filter clockins within range
    const parseCkDate = (t) => {
      if (!t) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
      // D/M/YYYY or D/M/YYYY H:MM format
      const cleaned = t.split(" ")[0];
      const slashParts = cleaned.split("/");
      if (slashParts.length === 3) {
        const [d2, m, y] = slashParts;
        return `${y}-${m.padStart(2, "0")}-${d2.padStart(2, "0")}`;
      }
      // Legacy ISO format
      if (t.includes("T")) {
        const d2 = new Date(t);
        const hkt = new Date(d2.getTime() + 8 * 60 * 60 * 1000);
        return hkt.toISOString().slice(0, 10);
      }
      return null;
    };
    const filteredClockins = clockinList.filter(c => {
      const d = parseCkDate(c.clockin_time);
      return d && d >= cutoffStr && d <= endStr;
    });
    setClockins(filteredClockins);


    const dateIds = new Set(filteredDates.map(d => d.bubble_id).filter(Boolean));
    const taskList = await loadAllRecords(base44.entities.BubbleManHourTask, "-created_date");
    setTasks(taskList.filter(t => dateIds.has(t.man_hour_date_id)));
    setLoading(false);
  };

  // Lookups
  const dateMap = useMemo(() => {
    const m = {};
    for (const d of dates) {
      if (d.bubble_id) m[d.bubble_id] = d._localDate || d.report_date?.slice(0, 10);
    }
    return m;
  }, [dates]);

  const staffMap = useMemo(() => {
    const m = {};
    for (const s of staff) { if (s.bubble_id) m[s.bubble_id] = s; }
    return m;
  }, [staff]);

  const projectMap = useMemo(() => {
    const m = {};
    for (const p of projects) { if (p.bubble_id) m[p.bubble_id] = p; }
    return m;
  }, [projects]);

  const taskTypeMap = useMemo(() => {
    const m = {};
    for (const tt of taskTypes) { if (tt.bubble_id) m[tt.bubble_id] = tt; }
    return m;
  }, [taskTypes]);

  const nosTaskMap = useMemo(() => {
    const m = {};
    for (const t of nosTasks) { if (t.bubble_id) m[t.bubble_id] = t; }
    return m;
  }, [nosTasks]);

  // Build staff name -> bubble_id lookup for clockin matching
  const staffNameToBubbleId = useMemo(() => {
    const m = {};
    for (const s of staff) {
      if (s.bubble_id && s.display_name) m[s.display_name] = s.bubble_id;
    }
    return m;
  }, [staff]);

  // Parse any date format to YYYY-MM-DD
  const parseClockinDate = (val) => {
    if (!val) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // D/M/YYYY or D/M/YYYY H:MM format
    const cleaned = val.split(" ")[0];
    const parts = cleaned.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    // Legacy ISO format
    if (val.includes("T")) {
      const d = new Date(val);
      const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
      return hkt.toISOString().slice(0, 10);
    }
    return null;
  };

  // Clockin work days per staff (by staff_name -> bubble_id)
  const clockinDaysByStaff = useMemo(() => {
    const m = {}; // staff_bubble_id -> Set of dates
    for (const c of clockins) {
      if (!c.staff_name || !c.clockin_time) continue;
      const bubbleId = c.staff_id || staffNameToBubbleId[c.staff_name];
      if (!bubbleId) continue;
      const d = parseClockinDate(c.clockin_time);
      if (!d) continue;
      if (!m[bubbleId]) m[bubbleId] = new Set();
      m[bubbleId].add(d);
    }
    return m;
  }, [clockins, staffNameToBubbleId]);

  // Aggregate by staff
  const staffSummary = useMemo(() => {
    const map = {};
    const reportDatesByStaff = {}; // staff_id -> Set of unique local dates
    for (const d of dates) {
      const sid = d.staff_id;
      if (!sid) continue;
      if (!map[sid]) map[sid] = { staffId: sid, totalHours: 0, taskCount: 0 };
      map[sid].totalHours += d.total_work_hour || 0;
      if (!reportDatesByStaff[sid]) reportDatesByStaff[sid] = new Set();
      if (d._localDate) reportDatesByStaff[sid].add(d._localDate);
    }
    // Set dateCount from unique dates, not raw record count
    for (const sid of Object.keys(map)) {
      map[sid].dateCount = reportDatesByStaff[sid]?.size || 0;
    }

    const dateToStaff = {};
    for (const d of dates) {
      if (d.bubble_id && d.staff_id) dateToStaff[d.bubble_id] = d.staff_id;
    }
    for (const t of tasks) {
      const sid = dateToStaff[t.man_hour_date_id];
      if (sid && map[sid]) map[sid].taskCount += 1;
    }

    return Object.values(map)
      .map(s => {
        const staffRec = staffMap[s.staffId];
        const name = staffRec?.display_name || s.staffId;
        const workDaysSet = clockinDaysByStaff[s.staffId];
        const workDays = workDaysSet ? workDaysSet.size : 0;
        const reportDatesSet = reportDatesByStaff[s.staffId] || new Set();
        // Missing dates: clockin exists but no man hour report
        const missingDates = workDaysSet
          ? [...workDaysSet].filter(d => !reportDatesSet.has(d)).sort()
          : [];
        return { ...s, name, team: staffRec?.team_name || "", bu: staffRec?.bu_name || "", workDays, missingDates };
      })
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [dates, tasks, staffMap, clockinDaysByStaff]);

  const filteredSummary = useMemo(() => {
    if (!search) return staffSummary;
    const q = search.toLowerCase();
    return staffSummary.filter(s =>
      s.name.toLowerCase().includes(q) || s.team.toLowerCase().includes(q) || s.bu.toLowerCase().includes(q)
    );
  }, [staffSummary, search]);

  // Resolve helpers
  const resolveTaskTypeName = (t) => {
    if (t.task_type_id) { const tt = taskTypeMap[t.task_type_id]; if (tt) return tt.display; }
    if (t.task_id) { const nosTask = nosTaskMap[t.task_id]; if (nosTask?.task_type_ids?.length) { const tt = taskTypeMap[nosTask.task_type_ids[0]]; if (tt) return tt.display; } }
    if (t.task_type_name) return t.task_type_name;
    return "";
  };

  // Task type summary
  const taskTypeSummary = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const type = resolveTaskTypeName(t) || t.task_name || "未分類";
      if (!map[type]) map[type] = { name: type, hours: 0, count: 0 };
      map[type].hours += t.work_hour || 0;
      map[type].count += 1;
    }
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [tasks, taskTypeMap, nosTaskMap]);

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
        <DateRangeFilter
          dateRange={dateRange}
          customFrom={customFrom}
          customTo={customTo}
          onPresetChange={(v) => { setCustomFrom(""); setCustomTo(""); setDateRange(v); }}
          onCustomChange={(from, to) => { setCustomFrom(from); setCustomTo(to); }}
        />
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
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold bg-gray-50">
                <th className="px-4 py-2.5 text-left w-8"></th>
                <th className="px-4 py-2.5 text-left">員工</th>
                <th className="px-4 py-2.5 text-left">Team / BU</th>
                <th className="px-4 py-2.5 text-right">上班日</th>
                <th className="px-4 py-2.5 text-right">匯報天</th>
                <th className="px-4 py-2.5 text-right">任務數</th>
                <th className="px-4 py-2.5 text-right">總工時</th>
                <th className="px-4 py-2.5 text-right">日均工時</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummary.map(s => {
                const isExpanded = expandedStaff === s.staffId;
                const avgDaily = s.dateCount > 0 ? (s.totalHours / s.dateCount).toFixed(1) : "0";
                const hasMissing = s.missingDates.length > 0;
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
                      <td className="px-4 py-2.5 text-right text-gray-600">{s.workDays}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={hasMissing ? "text-orange-600 font-semibold" : "text-gray-600"}>
                          {s.dateCount}
                        </span>
                        {hasMissing && (
                          <span className="text-[10px] text-orange-500 ml-1" title={`${s.missingDates.length} 日未報`}>
                            (-{s.missingDates.length})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{s.taskCount}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-600">{Math.round(s.totalHours * 10) / 10}h</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{avgDaily}h</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="bg-gray-50/70 px-6 py-3">
                          {hasMissing ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                                <AlertTriangle size={12} />
                                有打卡但未提交工時匯報的日期（{s.missingDates.length} 日）
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {s.missingDates.map(d => (
                                  <span key={d} className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg font-medium">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-green-600 flex items-center gap-1.5 font-medium">
                              ✅ 所有上班日均已提交匯報
                            </div>
                          )}
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