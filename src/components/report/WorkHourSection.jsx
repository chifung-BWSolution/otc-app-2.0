import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ReportStatCard from "./ReportStatCard";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];

export default function WorkHourSection({ dates, tasks, staffMap, taskTypeMap, nosTaskMap }) {
  // Aggregate by staff
  const staffSummary = useMemo(() => {
    const map = {};
    for (const d of dates) {
      const sid = d.staff_id;
      if (!sid) continue;
      if (!map[sid]) map[sid] = { staffId: sid, totalHours: 0, dateCount: 0, taskCount: 0 };
      map[sid].totalHours += d.total_work_hour || 0;
      map[sid].dateCount += 1;
    }
    const dateToStaff = {};
    for (const d of dates) {
      if (d.bubble_id && d.staff_id) dateToStaff[d.bubble_id] = d.staff_id;
    }
    for (const t of tasks) {
      const sid = dateToStaff[t.man_hour_date_id];
      if (sid && map[sid]) map[sid].taskCount++;
    }
    return Object.values(map)
      .map(s => {
        const staffRec = staffMap[s.staffId];
        const name = staffRec?.display_name || s.staffId;
        return { ...s, name, team: staffRec?.team_name || "", bu: staffRec?.bu_name || "" };
      })
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [dates, tasks, staffMap]);

  // Resolve task type name
  const resolveTaskTypeName = (t) => {
    if (t.task_type_id) {
      const tt = taskTypeMap[t.task_type_id];
      if (tt) return tt.display;
    }
    if (t.task_id) {
      const nosTask = nosTaskMap[t.task_id];
      if (nosTask?.task_type_ids?.length) {
        const tt = taskTypeMap[nosTask.task_type_ids[0]];
        if (tt) return tt.display;
      }
    }
    return t.task_type_name || "";
  };

  // By task type
  const taskTypeSummary = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const type = resolveTaskTypeName(t) || t.task_name || "未分類";
      if (!map[type]) map[type] = { name: type, hours: 0, count: 0 };
      map[type].hours += t.work_hour || 0;
      map[type].count++;
    }
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [tasks, taskTypeMap, nosTaskMap]);

  // By team
  const teamSummary = useMemo(() => {
    const map = {};
    for (const s of staffSummary) {
      const team = s.team || "未分組";
      if (!map[team]) map[team] = { name: team, hours: 0, count: 0 };
      map[team].hours += s.totalHours;
      map[team].count++;
    }
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [staffSummary]);

  const totalHours = staffSummary.reduce((s, r) => s + r.totalHours, 0);
  const totalTasks = tasks.length;
  const activeStaffCount = staffSummary.filter(s => s.totalHours > 0).length;
  const avgHoursPerStaff = activeStaffCount > 0 ? (totalHours / activeStaffCount).toFixed(1) : 0;

  const top10Staff = staffSummary.slice(0, 10).map(s => ({
    name: s.name.length > 8 ? s.name.slice(0, 8) + ".." : s.name,
    hours: Math.round(s.totalHours * 10) / 10,
  }));

  const top8Types = taskTypeSummary.slice(0, 8).map(t => ({
    name: t.name.length > 10 ? t.name.slice(0, 10) + ".." : t.name,
    value: Math.round(t.hours * 10) / 10,
  }));

  const teamChart = teamSummary.slice(0, 8).map(t => ({
    name: t.name.length > 10 ? t.name.slice(0, 10) + ".." : t.name,
    hours: Math.round(t.hours * 10) / 10,
    avgHours: t.count > 0 ? Math.round(t.hours / t.count * 10) / 10 : 0,
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">📊 工時分析</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportStatCard label="總工時" value={`${Math.round(totalHours).toLocaleString()}h`} color="blue" />
        <ReportStatCard label="總任務數" value={totalTasks.toLocaleString()} color="green" />
        <ReportStatCard label="匯報人數" value={activeStaffCount} color="purple" />
        <ReportStatCard label="人均工時" value={`${avgHoursPerStaff}h`} color="orange" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">🏆 Top 10 員工工時</h4>
          {top10Staff.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={top10Staff} layout="vertical" margin={{ left: 10 }}>
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
          <h4 className="text-sm font-bold text-gray-700 mb-3">📊 任務類型分佈（工時）</h4>
          {top8Types.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={top8Types} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#ccc", strokeWidth: 1 }}>
                  {top8Types.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}h`, "工時"]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-10 text-gray-400 text-sm">暫無數據</div>}
        </div>
      </div>

      {/* Team hours comparison */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h4 className="text-sm font-bold text-gray-700 mb-3">👥 各 Team 工時對比</h4>
        {teamChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={teamChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="總工時" />
              <Bar dataKey="avgHours" fill="#14b8a6" radius={[4, 4, 0, 0]} name="人均工時" />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="text-center py-10 text-gray-400 text-sm">暫無數據</div>}
      </div>
    </div>
  );
}