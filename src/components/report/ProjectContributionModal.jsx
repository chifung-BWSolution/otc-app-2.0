import { useMemo } from "react";
import { X, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];

export default function ProjectContributionModal({ projectName, projectBubbleId, allTasks, dateToStaff, allStaff, staffMap, onClose }) {
  // Find all tasks for this project across all staff
  const contributions = useMemo(() => {
    const hoursByStaff = {};
    const tasksByStaff = {};

    for (const t of allTasks) {
      // Match by project_id (bubble_id) or project_name
      const matchById = projectBubbleId && t.project_id === projectBubbleId;
      const matchByName = t.project_name === projectName;
      if (!matchById && !matchByName) continue;

      const sid = dateToStaff[t.man_hour_date_id];
      if (!sid) continue;

      if (!hoursByStaff[sid]) hoursByStaff[sid] = 0;
      if (!tasksByStaff[sid]) tasksByStaff[sid] = 0;
      hoursByStaff[sid] += t.work_hour || 0;
      tasksByStaff[sid] += 1;
    }

    return Object.entries(hoursByStaff)
      .map(([staffBubbleId, hours]) => {
        const staffRec = staffMap[staffBubbleId];
        const name = staffRec?.display_name || staffBubbleId;
        const team = staffRec?.team_name || "";
        const position = staffRec?.position || "";
        return {
          staffBubbleId,
          name,
          team,
          position,
          hours: Math.round(hours * 10) / 10,
          tasks: tasksByStaff[staffBubbleId] || 0,
        };
      })
      .sort((a, b) => b.hours - a.hours);
  }, [projectName, projectBubbleId, allTasks, dateToStaff, staffMap]);

  const totalHours = contributions.reduce((s, c) => s + c.hours, 0);
  const totalTasks = contributions.reduce((s, c) => s + c.tasks, 0);

  const chartData = contributions.slice(0, 15).map((c, i) => ({
    name: c.name.length > 6 ? c.name.slice(0, 6) + ".." : c.name,
    fullName: c.name,
    hours: c.hours,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              項目工時貢獻
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 max-w-md truncate">{projectName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
              <div className="text-xl font-bold text-indigo-600">{contributions.length}</div>
              <div className="text-xs text-gray-500">參與人數</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <div className="text-xl font-bold text-blue-600">{Math.round(totalHours * 10) / 10}h</div>
              <div className="text-xs text-gray-500">總投入工時</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
              <div className="text-xl font-bold text-green-600">{totalTasks}</div>
              <div className="text-xs text-gray-500">總任務數</div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-600 mb-2">📊 各員工工時分佈</h4>
              <ResponsiveContainer width="100%" height={Math.max(120, chartData.length * 30)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip
                    formatter={(v) => [`${v}h`, "工時"]}
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
          )}

          {/* Detail table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-semibold">
                  <th className="px-4 py-2.5 text-left">員工</th>
                  <th className="px-4 py-2.5 text-left">Team</th>
                  <th className="px-4 py-2.5 text-left">職位</th>
                  <th className="px-4 py-2.5 text-right">任務數</th>
                  <th className="px-4 py-2.5 text-right">工時</th>
                  <th className="px-4 py-2.5 text-right">佔比</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c, i) => {
                  const pct = totalHours > 0 ? Math.round(c.hours / totalHours * 100) : 0;
                  return (
                    <tr key={c.staffBubbleId} className="border-b border-gray-50 hover:bg-blue-50/30">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-medium text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-blue-600">{c.team || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{c.position || "—"}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{c.tasks}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-indigo-600">{c.hours}h</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {contributions.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Users size={24} className="mx-auto mb-1 opacity-30" />
                暫無其他員工參與此項目
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}