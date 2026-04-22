import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

export default function StaffComparePanel({ currentStaff, compareStaff, allDates, allTasks, dateToStaff }) {
  const staffList = useMemo(() => [currentStaff, ...compareStaff], [currentStaff, compareStaff]);

  const chartData = useMemo(() => {
    // Build hours per staff
    const hoursByStaff = {};
    const tasksByStaff = {};
    const daysByStaff = {};
    for (const d of allDates) {
      if (!d.staff_id) continue;
      hoursByStaff[d.staff_id] = (hoursByStaff[d.staff_id] || 0) + (d.total_work_hour || 0);
      daysByStaff[d.staff_id] = (daysByStaff[d.staff_id] || 0) + 1;
    }
    for (const t of allTasks) {
      const sid = dateToStaff[t.man_hour_date_id];
      if (sid) tasksByStaff[sid] = (tasksByStaff[sid] || 0) + 1;
    }

    return staffList.map((s, i) => {
      const bid = s.bubble_id;
      const hours = Math.round((hoursByStaff[bid] || 0) * 10) / 10;
      const tasks = tasksByStaff[bid] || 0;
      const days = daysByStaff[bid] || 0;
      const avgDaily = days > 0 ? Math.round((hours / days) * 10) / 10 : 0;
      return {
        name: s.display_name?.length > 6 ? s.display_name.slice(0, 6) + ".." : s.display_name || "—",
        fullName: s.display_name,
        hours,
        tasks,
        days,
        avgDaily,
        fill: i === 0 ? "#8b5cf6" : COLORS[(i) % COLORS.length],
      };
    });
  }, [staffList, allDates, allTasks, dateToStaff]);

  if (compareStaff.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h4 className="text-sm font-bold text-gray-800">📊 員工比較（共 {chartData.length} 人）</h4>

      {/* Hours comparison bar chart */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-1">總工時比較</div>
        <ResponsiveContainer width="100%" height={Math.max(120, chartData.length * 32)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 5, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
            <Tooltip
              formatter={(v, name) => [`${v}${name === "hours" ? "h" : ""}`, name === "hours" ? "工時" : name]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
            />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 font-semibold">
              <th className="py-1.5 text-left">員工</th>
              <th className="py-1.5 text-right">總工時</th>
              <th className="py-1.5 text-right">任務數</th>
              <th className="py-1.5 text-right">匯報天</th>
              <th className="py-1.5 text-right">日均工時</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((d, i) => (
              <tr key={i} className={`border-b border-gray-50 ${i === 0 ? "bg-purple-50/50 font-semibold" : ""}`}>
                <td className="py-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-gray-800">{d.fullName}</span>
                  {i === 0 && <span className="text-[9px] bg-purple-200 text-purple-700 px-1 rounded">本人</span>}
                </td>
                <td className="py-1.5 text-right text-blue-600 font-bold">{d.hours}h</td>
                <td className="py-1.5 text-right text-gray-600">{d.tasks}</td>
                <td className="py-1.5 text-right text-gray-600">{d.days}</td>
                <td className="py-1.5 text-right text-orange-600">{d.avgDaily}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}